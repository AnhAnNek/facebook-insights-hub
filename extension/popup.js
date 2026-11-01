let currentScannedData = null;
let currentTargetTab = null;
const SERVER_API = 'http://localhost:3000/api/stories';

document.addEventListener('DOMContentLoaded', async () => {
  const tabStatusEl = document.getElementById('tab-status');
  const statusDot = document.getElementById('status-dot');
  const btnScan = document.getElementById('btn-scan');
  const btnScrollScan = document.getElementById('btn-scroll-scan');
  const btnSave = document.getElementById('btn-save');
  const resultCard = document.getElementById('result-card');
  const toastMsg = document.getElementById('toast-msg');
  const errorCard = document.getElementById('error-card');
  const errorTitle = document.getElementById('error-title');
  const errorDesc = document.getElementById('error-desc');
  const btnReloadTab = document.getElementById('btn-reload-tab');
  const btnRetryScan = document.getElementById('btn-retry-scan');
  const tipBox = document.getElementById('tip-box');

  function showError(title, desc, allowReload = true) {
    if (errorCard) {
      errorCard.style.display = 'block';
      errorTitle.innerText = title;
      errorDesc.innerText = desc;
      btnReloadTab.style.display = allowReload ? 'block' : 'none';
      if (tipBox) tipBox.style.display = 'none';
    }
  }

  function hideError() {
    if (errorCard) errorCard.style.display = 'none';
    if (tipBox) tipBox.style.display = 'block';
  }

  // Tìm tab Facebook đang mở
  async function findFacebookTab() {
    try {
      // 1. Kiểm tra tab đang chọn trong cửa sổ hiện tại
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab && currentTab.url && currentTab.url.includes('facebook.com')) {
        return currentTab;
      }

      // 2. Dự phòng: Tìm tab Facebook bất kỳ đang mở
      const fbTabs = await chrome.tabs.query({ url: ['*://*.facebook.com/*', '*://facebook.com/*'] });
      if (fbTabs && fbTabs.length > 0) {
        // Ưu tiên tab đang ở trang stories
        const storyTab = fbTabs.find(t => t.url && (t.url.includes('/stories/') || t.url.includes('/archive/')));
        return storyTab || fbTabs[0];
      }
      return currentTab || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  // Khởi tạo trạng thái tab
  currentTargetTab = await findFacebookTab();
  let isStoryTab = false;

  if (currentTargetTab && currentTargetTab.url && currentTargetTab.url.includes('facebook.com')) {
    if (currentTargetTab.url.includes('/archive/stories/')) {
      isStoryTab = true;
      tabStatusEl.innerText = 'Kho Lưu Trữ Tin (>24h) 📂';
      tabStatusEl.style.color = '#fbbf24';
      statusDot.style.background = '#f59e0b';
    } else if (currentTargetTab.url.includes('/stories/')) {
      isStoryTab = true;
      tabStatusEl.innerText = 'Đang mở Story (<24h) 🟢';
      tabStatusEl.style.color = '#34d399';
      statusDot.style.background = '#10b981';
    } else {
      tabStatusEl.innerText = 'Đang ở Facebook (Hãy mở Story)';
      tabStatusEl.style.color = '#94a3b8';
      statusDot.style.background = '#94a3b8';
    }
  } else {
    tabStatusEl.innerText = 'Chưa mở tab Facebook';
    tabStatusEl.style.color = '#f87171';
    statusDot.style.background = '#ef4444';
  }

  // Tự động kiểm tra và bơm content script nếu tab chưa có
  async function ensureContentScriptInjected(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'PING' }, async (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          console.log('[Popup] Đang tự động nạp content.js vào tab Facebook...');
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });
            setTimeout(() => resolve(true), 250);
          } catch (err) {
            console.error('[Popup] Lỗi nạp script:', err);
            resolve(false);
          }
        } else {
          resolve(true);
        }
      });
    });
  }

  // Thực hiện quét Story
  async function triggerScan(actionType) {
    hideError();
    const isScrollAction = actionType === 'SCROLL_AND_SCAN';
    const activeBtn = isScrollAction ? btnScrollScan : btnScan;

    activeBtn.innerHTML = isScrollAction ? '⏳ Đang cuộn...' : '⏳ Đang quét...';
    btnScan.disabled = true;
    btnScrollScan.disabled = true;

    currentTargetTab = await findFacebookTab();
    if (!currentTargetTab || !currentTargetTab.id || !currentTargetTab.url?.includes('facebook.com')) {
      resetButtons();
      showError(
        'Không tìm thấy tab Facebook',
        'Vui lòng mở trang Facebook chứa Story cần quét trên trình duyệt trước khi bấm Quét.',
        false
      );
      return;
    }

    // Tự động nạp mã nếu cần
    const isReady = await ensureContentScriptInjected(currentTargetTab.id);
    if (!isReady) {
      resetButtons();
      showError(
        'Chưa kết nối được tab Facebook',
        'Tab Facebook chưa thể nhận lệnh từ Extension (thường do Extension vừa được tải lại). Bấm nút bên dưới để tự động tải lại tab!',
        true
      );
      return;
    }

    // Gửi lệnh quét sang tab Facebook
    chrome.tabs.sendMessage(currentTargetTab.id, { action: actionType }, (response) => {
      resetButtons();

      if (chrome.runtime.lastError) {
        showError(
          'Mất kết nối với tab Facebook',
          'Trang Facebook không phản hồi lệnh quét. Bấm nút Tải Lại Tab bên dưới để thử lại tự động nhé!',
          true
        );
        return;
      }

      if (response && response.success) {
        hideError();
        currentScannedData = response.data;
        renderResult(response.data);
      } else {
        showError(
          'Chưa đọc được dữ liệu',
          response?.error || 'Hãy đảm bảo bạn đã bấm vào mục "Người xem" ở góc dưới Story trước khi bấm Quét.',
          false
        );
      }
    });

    function resetButtons() {
      btnScan.disabled = false;
      btnScrollScan.disabled = false;
      btnScan.innerHTML = '<span>⚡ Quét Nhanh</span>';
      btnScrollScan.innerHTML = '<span>📜 Cuộn & Quét Hết</span>';
    }
  }

  // Tự động quét nhanh khi vừa mở Extension nếu tab đang ở Story
  if (isStoryTab) {
    triggerScan('SCAN_CURRENT_STORY');
  }

  // Bấm Quét Nhanh
  btnScan.addEventListener('click', () => {
    triggerScan('SCAN_CURRENT_STORY');
  });

  // Bấm Cuộn & Quét Hết
  btnScrollScan.addEventListener('click', () => {
    triggerScan('SCROLL_AND_SCAN');
  });

  // Bấm Tải Lại Tab Facebook từ thông báo lỗi
  btnReloadTab.addEventListener('click', async () => {
    if (!currentTargetTab || !currentTargetTab.id) {
      currentTargetTab = await findFacebookTab();
    }
    if (currentTargetTab && currentTargetTab.id) {
      errorTitle.innerText = '⏳ Đang tải lại tab Facebook...';
      errorDesc.innerText = 'Vui lòng chờ khoảng 2-3 giây, Extension sẽ tự động nạp mã và quét ngay!';
      btnReloadTab.disabled = true;

      chrome.tabs.reload(currentTargetTab.id, {}, () => {
        setTimeout(async () => {
          btnReloadTab.disabled = false;
          hideError();
          triggerScan('SCAN_CURRENT_STORY');
        }, 2800);
      });
    }
  });

  // Bấm Thử Lại
  btnRetryScan.addEventListener('click', () => {
    triggerScan('SCAN_CURRENT_STORY');
  });

  // Lưu vào SQLite Server
  btnSave.addEventListener('click', async () => {
    if (!currentScannedData) return;

    btnSave.innerText = '⏳ Đang lưu vào SQLite...';
    btnSave.disabled = true;

    try {
      const isArchived = currentScannedData.isArchived || currentScannedData.storyUrl?.includes('/archive/');
      const payload = {
        story: {
          story_url: currentScannedData.storyUrl,
          title: `Story của ${currentScannedData.authorName} (${isArchived ? 'Kho lưu trữ >24h' : 'Tin mới <24h'})`,
          author_name: currentScannedData.authorName,
          author_id: 'fb_story_owner',
          privacy: currentScannedData.privacy,
          status: isArchived ? 'archived' : 'active',
          total_views: currentScannedData.totalViews || currentScannedData.viewers.length,
          total_reactions: currentScannedData.viewers.filter(v => v.interaction_type !== 'view').length
        },
        interactions: currentScannedData.viewers
      };

      const res = await fetch(SERVER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        toastMsg.style.display = 'block';
        toastMsg.innerText = `✅ Đã lưu ${currentScannedData.viewers.length} người xem vào SQLite!`;
        btnSave.innerText = '✅ Đã Lưu Thành Công!';
        setTimeout(() => {
          toastMsg.style.display = 'none';
        }, 4000);
      } else {
        showError('Lỗi Server', json.error || 'Server Next.js từ chối lưu.', false);
        btnSave.innerText = '💾 Lưu Vào Server SQLite (localhost:3000)';
        btnSave.disabled = false;
      }
    } catch (err) {
      showError(
        'Không thể kết nối Server Next.js',
        'Hãy đảm bảo server đang chạy bằng npm run dev tại cổng 3000 (' + err.message + ')',
        false
      );
      btnSave.innerText = '💾 Lưu Vào Server SQLite (localhost:3000)';
      btnSave.disabled = false;
    }
  });

  function renderResult(data) {
    resultCard.style.display = 'block';
    document.getElementById('author-name').innerText = data.authorName;
    document.getElementById('privacy-tag').innerText = data.privacy;

    const statusTag = document.getElementById('story-status-tag');
    if (data.isArchived || data.storyUrl?.includes('/archive/')) {
      statusTag.innerText = '📂 Kho lưu trữ (>24h)';
      statusTag.className = 'badge badge-archive';
    } else {
      statusTag.innerText = `⏱️ ${data.storyAge || '<24h'}`;
      statusTag.className = 'badge';
    }

    document.getElementById('viewers-count').innerText = `${data.viewers.length} người xem`;

    const viewersListEl = document.getElementById('viewers-list');
    viewersListEl.innerHTML = '';

    if (data.viewers.length === 0) {
      viewersListEl.innerHTML = `
        <div style="padding: 12px; color: #fbbf24; text-align: center; font-size: 11px; line-height: 1.5;">
          ⚠️ Chưa tìm thấy người xem nào trong màn hình.<br>
          <strong>Hãy nhấn vào mục "Người xem" ở góc dưới Story trước để mở bảng danh sách, sau đó bấm Quét lại nhé!</strong>
        </div>
      `;
      btnSave.style.display = 'none';
      return;
    }

    btnSave.style.display = 'block';
    data.viewers.forEach(viewer => {
      const item = document.createElement('div');
      item.className = 'viewer-item';

      const reactionEmoji = 
        viewer.interaction_type === 'love' ? '❤️ Tym' :
        viewer.interaction_type === 'like' ? '👍 Thích' :
        viewer.interaction_type === 'haha' ? '😆 Haha' : '👁️ Xem';

      item.innerHTML = `
        <div class="viewer-info">
          <img src="${viewer.avatar_url}" class="avatar" alt="">
          <div>
            <div class="viewer-name">${viewer.user_name}</div>
            <div class="viewer-activity">
              <span>${viewer.comment_text || 'Đã xem'}</span> &bull;
              <a href="${viewer.user_profile_url}" target="_blank" class="link-fb">Link FB</a>
            </div>
          </div>
        </div>
        <span class="viewer-reaction">${reactionEmoji}</span>
      `;
      viewersListEl.appendChild(item);
    });
  }
});
