document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#accountsTableBody");
    const loadingIndicator = document.getElementById("loadingIndicator");

    function getSessionData() {
        try {
            return JSON.parse(window.name || '{}');
        } catch {
            return {};
        }
    }

    function showCustomAlert(message, type = "success") {
        const alertBox = document.getElementById("customAlert");
        alertBox.textContent = message;

        alertBox.className =
            `fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-opacity duration-300 ` +
            (type === "success" ? "bg-green-600" : "bg-red-600");

        alertBox.classList.remove("hidden");
        alertBox.style.opacity = 1;

        setTimeout(() => {
            alertBox.style.opacity = 0;
            setTimeout(() => alertBox.classList.add("hidden"), 300);
        }, 3000);
    }

    const apiEndpoint = "http://localhost:5000/api/v1/accounts/admin-accounts";
    const sessionData = getSessionData();
    const token = sessionData.token;

    // Show loading spinner
    loadingIndicator.style.display = "flex";
    tableBody.innerHTML = "";

    fetch(apiEndpoint, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch account data");
            return res.json();
        })
        .then(data => {
            loadingIndicator.style.display = "none";
            const accounts = data.accounts;
            tableBody.innerHTML = "";

            if (!accounts || accounts.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-gray-500 py-6">No accounts found.</td>
                    </tr>`;
                return;
            }

            accounts.forEach((account, index) => {
                const isSold = account.isSold;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="px-4 py-3">${index + 1}</td>
                    <td class="px-4 py-3">${account.platform}</td>
                    <td class="px-4 py-3">₦${Number(account.price).toLocaleString()}</td>
                    <td class="px-4 py-3">
                        <span class="inline-block px-2 py-1 text-xs font-medium rounded-full
                            ${isSold ? 'bg-red-100 text-red-600' : account.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                            ${isSold ? 'Sold' : account.status}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-red-600 hover:underline delete-btn cursor-pointer ${isSold ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}" data-id="${account.id}">
                         Delete
                    </td>

                `;
                tableBody.appendChild(row);
            });
        })
        .catch(err => {
            loadingIndicator.style.display = "none";
            console.error("Error:", err);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-red-500 py-6">Error loading accounts.</td>
                </tr>`;
        });

    // Attach delete event listener
    tableBody.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const button = e.target;
            const accountId = button.getAttribute("data-id");

            if (!accountId) return;
            button.textContent = "Deleting...";
            button.disabled = true;

            try {
                const response = await fetch(`http://localhost:5000/api/v1/accounts/delete-account/${accountId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Failed to delete account");
                }

                const row = button.closest("tr");
                if (row) row.remove();

                showCustomAlert("✅ Account deleted successfully!", "success");
            } catch (err) {
                console.error("Delete error:", err);
                showCustomAlert("❌ Error deleting account.", "error");
            } finally {
                button.textContent = "Delete";
                button.disabled = false;
            }
        }
    });
});
