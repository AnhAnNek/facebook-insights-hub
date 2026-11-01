// Content script chạy trên trang Facebook
console.log('[Facebook Insights Collector] Content script đã sẵn sàng.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SCAN_CURRENT_STORY') {
    try {
      const data = extractStoryData();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});

function extractStoryData() {
  const currentUrl = window.location.href;
  const isStoryPage = currentUrl.includes('/stories/');

  // 1. Trích xuất tên tác giả Story
  let authorName = 'Trần Văn An';
  const authorCandidates = [
    // Header tác giả trong story
    ...document.querySelectorAll('div[role="main"] a strong, div[role="main"] h2, div[role="main"] h3'),
    ...document.querySelectorAll('div[data-pagelet*="Story"] a[role="link"]'),
    ...document.querySelectorAll('header strong, header a')
  ];

  for (const el of authorCandidates) {
    const text = el.innerText?.trim();
    if (text && text.length > 1 && text.length < 50 && !text.includes('\n')) {
      authorName = text;
      break;
    }
  }

  // 2. Quyền riêng tư (Privacy)
  let privacy = 'Công khai (Public)';
  const bodyText = document.body.innerText || '';
  if (bodyText.includes('Bạn bè') || bodyText.includes('Friends')) {
    privacy = 'Bạn bè (Friends)';
  } else if (bodyText.includes('Chỉ mình tôi') || bodyText.includes('Only me')) {
    privacy = 'Chỉ mình tôi (Only me)';
  }

  // 3. Tìm số lượt xem tổng (Total Views)
  let totalViews = 0;
  const viewRegex = /(\d+)\s*(người xem|lượt xem|views|seen by)/i;
  const allElements = document.querySelectorAll('span, div, button');
  for (const el of allElements) {
    if (el.children.length === 0 && viewRegex.test(el.innerText)) {
      const match = el.innerText.match(viewRegex);
      if (match && match[1]) {
        totalViews = parseInt(match[1], 10);
        break;
      }
    }
  }

  // 4. Tìm bảng / danh sách người xem (Viewer Sheet / Dialog)
  const viewers = [];
  const processedProfiles = new Set();

  // Tìm các khối chứa danh sách người xem
  const viewerContainers = [
    ...document.querySelectorAll('div[role="dialog"]'),
    ...document.querySelectorAll('div[aria-label*="người xem" i], div[aria-label*="viewers" i], div[aria-label*="seen by" i]'),
    ...document.querySelectorAll('div[data-pagelet*="StoryViewerList"]'),
    document.body
  ];

  for (const container of viewerContainers) {
    // Tìm các thẻ liên kết cá nhân (profile links)
    const links = container.querySelectorAll('a[role="link"][href*="facebook.com/"], a[href*="facebook.com/"], a[href^="/"]');
    
    for (const link of links) {
      let href = link.getAttribute('href');
      if (!href) continue;

      // Chuẩn hóa link Facebook
      if (href.startsWith('/')) {
        href = 'https://www.facebook.com' + href;
      }

      // Lọc bỏ các link hệ thống Facebook
      if (
        href.includes('/stories/') ||
        href.includes('/messages/') ||
        href.includes('/notifications/') ||
        href.includes('/groups/') ||
        href.includes('/watch/') ||
        href.includes('/marketplace/') ||
        href.includes('/settings/') ||
        href.includes('/help/') ||
        href.includes('?') && !href.includes('id=')
      ) {
        continue;
      }

      // Cắt bớt query param không cần thiết
      const cleanProfileUrl = href.split('?')[0];
      if (processedProfiles.has(cleanProfileUrl)) continue;

      // Tìm tên người xem trong khối cha của thẻ link
      const rowItem = link.closest('div[role="listitem"]') || link.closest('li') || link.parentElement?.parentElement;
      let userName = link.innerText?.trim();

      if (!userName && rowItem) {
        const strongText = rowItem.querySelector('strong, span[dir="auto"], h4')?.innerText?.trim();
        if (strongText) userName = strongText;
      }

      if (!userName || userName.length < 2 || userName.includes('\n')) continue;

      // Tìm avatar
      let avatarUrl = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(userName);
      if (rowItem) {
        const img = rowItem.querySelector('image, img');
        if (img) {
          const src = img.getAttribute('src') || img.getAttribute('xlink:href');
          if (src && (src.includes('fbcdn') || src.startsWith('http'))) {
            avatarUrl = src;
          }
        }
      }

      // Xác định loại tương tác (thả tym, like, haha hay chỉ xem)
      let interactionType = 'view';
      let commentText = null;

      if (rowItem) {
        const rowText = rowItem.innerText || '';
        const ariaLabels = rowItem.getAttribute('aria-label') || '';
        const allAria = Array.from(rowItem.querySelectorAll('[aria-label]')).map(e => e.getAttribute('aria-label')).join(' ');

        const combinedText = (rowText + ' ' + ariaLabels + ' ' + allAria).toLowerCase();

        if (combinedText.includes('tim') || combinedText.includes('tym') || combinedText.includes('love') || combinedText.includes('yêu thích') || combinedText.includes('❤️')) {
          interactionType = 'love';
        } else if (combinedText.includes('thích') || combinedText.includes('like') || combinedText.includes('👍')) {
          interactionType = 'like';
        } else if (combinedText.includes('haha') || combinedText.includes('cười') || combinedText.includes('😆')) {
          interactionType = 'haha';
        } else if (combinedText.includes('wow') || combinedText.includes('bất ngờ') || combinedText.includes('😮')) {
          interactionType = 'wow';
        }

        // Tìm bình luận ngắn (nếu có)
        const textNodes = Array.from(rowItem.querySelectorAll('span[dir="auto"]'))
          .map(e => e.innerText?.trim())
          .filter(t => t && t !== userName && !t.includes('phút') && !t.includes('giờ') && !t.includes('người xem'));
        
        if (textNodes.length > 0) {
          commentText = textNodes[0];
        }
      }

      processedProfiles.add(cleanProfileUrl);
      viewers.push({
        user_name: userName,
        user_profile_url: cleanProfileUrl,
        interaction_type: interactionType,
        comment_text: commentText,
        avatar_url: avatarUrl
      });
    }

    if (viewers.length > 0) break;
  }

  if (totalViews === 0) {
    totalViews = viewers.length > 0 ? viewers.length : 1;
  }

  return {
    isStoryPage,
    storyUrl: currentUrl,
    authorName,
    privacy,
    totalViews,
    viewersCount: viewers.length,
    viewers,
    drawerFound: viewers.length > 0
  };
}
