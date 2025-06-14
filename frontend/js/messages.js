// messages.js

// Fetch and render full message list (used on notifications page)
async function fetchMessages() {
    const session = JSON.parse(window.name || '{}');
    const token = session.token;

    if (!token) {
        console.error("Token not found.");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/v1/message/messages", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch messages");
        }

        const response = await res.json();
        const messages = response.data || [];

        renderMessages(messages); // Render full messages
        updateUnreadBadge(messages); // Also update count

    } catch (error) {
        console.error("Error loading messages:", error);
        const container = document.getElementById('notificationsContainer');
        if (container) {
            container.innerHTML = `
        <p class="text-red-500 text-center">Failed to load notifications.</p>
      `;
        }
    }
}

// Update just the unread count — for global use
async function updateUnreadCount() {
    const session = JSON.parse(window.name || '{}');
    const token = session.token;

    if (!token) {
        console.warn("Token not found.");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/v1/message/messages", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) throw new Error("Failed to fetch messages");

        const response = await res.json();
        const messages = response.data || [];

        updateUnreadBadge(messages); // Reuse logic

    } catch (err) {
        console.error("Failed to update unread count:", err);
    }
}

// Helper to update unread badge display
function updateUnreadBadge(messages) {
    const unreadCountElement = document.getElementById('unreadCount');
    if (!unreadCountElement) return;

    const unreadMessages = messages.filter(msg => !msg.isRead);
    const unreadCount = unreadMessages.length;

    if (unreadCount > 0) {
        unreadCountElement.textContent = unreadCount;
        unreadCountElement.classList.remove('hidden');
    } else {
        unreadCountElement.classList.add('hidden');
    }
}

// Render full messages into notificationsContainer
function renderMessages(messages) {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(messages) || messages.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center">No notifications yet.</p>`;
        return;
    }

    messages.forEach(({ type, content, createdAt }) => {
        const bg = type === 'fund' ? 'bg-green-50' : 'bg-blue-50';
        const border = type === 'fund' ? 'border-green-300' : 'border-blue-300';
        const iconColor = type === 'fund' ? 'text-green-500' : 'text-blue-500';

        const item = document.createElement('div');
        item.className = `p-4 rounded-lg border ${bg} ${border} shadow-sm`;

        item.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-semibold capitalize ${iconColor}">${type}</span>
        <span class="text-xs text-gray-500">${formatDate(createdAt)}</span>
      </div>
      <p class="text-sm">${content}</p>
    `;

        container.appendChild(item);
    });
}

// Format ISO string to readable date/time
function formatDate(isoString) {
    const date = new Date(isoString);
    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    };
    return date.toLocaleString(undefined, options).replace(",", "");
}

// Auto-fetch on full notifications page (if needed)
document.addEventListener("DOMContentLoaded", () => {
    fetchMessages(); // Only works if full container exists
    updateUnreadCount(); // Always works globally
});

// Export if needed
window.updateUnreadCount = updateUnreadCount;
