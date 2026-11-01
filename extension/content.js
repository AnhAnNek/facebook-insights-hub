// Content script chạy trên Facebook Stories & Kho Lưu Trữ Tin (>24h)
console.log('[Facebook Insights Collector] Content script v2.0 đã tải và sẵn sàng.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SCAN_CURRENT_STORY') {
    try {
      const data = extractStoryData();
      sendResponse({ success: true, data });
    } catch (err) {
      console.error('[Facebook Insights Collector] Lỗi quét:', err);
      sendResponse({ success: false, error: err.message });
    }
  } else if (request.action === 'SCROLL_AND_SCAN') {
    // Tự động cuộn danh sách người xem để cào toàn bộ danh sách khi có thanh cuộn
    autoScrollAndCollectViewers(request.maxScrolls || 25, 350)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => {
        console.error('[Facebook Insights Collector] Lỗi cuộn & quét:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async sendResponse
  }
  return true;
});

// Tìm container cuộn danh sách người xem (Viewer Drawer trong ảnh người dùng gửi)
function findViewerScrollContainers() {
  const elements = document.querySelectorAll('div');
  const scrollable = [];
  const activityPattern = /(Active\s*(now|\d+[mhwd]\s*ago)|Hoạt động\s*(\d+\s*phút|\d+\s*giờ|\d+\s*ngày|xong|ngay)|Đang hoạt động|vừa mới)/i;

  for (const el of elements) {
    if (el.clientHeight > 120 && el.scrollHeight > el.clientHeight + 10) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        const text = el.innerText || '';
        if (activityPattern.test(text) || text.includes('Active') || text.includes('Hoạt động')) {
          scrollable.push(el);
        }
      }
    }
  }
  return scrollable;
}

// Tự động cuộn danh sách người xem đến đáy để kích hoạt lazy loading của Facebook
async function autoScrollAndCollectViewers(maxScrolls = 20, delayMs = 350) {
  const containers = findViewerScrollContainers();
  if (containers.length > 0) {
    const container = containers[0];
    let prevHeight = 0;
    let stableCount = 0;

    for (let i = 0; i < maxScrolls; i++) {
      container.scrollTop = container.scrollHeight;
      await new Promise(res => setTimeout(res, delayMs));

      if (container.scrollHeight === prevHeight) {
        stableCount++;
        if (stableCount >= 2) break; // Đã cuộn hết đáy danh sách
      } else {
        stableCount = 0;
        prevHeight = container.scrollHeight;
      }
    }
  }
  return extractStoryData();
}

function extractStoryData() {
  const currentUrl = window.location.href;
  const isArchivePage = currentUrl.includes('/archive/stories/');
  const isStoryPage = currentUrl.includes('/stories/') || isArchivePage;

  // 1. Trích xuất thông tin Story từ thanh tiêu đề phía trên
  // Trong hình người dùng gửi: "Trần Văn An 21h 👥"
  let authorName = 'Trần Văn An';
  let privacy = 'Công khai (Public)';
  let storyAge = 'Gần đây (<24h)';
  let isArchived = isArchivePage;

  // Quét thanh thông tin tác giả ở đỉnh Story
  const topSpans = Array.from(document.querySelectorAll('header span, div[role="main"] span, div[data-pagelet*="Story"] span, div[aria-label*="Story" i] span'));
  for (const el of topSpans) {
    const text = el.innerText?.trim();
    if (!text) continue;

    // Nhận diện quyền riêng tư
    if (text.includes('👥')) privacy = 'Bạn bè (Friends)';
    if (text.includes('🌐')) privacy = 'Công khai (Public)';
    if (text.includes('🔒')) privacy = 'Chỉ mình tôi (Only me)';

    // Nhận diện thời gian đăng Story (VD: "21h", "2 ngày trước", "1 tuần trước")
    if (/^\d+\s*[hm]\b/i.test(text) || /^\d+\s*(giờ|phút|ngày|tuần)\s*trước/i.test(text) || /\b(ngày|tháng|năm)\b/i.test(text)) {
      storyAge = text;
      if (text.includes('ngày') || text.includes('tuần') || text.includes('tháng') || isArchivePage) {
        isArchived = true;
      }
    }
  }

  // Tìm tên chủ Story (nằm ở thanh header trên cùng góc trái)
  const headerTexts = document.querySelectorAll('h2, h3, strong, a[role="link"]');
  for (const el of headerTexts) {
    const text = el.innerText?.trim();
    if (text && text.length > 2 && text.length < 35 && !text.includes('\n') && !text.includes('Active') && !text.includes('Hoạt động')) {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < 150 && rect.left < 400) {
        authorName = text.replace(/\s*\d+[hm]\s*.*$/, '').trim();
        break;
      }
    }
  }

  // 2. Trích xuất danh sách Người xem (Viewer Drawer trong ảnh người dùng)
  const viewers = [];
  const processedNames = new Set();

  // Pattern dòng trạng thái hoạt động: "Active 29m ago", "Active now", "Active 1h ago", "Hoạt động 15 phút trước"
  const activityPattern = /(Active\s*(now|\d+[mhwd]\s*ago)|Hoạt động\s*(\d+\s*phút|\d+\s*giờ|\d+\s*ngày|xong|ngay)|Đang hoạt động|vừa mới)/i;

  // Lấy tất cả các thẻ text chứa pattern hoạt động
  const allElements = document.querySelectorAll('span, div');
  for (const el of allElements) {
    if (el.children.length === 0 && activityPattern.test(el.innerText || '')) {
      const activityText = el.innerText.trim();

      // Hàng người xem là khối cha
      const rowContainer = el.closest('div[role="button"]') || 
                           el.closest('div[role="listitem"]') || 
                           el.parentElement?.parentElement;
      if (!rowContainer) continue;

      // Tìm tên người xem: Là text node trong cùng hàng, không phải nhãn activity và không phải icon '...'
      const candidateTexts = Array.from(rowContainer.querySelectorAll('span[dir="auto"], span, strong, div'))
        .map(n => n.innerText?.trim())
        .filter(t => t && t.length > 1 && t.length < 50 && !activityPattern.test(t) && t !== '...' && t !== '·' && !t.includes('\n'));

      const userName = candidateTexts[0];
      if (!userName || processedNames.has(userName) || userName === authorName) continue;

      // Trích xuất link trang cá nhân (nếu Facebook có gắn link thẻ <a>)
      let profileUrl = '';
      const linkEl = rowContainer.querySelector('a[href*="facebook.com/"], a[href^="/"]');
      if (linkEl) {
        let href = linkEl.getAttribute('href') || '';
        if (href.startsWith('/')) href = 'https://www.facebook.com' + href;
        if (!href.includes('/stories/')) profileUrl = href.split('?')[0];
      }

      // Nếu Facebook render dạng popup không có thẻ <a>, tạo link tìm kiếm/trang cá nhân trực tiếp
      if (!profileUrl) {
        profileUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(userName)}`;
      }

      // Trích xuất ảnh đại diện (Avatar)
      let avatarUrl = '';
      const img = rowContainer.querySelector('img, image');
      if (img) {
        const src = img.getAttribute('src') || img.getAttribute('xlink:href');
        if (src && (src.includes('fbcdn') || src.startsWith('http'))) {
          avatarUrl = src;
        }
      }
      if (!avatarUrl) {
        avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userName)}`;
      }

      // Trích xuất cảm xúc (Reaction) nếu người xem thả Tym ❤️ hoặc Like 👍
      let interactionType = 'view';
      const rowHtml = rowContainer.innerHTML.toLowerCase();
      if (rowHtml.includes('heart') || rowHtml.includes('tym') || rowHtml.includes('tim') || rowHtml.includes('love') || rowHtml.includes('yêu thích')) {
        interactionType = 'love';
      } else if (rowHtml.includes('like') || rowHtml.includes('thích')) {
        interactionType = 'like';
      } else if (rowHtml.includes('haha') || rowHtml.includes('cười')) {
        interactionType = 'haha';
      }

      processedNames.add(userName);
      viewers.push({
        user_name: userName,
        user_profile_url: profileUrl,
        interaction_type: interactionType,
        comment_text: activityText, // Lưu nhãn hoạt động như trong hình: "Active 29m ago"
        avatar_url: avatarUrl
      });
    }
  }

  // Thuật toán quét bổ sung: Những người xem không bật trạng thái hoạt động (không có dòng Active)
  const scrollContainers = findViewerScrollContainers();
  for (const container of scrollContainers) {
    const rows = container.querySelectorAll('div[role="button"], div[role="listitem"]');
    for (const row of rows) {
      const texts = Array.from(row.querySelectorAll('span[dir="auto"], span, strong'))
        .map(t => t.innerText?.trim())
        .filter(t => t && t.length > 1 && t.length < 50 && t !== '...' && !t.includes('\n') && !activityPattern.test(t));

      if (texts.length > 0) {
        const userName = texts[0];
        if (processedNames.has(userName) || userName === 'Đóng' || userName === 'Close' || userName === authorName) continue;

        let avatarUrl = '';
        const img = row.querySelector('img, image');
        if (img) {
          const src = img.getAttribute('src') || img.getAttribute('xlink:href');
          if (src && (src.includes('fbcdn') || src.startsWith('http'))) avatarUrl = src;
        }
        if (!avatarUrl) avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userName)}`;

        let profileUrl = '';
        const link = row.querySelector('a[href*="facebook.com/"], a[href^="/"]');
        if (link) {
          let href = link.getAttribute('href') || '';
          if (href.startsWith('/')) href = 'https://www.facebook.com' + href;
          if (!href.includes('/stories/')) profileUrl = href.split('?')[0];
        }
        if (!profileUrl) profileUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(userName)}`;

        processedNames.add(userName);
        viewers.push({
          user_name: userName,
          user_profile_url: profileUrl,
          interaction_type: 'view',
          comment_text: 'Đã xem Story',
          avatar_url: avatarUrl
        });
      }
    }
  }

  return {
    isStoryPage,
    storyUrl: currentUrl,
    authorName,
    privacy,
    storyAge,
    isArchived,
    status: isArchived ? 'archived' : 'active',
    totalViews: viewers.length,
    viewersCount: viewers.length,
    viewers,
    drawerFound: viewers.length > 0
  };
}
