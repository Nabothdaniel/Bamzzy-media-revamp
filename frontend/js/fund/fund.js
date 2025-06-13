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

// Utility to safely get session token
function getSessionData() {
    try {
        return JSON.parse(window.name || "{}");
    } catch {
        return {};
    }
}

const createAccountBtn = document.getElementById('createAccountBtn');
const accountInfo = document.getElementById('accountInfo');
const accountNumberEl = document.getElementById('accountNumber');
const accountNameEl = document.getElementById('accountName');
const bankNameEl = document.getElementById('bankName');
const fundingInstructions = document.getElementById('fundingInstructions');
const userInfoForm = document.getElementById('userInfoForm');
const copyAccountBtn = document.getElementById('copyAccountBtn');
const copySuccess = document.getElementById('copySuccess');

// Fetch existing virtual account if available
async function fetchVirtualAccount() {
    try {
        const session = getSessionData();
        const response = await fetch('http://localhost:5000/api/v1/fund/get-virtual-account', {
            headers: {
                'Authorization': `Bearer ${session.token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.data?.accountNumber) {
            showAccountInfo(data.data);
            createAccountBtn.disabled = true;
            createAccountBtn.textContent = 'Virtual Account Created';
            userInfoForm?.classList.add('hidden');
        } else {
            showCustomAlert("No virtual account found. You may create one.", "info");
        }
    } catch (err) {
        showCustomAlert("⚠️ Failed to fetch virtual account. Please check your connection.", "error");
    }
}

fetchVirtualAccount();

async function createVirtualAccount(userName, userEmail, userPhone) {
    try {
        const session = getSessionData();
        const response = await fetch('http://localhost:5000/api/v1/fund/create-virtual-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({
                name: userName,
                email: userEmail,
                phoneNumber: userPhone
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to create virtual account');
        showCustomAlert("✅ Virtual account created successfully.");
        return data.data;
    } catch (err) {
        console.error('❌ Error creating virtual account:', err.message);
        showCustomAlert("❌ " + err.message, "error");
    }
}

function showAccountInfo(info) {
    accountInfo.classList.remove('hidden');
    accountNameEl.textContent = info.accountName;
    accountNumberEl.textContent = info.accountNumber;
    bankNameEl.textContent = info.bankName;
    fundingInstructions.classList.remove('hidden');
    userInfoForm?.classList.add('hidden');
}

createAccountBtn.addEventListener('click', async () => {
    const name = document.getElementById('userNameInput').value.trim();
    const email = document.getElementById('userEmailInput').value.trim();
    const phone = document.getElementById('userPhoneInput').value.trim();

    if (!name || !email || !phone) {
        showCustomAlert("⚠️ Please fill in all fields before proceeding.", "error");
        return;
    }

    const data = await createVirtualAccount(name, email, phone);
    if (data?.accountNumber) {
        showAccountInfo(data);
        createAccountBtn.disabled = true;
        createAccountBtn.textContent = 'Virtual Account Created';
        userInfoForm?.classList.add('hidden');
    }
});

copyAccountBtn?.addEventListener('click', () => {
    const number = accountNumberEl.textContent;
    navigator.clipboard.writeText(number).then(() => {
        copySuccess.classList.remove('hidden');
        setTimeout(() => copySuccess.classList.add('hidden'), 2000);
        showCustomAlert("Account number copied to clipboard.");
    }).catch(() => {
        showCustomAlert("❌ Failed to copy account number.", "error");
    });
});
