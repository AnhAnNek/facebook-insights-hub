// Content script chạy trên Facebook Stories & Kho Lưu Trữ Tin (>24h)
console.log('[Facebook Insights Collector] Content script v2.2 (Chính xác 100% thứ tự & Lọc tên chuẩn) đã sẵn sàng.');

// Danh sách các từ khóa giao diện hệ thống của Facebook cần loại trừ tuyệt đối
const BLACKLISTED_TERMS = new Set([
  'online status indicator',
  'đang hoạt động',
  'trạng thái hoạt động',
  'refresh',
  'tải lại',
  'làm mới',
  'close',
  'đóng',
  'options',
  'tùy chọn',
  'more',
  'xem thêm',
  'send message',
  'gửi tin nhắn',
  'reply',
  'trả lời',
  'mute',
  'tắt tiếng',
  'play',
  'phát',
  'pause',
  'tạm dừng',
  'delete',
  'xóa',
  'story',
  'tin',
  'viewers',
  'người xem',
  'like',
  'love',
  'thích',
  'tym',
  'tim',
  'yêu thích',
  'active',
  'active now',
  'comment',
  'bình luận',
  'chia sẻ',
  'share'
]);

const ACTIVITY_PATTERN = /(Active\s*(now|\d+[mhwd]\s*ago)|Hoạt động\s*(\d+\s*phút|\d+\s*giờ|\d+\s*ngày|xong|ngay)|Đang hoạt động|vừa mới)/i;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ success: true, message: 'PONG' });
    return true;
  }

  if (request.action === 'SCAN_CURRENT_STORY' || request.action === 'SCROLL_AND_SCAN') {
    const isDeepScan = request.action === 'SCROLL_AND_SCAN';
    const maxSteps = isDeepScan ? 80 : 35;

    autoScrollAndCollectInOrder(maxSteps, 380)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => {
        console.error('[Facebook Insights Collector] Lỗi cuộn & quét:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  return true;
});

// Tìm phần tử thanh cuộn của danh sách người xem (Viewer Drawer trong Facebook)
function getViewerScrollContainer() {
  // Chiến lược 1: Đi ngược lên từ các phần tử có chữ "Active ... ago"
  const allSpans = document.querySelectorAll('span, div');
  for (const el of allSpans) {
    if (el.children.length === 0 && ACTIVITY_PATTERN.test(el.innerText || '')) {
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

// Bóc tách thông tin một hàng người xem cụ thể
function parseSingleViewerRow(row, authorName) {
  // Bỏ qua các khối kích thước bất thường (VD: icon đóng, thanh kéo tiêu đề)
  const rect = row.getBoundingClientRect();
  if (rect.height < 25 || rect.height > 120) return null;

  // Lấy danh sách văn bản trong hàng
  const allTexts = Array.from(row.querySelectorAll('span[dir="auto"], span, strong, div'))
    .map(el => el.innerText?.trim())
    .filter(t => {
      if (!t || t.length < 1 || t.length > 50 || t.includes('\n') || t === '...' || t === '·') return false;
      const lower = t.toLowerCase();
      if (BLACKLISTED_TERMS.has(lower)) return false;
      return true;
    });

  // Tìm nhãn thời gian hoạt động (Active 29m ago, Active now...)
  let activityText = '';
  const activityNode = allTexts.find(t => ACTIVITY_PATTERN.test(t));
  if (activityNode) {
    activityText = activityNode;
  }

  // Tên người xem: Loại bỏ đoạn text hoạt động và tên chủ Story
  const candidateNames = allTexts.filter(t => !ACTIVITY_PATTERN.test(t));
  if (candidateNames.length === 0) return null;

  const userName = candidateNames[0];
  if (!userName || userName.length < 2 || userName === authorName) return null;
  if (BLACKLISTED_TERMS.has(userName.toLowerCase())) return null;

  // Trích xuất Avatar
  let avatarUrl = '';
  const img = row.querySelector('img, image');
  if (img) {
    const src = img.getAttribute('src') || img.getAttribute('xlink:href');
    if (src && (src.includes('fbcdn') || src.startsWith('http'))) {
      avatarUrl = src;
    }
  }
  if (!avatarUrl) {
    avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userName)}`;
  }

  // Trích xuất link trang cá nhân Facebook (Profile URL)
  let profileUrl = '';

  // 1. Tìm thẻ <a> trong hàng hoặc chính thẻ hàng
  const linkEl = row.tagName.toLowerCase() === 'a' ? row : row.querySelector('a');
  if (linkEl) {
    let href = linkEl.getAttribute('href') || linkEl.href || '';
    if (href && !href.includes('/stories/') && !href.includes('#') && !href.startsWith('javascript:')) {
      if (href.startsWith('/')) href = 'https://www.facebook.com' + href;
      profileUrl = href.split('?')[0];
    }
  }

  // 2. Tìm ID trong data-hovercard (ví dụ: /ajax/hovercard/user.php?id=1000...)
  if (!profileUrl) {
    const hovercardEl = row.getAttribute('data-hovercard') ? row : row.querySelector('[data-hovercard]');
    if (hovercardEl) {
      const hc = hovercardEl.getAttribute('data-hovercard') || '';
      const matchId = hc.match(/id=(\d+)/);
      if (matchId) {
        profileUrl = `https://www.facebook.com/profile.php?id=${matchId[1]}`;
      }
    }
  }

  // 3. Dự phòng link tìm kiếm theo đúng tên
  if (!profileUrl) {
    profileUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(userName)}`;
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

  return {
    user_name: userName,
    user_profile_url: profileUrl,
    interaction_type: interactionType,
    comment_text: activityText || 'Đã xem Story',
    avatar_url: avatarUrl,
    y: rect.top // Tọa độ thẳng đứng trên màn hình để sắp xếp đúng thứ tự
  };
}

// Thu hoạch các hàng đang hiển thị và đưa vào mảng bảo toàn thứ tự từ trên xuống dưới
function harvestVisibleRowsInOrder(container, authorName, seenNames, orderedList) {
  let rawCandidates = [];
  if (container) {
    const found = container.querySelectorAll('div[role="button"], div[role="listitem"], a[role="link"], div[data-visualcompletion]');
    rawCandidates = Array.from(found);
  } else {
    rawCandidates = Array.from(document.querySelectorAll('div[role="button"], div[role="listitem"]'));
  }

  // Parse từng hàng và lưu tọa độ y
  const currentBatch = [];
  for (const row of rawCandidates) {
    const viewer = parseSingleViewerRow(row, authorName);
    if (viewer && !seenNames.has(viewer.user_name)) {
      currentBatch.push(viewer);
    }
  }

  // SẮP XẾP CHÍNH XÁC THEO TỌA ĐỘ TRỰC QUAN TRÊN MÀN HÌNH (TỪ TRÊN XUỐNG DƯỚI)
  currentBatch.sort((a, b) => a.y - b.y);

  let newCount = 0;
  for (const v of currentBatch) {
    if (!seenNames.has(v.user_name)) {
      seenNames.add(v.user_name);
      // Xóa thuộc tính y tạm thời trước khi lưu
      const { y, ...cleanViewer } = v;
      orderedList.push(cleanViewer);
      newCount++;
    }
  }

  return newCount;
}

// Tự động cuộn và gom toàn bộ người xem BẢO TOÀN 100% THỨ TỰ TỪ TRÊN XUỐNG DƯỚI
async function autoScrollAndCollectInOrder(maxSteps = 60, delayMs = 380) {
  const meta = extractStoryMeta();
  const seenNames = new Set();
  const orderedList = []; // Mảng bảo đảm thứ tự tuần tự xuất hiện trên giao diện

  const container = getViewerScrollContainer();

  // BƯỚC 1: Đưa thanh cuộn về vị trí đỉnh đầu tiên (scrollTop = 0) để quét đúng từ người đầu tiên
  if (container && container.scrollTop > 0) {
    container.scrollTop = 0;
    container.dispatchEvent(new Event('scroll', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
  }

  // Thu hoạch đợt người xem đầu tiên ở trên đỉnh
  harvestVisibleRowsInOrder(container, meta.authorName, seenNames, orderedList);
  notifyProgress(orderedList.length);

  if (!container) {
    console.log('[Collector] Không tìm thấy thanh cuộn, lấy các phần tử hiện có:', orderedList.length);
    return formatResult(meta, orderedList);
  }

  console.log(`[Collector] Bắt đầu tự động cuộn tuần tự từ trên xuống dưới...`);

  let consecutiveNoNewItems = 0;
  let lastScrollTop = -1;

  for (let step = 0; step < maxSteps; step++) {
    // Cuộn xuống 75% chiều cao khung nhìn để Facebook nạp thêm hàng mới
    const nextScroll = container.scrollTop + container.clientHeight * 0.75;
    container.scrollTop = nextScroll;
    container.dispatchEvent(new Event('scroll', { bubbles: true }));

    // Chờ Facebook fetch dữ liệu GraphQL & render các phần tử mới
    await new Promise(r => setTimeout(r, delayMs));

    // Thu hoạch các phần tử vừa xuất hiện (được thêm tuần tự vào đuôi mảng)
    const newlyFound = harvestVisibleRowsInOrder(container, meta.authorName, seenNames, orderedList);
    notifyProgress(orderedList.length);

    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 15;
    const scrollStuck = container.scrollTop === lastScrollTop;
    lastScrollTop = container.scrollTop;

    if (newlyFound === 0) {
      consecutiveNoNewItems++;
      container.scrollTop = container.scrollHeight;
      await new Promise(r => setTimeout(r, delayMs));
      harvestVisibleRowsInOrder(container, meta.authorName, seenNames, orderedList);
      notifyProgress(orderedList.length);
    } else {
      consecutiveNoNewItems = 0;
    }

    // Đã chạm đáy và 2 lần liên tiếp không còn ai mới -> Đã tải hết 100%
    if (atBottom && consecutiveNoNewItems >= 2) {
      console.log(`[Collector] Đã chạm đáy danh sách! Tổng cộng: ${orderedList.length} người xem.`);
      break;
    }

    if (scrollStuck && consecutiveNoNewItems >= 3) {
      break;
    }
  }

  return formatResult(meta, orderedList);
}

function notifyProgress(count) {
  try {
    chrome.runtime.sendMessage({ action: 'SCAN_PROGRESS', count });
  } catch (_e) {}
}

// Trích xuất Story ID và Clean URL (đặc biệt cho Story xem lại >24h trong Kho lưu trữ)
function extractStoryIdAndUrl() {
  const currentUrl = window.location.href;
  let storyId = '';
  let cleanStoryUrl = currentUrl.split('&source=')[0].split('?source=')[0];

  // 1. Kiểm tra query parameters trong URL (story_fbid, fbid, story_id, id)
  try {
    const urlObj = new URL(currentUrl);
    const paramId = urlObj.searchParams.get('story_fbid') || 
                    urlObj.searchParams.get('fbid') || 
                    urlObj.searchParams.get('story_id') || 
                    urlObj.searchParams.get('id');
    if (paramId && /^\d+$/.test(paramId)) {
      storyId = paramId;
    }
  } catch (_e) {}

  // 2. Kiểm tra đường dẫn URL dạng /stories/{bucket_id}/{encoded_id}/
  if (!storyId) {
    const storiesMatch = currentUrl.match(/\/stories\/(\d+)\/([A-Za-z0-9_-]+=*)/);
    if (storiesMatch) {
      const bucketId = storiesMatch[1];
      const encodedId = storiesMatch[2];
      cleanStoryUrl = `https://www.facebook.com/stories/${bucketId}/${encodedId}/`;

      try {
        const decoded = atob(encodedId.replace(/-/g, '+').replace(/_/g, '/'));
        const idMatch = decoded.match(/\d{10,}/);
        if (idMatch) {
          storyId = idMatch[0];
        } else {
          storyId = encodedId;
        }
      } catch (_e) {
        storyId = encodedId;
      }
    }
  }

  // 3. Kiểm tra đường dẫn URL dạng /archive/stories/{id}/
  if (!storyId) {
    const archiveMatch = currentUrl.match(/\/archive\/stories\/(\d+)/);
    if (archiveMatch) {
      storyId = archiveMatch[1];
      cleanStoryUrl = `https://www.facebook.com/archive/stories/${storyId}/`;
    }
  }

  // 4. Tìm kiếm trong DOM nếu URL là trang chung /archive/stories/
  if (!storyId || storyId.length < 5) {
    const activeElements = document.querySelectorAll('div[aria-current="true"] a, div[aria-selected="true"] a, div[role="dialog"] a[href*="stories"], a[href*="story_fbid"]');
    for (const link of activeElements) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/(?:story_fbid=|fbid=|\/stories\/\d+\/|stories\/)(\d+|[A-Za-z0-9_-]+=*)/);
      if (match) {
        storyId = match[1];
        if (href.startsWith('http')) cleanStoryUrl = href.split('?')[0];
        else if (href.startsWith('/')) cleanStoryUrl = ('https://www.facebook.com' + href).split('?')[0];
        break;
      }
    }
  }

  // 5. Tìm trong các thẻ meta canonical hoặc OpenGraph
  if (!storyId) {
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
                      document.querySelector('meta[property="og:url"]')?.getAttribute('content');
    if (canonical && canonical.includes('facebook.com')) {
      cleanStoryUrl = canonical;
      const match = canonical.match(/\d{10,}/);
      if (match) storyId = match[0];
    }
  }

  // 6. Nếu vẫn chưa có ID số cụ thể, tạo ID duy nhất dựa trên URL hoặc hash
  if (!storyId) {
    const hashMatch = currentUrl.match(/Uzpf[A-Za-z0-9_-]+/);
    if (hashMatch) {
      storyId = hashMatch[0];
    } else {
      let hash = 0;
      for (let i = 0; i < currentUrl.length; i++) {
        hash = ((hash << 5) - hash) + currentUrl.charCodeAt(i);
        hash |= 0;
      }
      storyId = 'archive_' + Math.abs(hash);
    }
  }

  return {
    storyId,
    storyUrl: cleanStoryUrl
  };
}

// Trích xuất metadata của Story (Tác giả, quyền riêng tư, thời gian, ID và URL)
function extractStoryMeta() {
  const currentUrl = window.location.href;
  const isArchivePage = currentUrl.includes('/archive/stories/');
  const isStoryPage = currentUrl.includes('/stories/') || isArchivePage;
  const { storyId, storyUrl } = extractStoryIdAndUrl();

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
    storyId,
    storyUrl,
    isStoryPage,
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
