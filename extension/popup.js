let currentScannedData = null;
const SERVER_API = 'http://localhost:3000/api/stories';

document.addEventListener('DOMContentLoaded', async () => {
  const tabStatusEl = document.getElementById('tab-status');
  const btnScan = document.getElementById('btn-scan');
  const btnSave = document.getElementById('btn-save');
  const resultCard = document.getElementById('result-card');
  const toastMsg = document.getElementById('toast-msg');

  // Kiểm tra tab hiện tại
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && tab.url.includes('facebook.com')) {
    if (tab.url.includes('/stories/')) {
      tabStatusEl.innerText = 'Đang mở Facebook Story ✅';
      tabStatusEl.style.color = '#34d399';
    } else {
      tabStatusEl.innerText = 'Đang ở Facebook (Hãy mở Story)';
      tabStatusEl.style.color = '#fbbf24';
    }
  } else {
    tabStatusEl.innerText = 'Chưa mở trang Facebook';
    tabStatusEl.style.color = '#f87171';
  }

  // Sự kiện bấm quét Story
  btnScan.addEventListener('click', async () => {
    btnScan.innerText = '⏳ Đang quét cấu trúc Story...';
    btnScan.disabled = true;

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        alert('Không tìm thấy tab Facebook đang mở!');
        btnScan.innerText = '🔍 Quét Dữ Liệu Story Đang Mở';
        btnScan.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: 'SCAN_CURRENT_STORY' }, (response) => {
        btnScan.innerText = '🔍 Quét Dữ Liệu Story Đang Mở';
        btnScan.disabled = false;

        if (chrome.runtime.lastError) {
          alert('Không thể kết nối đến trang Facebook. Hãy thử F5 lại tab Facebook và bấm Quét lại nhé!');
          return;
        }

        if (response && response.success) {
          currentScannedData = response.data;
          renderResult(response.data);
        } else {
          alert('Không trích xuất được dữ liệu: ' + (response?.error || 'Lỗi không xác định'));
        }
      });
    } catch (err) {
      btnScan.innerText = '🔍 Quét Dữ Liệu Story Đang Mở';
      btnScan.disabled = false;
      alert('Lỗi: ' + err.message);
    }
  });

  // Sự kiện bấm lưu vào SQLite server
  btnSave.addEventListener('click', async () => {
    if (!currentScannedData) return;

    btnSave.innerText = '⏳ Đang lưu vào SQLite...';
    btnSave.disabled = true;

    try {
      const payload = {
        story: {
          story_url: currentScannedData.storyUrl,
          title: `Story của ${currentScannedData.authorName} (${currentScannedData.privacy})`,
          author_name: currentScannedData.authorName,
          author_id: 'fb_story_owner',
          privacy: currentScannedData.privacy,
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
    document.getElementById('privacy-tag').innerText = `Quyền riêng tư: ${data.privacy}`;
    document.getElementById('viewers-count').innerText = `${data.viewers.length} người xem`;

    const viewersListEl = document.getElementById('viewers-list');
    viewersListEl.innerHTML = '';

    if (data.viewers.length === 0) {
      viewersListEl.innerHTML = `
        <div style="padding: 10px; color: #f59e0b; text-align: center; font-size: 11px;">
          ⚠️ Chưa tìm thấy người xem nào trong DOM.<br>
          <strong>Hãy nhấn vào biểu tượng danh sách người xem ở góc dưới Story trước, sau đó bấm Quét lại!</strong>
        </div>
      `;
      btnSave.style.display = 'none';
      return;
    }

    btnSave.style.display = 'flex';
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
            <a href="${viewer.user_profile_url}" target="_blank" class="link-fb">Link Profile</a>
          </div>
        </div>
        <span class="viewer-reaction">${reactionEmoji}</span>
      `;
      viewersListEl.appendChild(item);
    });
  }
});
