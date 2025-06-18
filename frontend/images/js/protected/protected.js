// Retrieve session data from window.name (tab-specific and survives reload)
let sessionData = {};
try {
    sessionData = JSON.parse(window.name || '{}');
} catch {
    sessionData = {};
}

const token = sessionData.token;
const user = sessionData.user;

if (!token || !user) {
    // Not logged in
    window.location.href = "./login.html";
} else if (window.location.pathname.includes("admin") && user.role !== "admin") {
    // Trying to access admin page as non-admin
    window.location.href = "./dashboard.html";
} else if (window.location.pathname.includes("dashboard") && user.role !== "user") {
    // Trying to access user page as admin (optional)
    window.location.href = "./admin.html";
}
