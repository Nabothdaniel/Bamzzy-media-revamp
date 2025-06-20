document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signUpFormElement");
  const loginForm = document.getElementById("loginFormElement");
  const BASE_URL = "https://bamzzy-media-revamp.onrender.com";

  const showError = (inputId, message) => {
    const errorDiv = document.getElementById(`${inputId}Error`);
    if (errorDiv) {
      errorDiv.textContent = message;
    }
  };

  const clearErrors = () => {
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
    });
  };

  function showCustomAlert(message, type = "success") {
    const alertBox = document.getElementById("customAlert");
    const alertMsg = document.getElementById("customAlertMessage");

    alertBox.className = "fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-lg transition duration-300";

    if (type === "success") {
      alertBox.classList.add("bg-green-100", "text-green-800");
    } else if (type === "error") {
      alertBox.classList.add("bg-red-100", "text-red-800");
    } else {
      alertBox.classList.add("bg-gray-100", "text-gray-800");
    }

    alertMsg.textContent = message;
    alertBox.classList.remove("hidden");

    setTimeout(() => {
      alertBox.classList.add("hidden");
    }, 3000);
  }

  // Utility to manage token via window.name (JSON string)
  function getSessionData() {
    try {
      return JSON.parse(window.name || "{}");
    } catch {
      return {};
    }
  }

  function setSessionData(data) {
    window.name = JSON.stringify(data);
  }

  function clearSessionData() {
    window.name = "";
  }

  // SIGNUP
  if (signupForm) {
        const signUpBtn = document.getElementById('signin-btn');
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      let hasError = false;

      if (!name) {
        showError("name", "Name is required");
        hasError = true;
      }

      if (!email) {
        showError("email", "Email is required");
        hasError = true;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        showError("email", "Invalid email format");
        hasError = true;
      }

      if (!password) {
        showError("password", "Password is required");
        hasError = true;
      } else if (password.length < 6) {
        showError("password", "Password must be at least 6 characters");
        hasError = true;
      }

      if (hasError) return;

      signUpBtn.innerHTML = `signing up.....`
      

      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (data.success) {
            signUpBtn.innerHTML = `signed  up.....`
          showCustomAlert("Registration successful! Please login.", "success");
          setTimeout(() => {
            window.location.href = "./login.html";
          }, 1500);
        } else {
          showError("email", data.message || "Registration failed.");
          showCustomAlert(data.message || "Registration failed.");
        }
      } catch (err) {
        console.error(err);
        showCustomAlert("An error occurred. Please try again.");
      }
    });
  }

  // LOGIN
  if (loginForm) {
    const loginBtn = document.getElementById('login-btn');

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();



      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      let hasError = false;

      if (!email) {
        showError("loginEmail", "Email is required");
        hasError = true;
      }

      if (!password) {
        showError("loginPassword", "Password is required");
        hasError = true;
      }

      if (hasError) return;
      loginBtn.innerHTML = 'Log in.....'
      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.success && data.token && data.user) {
          // ✅ Use window.name (per-tab session)
          setSessionData({
            token: data.token,
            user: data.user,
            currentUserId: data.user.id,
          });

          showCustomAlert("Login successful!", "success");
           loginBtn.innerHTML = 'Logged in '

          setTimeout(() => {
            if (data.user.role === "admin") {
              window.location.href = "./admin.html";
            } else {
              window.location.href = "./dashboard.html";
            }
          }, 1000);
        } else {
          showError("loginEmail", data.message || "Login failed.");
          showCustomAlert(data.message || "Login failed.");
        }
      } catch (err) {
        console.error(err);
        showCustomAlert("Login error. Please try again.");
      }
    });
  }

  // LOGOUT
  const logOut = async (e) => {
    e.preventDefault();
    const { token } = getSessionData();

    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearSessionData(); // ✅ Per-tab session cleared
        showAlert("Logged out successfully", "success");

        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1000);
      } else {
        showAlert(data.message || "Logout failed", "error");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logOut);
  }

  // ALERT BOX (Logout)
  function showAlert(message, type = "success") {
    const alertBox = document.getElementById("logoutAlert");
    const messageSpan = document.getElementById("logoutAlertMessage");

    messageSpan.textContent = message;

    alertBox.className =
      "fixed top-4 right-4 px-4 py-2 rounded shadow transition-opacity duration-500 " +
      (type === "success"
        ? "bg-green-100 border border-green-400 text-green-700"
        : "bg-red-100 border border-red-400 text-red-700");

    alertBox.classList.remove("hidden");

    setTimeout(() => {
      alertBox.classList.add("hidden");
    }, 3000);
  }
});
