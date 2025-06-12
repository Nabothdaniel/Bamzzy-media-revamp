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
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="px-4 py-3">${index + 1}</td>
                    <td class="px-4 py-3">${account.platform}</td>
                    <td class="px-4 py-3">₦${Number(account.price).toLocaleString()}</td>
                    <td class="px-4 py-3">
                        <span class="inline-block px-2 py-1 text-xs font-medium rounded-full
                            ${account.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                            ${account.status}
                        </span>
                    </td>
                    <td class="px-4 py-3 space-x-2">
                        <button class="text-blue-600 hover:underline" data-id="${account.id}">Edit</button>
                        <button class="text-red-600 hover:underline" data-id="${account.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);

                // Attach Edit button functionality
                const editButton = row.querySelector("button.text-blue-600");
                editButton.addEventListener("click", () => openEditModal(account));
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
});

// Open and populate the edit modal
function openEditModal(account) {
    const modal = document.getElementById("editAccountModal");
    modal.classList.remove("hidden");

    document.getElementById("editAccountId").value = account.id;
    document.getElementById("editPlatform").value = account.platform;
    document.getElementById("editPrice").value = account.price;
    document.getElementById("editLoginDetails").value = account.loginDetails;
    document.getElementById("editDescription").value = account.description;
    document.getElementById("editHowToUse").value = account.howToUse;
    document.getElementById("editStatus").value = account.status;

    const preview = document.getElementById("editImagePreview");
    preview.innerHTML = account.image
        ? `<img src="http://localhost:5000${account.image}" alt="Account Image" class="w-20 h-20 object-cover rounded">`
        : '';
}

// Close modal on close button
document.getElementById("closeEditModalBtn").addEventListener("click", () => {
    document.getElementById("editAccountModal").classList.add("hidden");
});

// Submit edited data (PUT request)
document.getElementById("editAccountForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const sessionData = getSessionData();
    const token = sessionData.token;
    const accountId = document.getElementById("editAccountId").value;

    const form = e.target;
    const formData = new FormData(form);

    const data = {
        platform: formData.get("platform"),
        price: formData.get("price"),
        loginDetails: formData.get("loginDetails"),
        description: formData.get("description"),
        howToUse: formData.get("howToUse"),
        status: formData.get("status"),
    };

    const imageFile = formData.get("accountImage");

    const apiUrl = `http://localhost:5000/api/v1/accounts/${accountId}`;

    try {
        const payload = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            payload.append(key, value);
        });

        if (imageFile && imageFile.size > 0) {
            payload.append("accountImage", imageFile);
        }

        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: payload
        });

        if (!response.ok) throw new Error("Update failed");

        alert("Account updated successfully");
        document.getElementById("editAccountModal").classList.add("hidden");
        location.reload();
    } catch (error) {
        console.error("Update error:", error);
        alert("Failed to update account. Please try again.");
    }
});
