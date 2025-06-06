
//@desc     get all accounts by admin
//@route    GET /api/v1/accounts
//@role     get all accounts
const getAccounts = async (req, res) => {
    const accounts = readDataFile(ACCOUNTS_FILE)

    // Remove login details for non-admin users
    let filteredAccounts = accounts
    if (req.user.role !== "admin") {
        filteredAccounts = accounts.map((account) => {
            const { loginDetails, ...accountData } = account
            return accountData
        })
    }

    return res.json({ success: true, accounts: filteredAccounts })
}


//@desc     get account by id
//@route    GET /api/v1/accounts:id
//@role     user get account by id
const getAccountById = (req, res) => {
    const { id } = req.params
    const accounts = readDataFile(ACCOUNTS_FILE)

    // Find account by id
    const account = accounts.find((account) => account.id === id)

    if (!account) {
        return res.status(404).json({ success: false, message: "Account not found" })
    }

    // Remove login details for non-admin users
    if (req.user.role !== "admin") {
        const { loginDetails, ...accountData } = account
        return res.json({ success: true, account: accountData })
    }

    return res.json({ success: true, account })
}

//@desc   create account by admin
//@route POST /api/vi/accounts
//@role  create account

const createAccount = (req, res) => {
    const { platform, image, price, loginDetails, description, howToUse } = req.body

    if (!platform || !image || !price || !loginDetails || !description || !howToUse) {
        return res.status(400).json({ success: false, message: "Missing required fields" })
    }

    const accounts = readDataFile(ACCOUNTS_FILE)

    // Create new account
    const newAccount = {
        id: Date.now().toString(),
        platform,
        image,
        price: Number.parseFloat(price),
        loginDetails,
        description,
        howToUse,
        status: "available",
    }

    accounts.push(newAccount)

    if (writeDataFile(ACCOUNTS_FILE, accounts)) {
        return res.json({ success: true, message: "Account added successfully", account: newAccount })
    } else {
        return res.status(500).json({ success: false, message: "Failed to add account" })
    }
}

const updateAccount = (req, res) => {
    const { id } = req.params
    const { platform, image, price, loginDetails, description, howToUse, status } = req.body

    if (!platform || !price || !loginDetails || !description || !howToUse || !status) {
        return res.status(400).json({ success: false, message: "Missing required fields" })
    }

    const accounts = readDataFile(ACCOUNTS_FILE)

    // Find account index
    const accountIndex = accounts.findIndex((account) => account.id === id)

    if (accountIndex === -1) {
        return res.status(404).json({ success: false, message: "Account not found" })
    }

    // Update account
    const updatedAccount = {
        ...accounts[accountIndex],
        platform,
        price: Number.parseFloat(price),
        loginDetails,
        description,
        howToUse,
        status,
    }

    // Update image if provided
    if (image) {
        updatedAccount.image = image
    }

    accounts[accountIndex] = updatedAccount

    if (writeDataFile(ACCOUNTS_FILE, accounts)) {
        return res.json({ success: true, message: "Account updated successfully", account: updatedAccount })
    } else {
        return res.status(500).json({ success: false, message: "Failed to update account" })
    }
}

const deleteAccount = (req, res) => {
    const { id } = req.params
    const accounts = readDataFile(ACCOUNTS_FILE)

    // Find account index
    const accountIndex = accounts.findIndex((account) => account.id === id)

    if (accountIndex === -1) {
        return res.status(404).json({ success: false, message: "Account not found" })
    }

    // Remove account
    accounts.splice(accountIndex, 1)

    if (writeDataFile(ACCOUNTS_FILE, accounts)) {
        return res.json({ success: true, message: "Account deleted successfully" })
    } else {
        return res.status(500).json({ success: false, message: "Failed to delete account" })
    }
}


export { getAccounts, getAccountById, createAccount, updateAccount, deleteAccount }