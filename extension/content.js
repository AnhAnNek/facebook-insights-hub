// Content script chạy trên Facebook Stories & Kho Lưu Trữ Tin (>24h)
console.log('[Facebook Insights Collector] Content script v2.1 (Lazy-load Auto Scroller) đã sẵn sàng.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ success: true, message: 'PONG' });
    return true;
  }

  if (request.action === 'SCAN_CURRENT_STORY' || request.action === 'SCROLL_AND_SCAN') {
    const isDeepScan = request.action === 'SCROLL_AND_SCAN';
    const maxSteps = isDeepScan ? 80 : 30; // Quét sâu lên tới 80 lần cuộn nếu danh sách dài

    autoScrollAndCollectAllViewers(maxSteps, 380)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => {
        console.error('[Facebook Insights Collector] Lỗi cuộn & quét:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async sendResponse
  }
  return true;
});

// Tìm phần tử thanh cuộn của danh sách người xem (Viewer Drawer trong Facebook)
function getViewerScrollContainer() {
  const activityPattern = /(Active\s*(now|\d+[mhwd]\s*ago)|Hoạt động\s*(\d+\s*phút|\d+\s*giờ|\d+\s*ngày|xong|ngay)|Đang hoạt động|vừa mới)/i;

  // Chiến lược 1: Đi ngược lên từ các phần tử có chữ "Active ... ago"
  const allSpans = document.querySelectorAll('span, div');
  for (const el of allSpans) {
    if (el.children.length === 0 && activityPattern.test(el.innerText || '')) {
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.clientHeight > 100) {
          if (parent.scrollHeight > parent.clientHeight + 10) {
            return parent;
          }
        }
        parent = parent.parentElement;
      }
    }
  }

  // Chiến lược 2: Tìm container cuộn trong dialog hoặc bottom sheet
  const dialogs = document.querySelectorAll('div[role="dialog"], div[role="region"], div[aria-label*="Story" i]');
  for (const d of dialogs) {
    const scrollables = d.querySelectorAll('div');
    for (const div of scrollables) {
      if (div.clientHeight > 120 && div.scrollHeight > div.clientHeight + 15) {
        const style = window.getComputedStyle(div);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return div;
        }
      }
    }
  }

  // Chiến lược 3: Quét mọi div có scrollHeight > clientHeight
  for (const div of document.querySelectorAll('div')) {
    if (div.clientHeight > 150 && div.scrollHeight > div.clientHeight + 25) {
      const style = window.getComputedStyle(div);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        const text = div.innerText || '';
        if (text.includes('Active') || text.includes('Hoạt động') || text.includes('ago')) {
          return div;
        }
      }
    }
  }

  return null;
}

// Thu hoạch danh sách người xem đang hiển thị trong DOM và đưa vào Map
function harvestCurrentViewers(masterMap, authorName) {
  const activityPattern = /(Active\s*(now|\d+[mhwd]\s*ago)|Hoạt động\s*(\d+\s*phút|\d+\s*giờ|\d+\s*ngày|xong|ngay)|Đang hoạt động|vừa mới)/i;
  let newCount = 0;

  // 1. Quét theo pattern hoạt động (Active 29m ago, Active now...)
  const textElements = document.querySelectorAll('span, div');
  for (const el of textElements) {
    if (el.children.length === 0 && activityPattern.test(el.innerText || '')) {
      const activityText = el.innerText.trim();

      const row = el.closest('div[role="button"]') || 
                  el.closest('div[role="listitem"]') || 
                  el.closest('div[data-visualcompletion="ignore-dynamic-layout"]') ||
                  el.parentElement?.parentElement;
      if (!row) continue;

      // Tìm tên người xem trong hàng
      const candidateTexts = Array.from(row.querySelectorAll('span[dir="auto"], span, strong, div'))
        .map(n => n.innerText?.trim())
        .filter(t => t && t.length > 1 && t.length < 50 && !activityPattern.test(t) && t !== '...' && t !== '·' && !t.includes('\n'));

      const userName = candidateTexts[0];
      if (!userName || userName === authorName || masterMap.has(userName)) continue;

      // Link Facebook cá nhân
      let profileUrl = '';
      const linkEl = row.querySelector('a[href*="facebook.com/"], a[href^="/"]');
      if (linkEl) {
        let href = linkEl.getAttribute('href') || '';
        if (href.startsWith('/')) href = 'https://www.facebook.com' + href;
        if (!href.includes('/stories/')) profileUrl = href.split('?')[0];
      }
      if (!profileUrl) {
        profileUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(userName)}`;
      }

      // Avatar
      let avatarUrl = '';
      const img = row.querySelector('img, image');
      if (img) {
        const src = img.getAttribute('src') || img.getAttribute('xlink:href');
        if (src && (src.includes('fbcdn') || src.startsWith('http'))) avatarUrl = src;
      }
      if (!avatarUrl) {
        avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userName)}`;
      }

      // Cảm xúc (Reaction)
      let interactionType = 'view';
      const rowHtml = row.innerHTML.toLowerCase();
      if (rowHtml.includes('heart') || rowHtml.includes('tym') || rowHtml.includes('tim') || rowHtml.includes('love') || rowHtml.includes('yêu thích')) {
        interactionType = 'love';
      } else if (rowHtml.includes('like') || rowHtml.includes('thích')) {
        interactionType = 'like';
      } else if (rowHtml.includes('haha') || rowHtml.includes('cười')) {
        interactionType = 'haha';
      }

      masterMap.set(userName, {
        user_name: userName,
        user_profile_url: profileUrl,
        interaction_type: interactionType,
        comment_text: activityText,
        avatar_url: avatarUrl
      });
      newCount++;
    }
  }

  // 2. Quét bổ sung những người xem tắt trạng thái hoạt động (không có dòng Active)
  const container = getViewerScrollContainer();
  if (container) {
    const rows = container.querySelectorAll('div[role="button"], div[role="listitem"]');
    for (const row of rows) {
      const candidateTexts = Array.from(row.querySelectorAll('span[dir="auto"], span, strong'))
        .map(t => t.innerText?.trim())
        .filter(t => t && t.length > 1 && t.length < 50 && t !== '...' && !t.includes('\n') && !activityPattern.test(t));

      if (candidateTexts.length > 0) {
        const userName = candidateTexts[0];
        if (masterMap.has(userName) || userName === 'Đóng' || userName === 'Close' || userName === authorName) continue;

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

        masterMap.set(userName, {
          user_name: userName,
          user_profile_url: profileUrl,
          interaction_type: 'view',
          comment_text: 'Đã xem Story',
          avatar_url: avatarUrl
        });
        newCount++;
      }
    }
  }

  return newCount;
}

// Tự động cuộn theo từng nấc để kích hoạt Lazy Loading của Facebook
async function autoScrollAndCollectAllViewers(maxSteps = 60, delayMs = 380) {
  const meta = extractStoryMeta();
  const masterMap = new Map();

  // Thu hoạch lượt đầu tiên trước khi cuộn
  harvestCurrentViewers(masterMap, meta.authorName);
  notifyProgress(masterMap.size);

  const container = getViewerScrollContainer();
  if (!container) {
    console.log('[Collector] Danh sách ngắn hoặc không có thanh cuộn riêng, lấy các phần tử hiện tại:', masterMap.size);
    return formatResult(meta, Array.from(masterMap.values()));
  }

  console.log(`[Collector] Bắt đầu tự động cuộn lazy loading (Tổng chiều cao: ${container.scrollHeight}px)...`);

  let consecutiveNoNewItems = 0;
  let lastScrollTop = -1;

  for (let step = 0; step < maxSteps; step++) {
    // Cuộn xuống 75% chiều cao khung nhìn để Facebook kích hoạt tải trang tiếp theo (virtual DOM)
    const nextScroll = container.scrollTop + container.clientHeight * 0.75;
    container.scrollTop = nextScroll;
    container.dispatchEvent(new Event('scroll', { bubbles: true }));

    // Chờ Facebook fetch dữ liệu GraphQL & render các phần tử mới
    await new Promise(r => setTimeout(r, delayMs));

    // Thu hoạch các phần tử vừa xuất hiện
    const newlyFound = harvestCurrentViewers(masterMap, meta.authorName);
    notifyProgress(masterMap.size);

    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 15;
    const scrollStuck = container.scrollTop === lastScrollTop;
    lastScrollTop = container.scrollTop;

    if (newlyFound === 0) {
      consecutiveNoNewItems++;
      // Thử nhảy thẳng tới đáy nếu danh sách bị khựng
      container.scrollTop = container.scrollHeight;
      await new Promise(r => setTimeout(r, delayMs));
      harvestCurrentViewers(masterMap, meta.authorName);
      notifyProgress(masterMap.size);
    } else {
      consecutiveNoNewItems = 0;
    }

    // Đã chạm đáy và 2 lần liên tiếp không còn người mới -> Đã tải hết 100%
    if (atBottom && consecutiveNoNewItems >= 2) {
      console.log(`[Collector] Đã chạm đáy sau ${step + 1} bước cuộn! Tổng số người xem: ${masterMap.size}`);
      break;
    }

    if (scrollStuck && consecutiveNoNewItems >= 3) {
      break;
    }
  }

  return formatResult(meta, Array.from(masterMap.values()));
}

function notifyProgress(count) {
  try {
    chrome.runtime.sendMessage({ action: 'SCAN_PROGRESS', count });
  } catch (_e) {
    // Popup có thể đóng hoặc không lắng nghe
  }
}

// Trích xuất metadata của Story (Tác giả, quyền riêng tư, thời gian)
function extractStoryMeta() {
  const currentUrl = window.location.href;
  const isArchivePage = currentUrl.includes('/archive/stories/');
  const isStoryPage = currentUrl.includes('/stories/') || isArchivePage;

  let authorName = 'Trần Văn An';
  let privacy = 'Công khai (Public)';
  let storyAge = 'Gần đây (<24h)';
  let isArchived = isArchivePage;

  const topSpans = Array.from(document.querySelectorAll('header span, div[role="main"] span, div[data-pagelet*="Story"] span, div[aria-label*="Story" i] span'));
  for (const el of topSpans) {
    const text = el.innerText?.trim();
    if (!text) continue;

    if (text.includes('👥')) privacy = 'Bạn bè (Friends)';
    if (text.includes('🌐')) privacy = 'Công khai (Public)';
    if (text.includes('🔒')) privacy = 'Chỉ mình tôi (Only me)';

    if (/^\d+\s*[hm]\b/i.test(text) || /^\d+\s*(giờ|phút|ngày|tuần)\s*trước/i.test(text) || /\b(ngày|tháng|năm)\b/i.test(text)) {
      storyAge = text;
      if (text.includes('ngày') || text.includes('tuần') || text.includes('tháng') || isArchivePage) {
        isArchived = true;
      }
    }
  }

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

  return {
    isStoryPage,
    storyUrl: currentUrl,
    authorName,
    privacy,
    storyAge,
    isArchived,
    status: isArchived ? 'archived' : 'active'
  };
}

function formatResult(meta, viewers) {
  return {
    ...meta,
    totalViews: viewers.length,
    viewersCount: viewers.length,
    viewers,
    drawerFound: viewers.length > 0
  };
}
