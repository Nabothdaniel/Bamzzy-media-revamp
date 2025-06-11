const colors = [
  "bg-red-500", "bg-green-500", "bg-blue-500",
  "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"
];

function getColorForName(name) {
  if (!name) return "bg-gray-200";
  const charCode = name.charCodeAt(0);
  const colorIndex = charCode % colors.length;
  return colors[colorIndex];
}

function getSessionData() {
  try {
    return JSON.parse(window.name || '{}');
  } catch {
    return {};
  }
}

function setSessionData(data) {
  window.name = JSON.stringify(data);
}

async function fetchUserProfile() {
  const session = getSessionData();
  const token = session.token;
  if (!token) return null;

  try {
    const response = await fetch("http://localhost:5000/api/v1/auth/profile", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) throw new Error("Failed to fetch user profile");

    const data = await response.json();
    const user = data.user;

    // Update session with new user info
    setSessionData({ ...session, user });

    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

function renderAvatar(user) {
  const container = document.getElementById("userAvatar");
  const userNameSpan = document.getElementById("userName");

  if (!container || !userNameSpan) return;

  container.innerHTML = "";

  const name = user?.name || "";
  const avatarUrl = user?.avatarUrl || "";

  userNameSpan.textContent = name || "User";

  if (avatarUrl) {
    container.className = "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center";
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = name || "User avatar";
    img.className = "w-full h-full object-cover";
    container.appendChild(img);
  } else if (name.length > 0) {
    const firstLetter = name[0].toUpperCase();
    const bgColorClass = getColorForName(name);
    container.className = `w-12 h-12 rounded-full flex items-center justify-center text-xl text-white font-bold ${bgColorClass}`;
    container.textContent = firstLetter;
  } else {
    container.className = `bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center text-xl text-gray-700`;
    container.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
           stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    `;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let session = getSessionData();
  let user = session.user;

  if (!user) {
    user = await fetchUserProfile();
  }

  if (user) renderAvatar(user);
});
