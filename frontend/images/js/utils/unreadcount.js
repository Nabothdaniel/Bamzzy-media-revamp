// unreadCount.js
async function updateUnreadCount() {
  const session = JSON.parse(window.name || '{}');
  const token = session.token;
    const BASE_URL = "https://bamzzy-media-revamp.onrender.com";
  if (!token) return;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/message/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();
    const messages = Array.isArray(result.data) ? result.data : [];
    const unreadCount = messages.filter(msg => !msg.isRead).length;

    const badge = document.getElementById("unreadCount");
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  } catch (err) {
    console.error("Failed to fetch unread count:", err);
  }
}

window.updateUnreadCount = updateUnreadCount;
