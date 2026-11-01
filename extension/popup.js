let currentScannedData = null;
const SERVER_API = 'http://localhost:3000/api/stories';

document.addEventListener('DOMContentLoaded', async () => {
  const tabStatusEl = document.getElementById('tab-status');
  const statusDot = document.getElementById('status-dot');
  const btnScan = document.getElementById('btn-scan');
  const btnScrollScan = document.getElementById('btn-scroll-scan');
  const btnSave = document.getElementById('btn-save');
  const resultCard = document.getElementById('result-card');
  const toastMsg = document.getElementById('toast-msg');

  // Kiểm tra tab hiện tại
  let isStoryTab = false;
  let isArchiveTab = false;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('facebook.com')) {
      if (tab.url.includes('/archive/stories/')) {
        isStoryTab = true;
        isArchiveTab = true;
        tabStatusEl.innerText = 'Kho Lưu Trữ Tin (>24h) 📂';
        tabStatusEl.style.color = '#fbbf24';
        statusDot.style.background = '#f59e0b';
      } else if (tab.url.includes('/stories/')) {
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
      tabStatusEl.innerText = 'Chưa mở trang Facebook';
      tabStatusEl.style.color = '#f87171';
      statusDot.style.background = '#ef4444';
    }
  } catch (e) {
    console.error(e);
  }

  // Tự động quét nhanh ngay khi mở Extension nếu đang ở trang Story
  if (isStoryTab) {
    triggerScan('SCAN_CURRENT_STORY', false);
  }

  // Nút Quét Nhanh (quét DOM hiện tại)
  btnScan.addEventListener('click', () => {
    triggerScan('SCAN_CURRENT_STORY', true);
  });

  // Nút Cuộn & Quét Hết (tự động cuộn danh sách người xem có thanh cuộn)
  btnScrollScan.addEventListener('click', () => {
    triggerScan('SCROLL_AND_SCAN', true);
  });

  // Hàm tự động kiểm tra và nạp content.js nếu tab Facebook chưa có
  async function ensureContentScriptInjected(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'PING' }, async (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          console.log('[Popup] Content script chưa nạp, tự động inject content.js...');
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });
            setTimeout(() => resolve(true), 250);
          } catch (err) {
            console.error('[Popup] Lỗi tự động nạp script:', err);
            resolve(false);
          }
        } else {
          resolve(true);
        }
      });
    });
  }

  async function triggerScan(actionType, showAlerts = true) {
    const isScrollAction = actionType === 'SCROLL_AND_SCAN';
    const activeBtn = isScrollAction ? btnScrollScan : btnScan;

    activeBtn.innerHTML = isScrollAction ? '⏳ Đang cuộn danh sách...' : '⏳ Đang quét...';
    btnScan.disabled = true;
    btnScrollScan.disabled = true;

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        if (showAlerts) alert('Không tìm thấy tab Facebook đang mở!');
        resetButtons();
        return;
      }

      // Tự động kiểm tra và bơm content.js vào tab nếu chưa có mã
      const isReady = await ensureContentScriptInjected(activeTab.id);
      if (!isReady) {
        resetButtons();
        if (showAlerts) {
          alert('Không thể kết nối đến trang Facebook. Hãy thử F5 lại tab Facebook và bấm Quét lại nhé!');
        }
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: actionType }, (response) => {
        resetButtons();

        if (chrome.runtime.lastError) {
          if (showAlerts) {
            alert('Không thể kết nối đến trang Facebook. Hãy thử F5 lại tab Facebook và bấm Quét lại nhé!');
          }
          return;
        }

        if (response && response.success) {
          currentScannedData = response.data;
          renderResult(response.data);
        } else {
          if (showAlerts) {
            alert('Không trích xuất được dữ liệu: ' + (response?.error || 'Hãy mở danh sách người xem trước'));
          }
        }
      });
    } catch (err) {
      resetButtons();
      if (showAlerts) alert('Lỗi: ' + err.message);
    }

    function resetButtons() {
      btnScan.disabled = false;
      btnScrollScan.disabled = false;
      btnScan.innerHTML = '<span>⚡ Quét Nhanh</span>';
      btnScrollScan.innerHTML = '<span>📜 Cuộn & Quét Hết</span>';
    }
  }

  // Sự kiện bấm lưu vào SQLite server
  btnSave.addEventListener('click', async () => {
    if (!currentScannedData) return;

    btnSave.innerText = '⏳ Đang lưu vào SQLite...';
    btnSave.disabled = true;

    try {
      const isArchived = currentScannedData.isArchived || currentScannedData.storyUrl.includes('/archive/');
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
        alert('Lỗi server: ' + json.error);
        btnSave.innerText = '💾 Lưu Vào Server SQLite (localhost:3000)';
        btnSave.disabled = false;
      }
    } catch (err) {
      alert('Không thể kết nối tới server Next.js (http://localhost:3000): ' + err.message + '\nHãy đảm bảo server Next.js đang chạy bằng npm run dev!');
      btnSave.innerText = '💾 Lưu Vào Server SQLite (localhost:3000)';
      btnSave.disabled = false;
    }
  });

  function renderResult(data) {
    resultCard.style.display = 'block';
    document.getElementById('author-name').innerText = data.authorName;
    document.getElementById('privacy-tag').innerText = data.privacy;
    
    const statusTag = document.getElementById('story-status-tag');
    if (data.isArchived || data.storyUrl.includes('/archive/')) {
      statusTag.innerText = '📂 Kho lưu trữ (>24h)';
      statusTag.className = 'badge badge-archive';
    } else {
      statusTag.innerText = `⏱️ ${data.storyAge || '<24h'}`;
      statusTag.className = '';
    }

    document.getElementById('viewers-count').innerText = `${data.viewers.length} người xem`;

    const viewersListEl = document.getElementById('viewers-list');
    viewersListEl.innerHTML = '';

    if (data.viewers.length === 0) {
      viewersListEl.innerHTML = `
        <div style="padding: 12px; color: #fbbf24; text-align: center; font-size: 11px; line-height: 1.5;">
          ⚠️ Chưa tìm thấy người xem nào trong màn hình.<br>
          <strong>Hãy nhấn vào biểu tượng danh sách người xem ở góc dưới Story trước, sau đó bấm Quét lại nhé!</strong>
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
