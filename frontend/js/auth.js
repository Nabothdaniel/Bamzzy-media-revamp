document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signUpFormElement")
  const loginForm = document.getElementById("loginFormElement")

  const showError = (inputId, message) => {
    const errorDiv = document.getElementById(`${inputId}Error`)
    if (errorDiv) {
      errorDiv.textContent = message
    }
  }

  const clearErrors = () => {
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = ""
    })
  }

  const showCustomAlert = (message, type = "error") => {
    const alertBox = document.getElementById("customAlert")
    if (alertBox) {
      alertBox.textContent = message
      alertBox.className = `custom-alert ${type}`
      alertBox.classList.remove("hidden")
      setTimeout(() => alertBox.classList.add("hidden"), 3000)
    } else {
      alert(message) // fallback
    }
  }

  // ========================
  // SIGN UP FORM SUBMISSION
  // ========================
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      clearErrors()

      const name = document.getElementById("name").value.trim()
      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("password").value

      let hasError = false

      if (!name) {
        showError("name", "Name is required")
        hasError = true
      }

      if (!email) {
        showError("email", "Email is required")
        hasError = true
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        showError("email", "Invalid email format")
        hasError = true
      }

      if (!password) {
        showError("password", "Password is required")
        hasError = true
      } else if (password.length < 6) {
        showError("password", "Password must be at least 6 characters")
        hasError = true
      }

      if (hasError) return

      try {
        const res = await fetch("http://localhost:5000/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await res.json()

        if (data.success) {
          showCustomAlert("Registration successful! Please login.", "success")
          setTimeout(() => {
            window.location.href = "./auth.html#login"
          }, 1500)
        } else {
          showError("email", data.message || "Registration failed.")
          showCustomAlert(data.message || "Registration failed.")
        }
      } catch (err) {
        console.error(err)
        showCustomAlert("An error occurred. Please try again.")
      }
    })
  }

  // =====================
  // LOGIN FORM SUBMISSION
  // =====================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      clearErrors()

      const email = document.getElementById("loginEmail").value.trim()
      const password = document.getElementById("loginPassword").value

      let hasError = false

      if (!email) {
        showError("loginEmail", "Email is required")
        hasError = true
      }

      if (!password) {
        showError("loginPassword", "Password is required")
        hasError = true
      }

      if (hasError) return

      try {
        const res = await fetch("http://localhost:5000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (data.success) {
          localStorage.setItem("token", data.token)
          localStorage.setItem("user", JSON.stringify(data.user))
          showCustomAlert("Login successful!", "success")

          setTimeout(() => {
            window.location.href = "./dashboard.html"
          }, 1000)
        } else {
          showError("loginEmail", data.message || "Login failed.")
          showCustomAlert(data.message || "Login failed.")
        }
      } catch (err) {
        console.error(err)
        showCustomAlert("Login error. Please try again.")
      }
    })
  }
})
