// messages.js

// Fetch and render full message list (used on notifications page)
async function fetchMessages() {
    const session = JSON.parse(window.name || '{}');
    const token = session.token;
    const loader = document.getElementById('messageLoader');
    const container = document.getElementById('notificationsContainer');
    const BASE_URL = "https://bamzzy-media-revamp.onrender.com";

    if (!token) {
        console.error("Token not found.");
        return;
    }

    // Show loader
    if (loader) loader.classList.remove('hidden');
    if (container) container.innerHTML = ""; // Clear content while loading

    try {
        const res = await fetch(`${BASE_URL}/api/v1/message/messages`, {
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

        renderMessages(messages);           // Render message list
        updateUnreadBadge(messages);        // Update unread badge

    } catch (error) {
        console.error("Error loading messages:", error);
        if (container) {
            container.innerHTML = `
                <p class="text-red-500 text-center">Failed to load notifications.</p>
            `;
        }
    } finally {
        // Always hide loader
        if (loader) loader.classList.add('hidden');
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
        const res = await fetch(`${BASE_URL}/api/v1/message/messages`, {
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
        unreadCountElement.textContent = '0';
        unreadCountElement.classList.remove('hidden');
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

    messages.forEach(({ id, title, content, createdAt, isRead }) => {
        const bg = title === 'fund' ? 'bg-green-50' : 'bg-blue-50';
        const border = title === 'fund' ? 'border-green-300' : 'border-blue-300';
        const iconColor = title === 'fund' ? 'text-green-500' : 'text-blue-500';
        const opacity = isRead ? 'opacity-70' : 'opacity-100';

        const item = document.createElement('div');
        item.className = `p-4 rounded-lg border ${bg} ${border} shadow-sm ${opacity}`;

        item.innerHTML = `
            <div class="flex justify-between items-center my-2">
                <span class="text-sm font-semibold capitalize ${iconColor}">${title}</span>
                <span class="text-xs text-gray-500">${formatDate(createdAt)}</span>
            </div>
            <p class="text-sm">${content}</p>
        `;

        // Attach click listener to the "mark as read" button
        const button = item.querySelector("button");
        if (button) {
            button.addEventListener("click", () => {
                const msgId = button.getAttribute("data-id");
                markAllMessagesAsRead(msgId);
            });
        }

        container.appendChild(item);
    });
}


async function markAllMessagesAsRead() {
    const session = JSON.parse(window.name || '{}');
    const token = session.token;

    const btn = document.getElementById("markAllReadBtn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Marking...";
    }

    try {
        const res = await fetch(`${BASE_URL}/api/v1/message/update-message`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) throw new Error("Failed to mark all messages as read");

        const fetchRes = await fetch(`${BASE_URL}/api/v1/message/messages`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!fetchRes.ok) throw new Error("Failed to reload messages");

        const response = await fetchRes.json();
        const messages = response.data || [];

        renderMessages(messages);             // Refresh UI
        updateUnreadBadge(messages);          // Hide or reset badge

        if (btn) {
            btn.textContent = "All read";
            setTimeout(() => {
                btn.textContent = "Mark as read";
                btn.disabled = false;
            }, 1500);
        }

    } catch (err) {
        console.error("Failed to mark all as read:", err);
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Mark as read";
        }
    }
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
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllMessagesAsRead);
    }
});

// Export if needed
window.updateUnreadCount = updateUnreadCount;
