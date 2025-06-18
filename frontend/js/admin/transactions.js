document.addEventListener("DOMContentLoaded", () => {
    const session = JSON.parse(window.name || "{}");
    const token = session?.token;
    const tableBody = document.getElementById("transactionsTableBody");

    const fetchTransactions = async () => {
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-gray-500">Loading transactions...</td>
      </tr>
    `;

        try {
            const res = await fetch("http://localhost:5000/api/v1/transactions/get-all-transactions", {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to fetch");


            const data = await res.json();
            const transactions = data.transactions;
            console.log(transactions)

            if (transactions.length === 0) {
                tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-gray-500">No transactions found.</td>
          </tr>
        `;
                return;
            }

            tableBody.innerHTML = "";

            transactions.forEach((txn, index) => {

              console.log(txn)

                const statusColors = {
                    Completed: "text-green-700 bg-green-100",
                    Pending: "text-yellow-700 bg-yellow-100",
                    Failed: "text-red-700 bg-red-100"
                };

                const row = document.createElement("tr");
                row.className = "hover:bg-gray-50";

                row.innerHTML = `
          <td class="px-4 py-3">${txn.transactionId}</td>
          <td class="px-4 py-3">${txn.user.name || "Unknown"}</td>
          <td class="px-4 py-3 capitalize">${txn.type}</td>
          <td class="px-4 py-3">₦${Number(txn.price).toLocaleString()}</td>
          <td class="px-4 py-3">${new Date(txn.createdAt).toLocaleDateString()}</td>
          <td class="px-4 py-3">
            <span class="inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[txn.status] || 'bg-gray-100 text-gray-700'}">
              ${txn.status}
            </span>
          </td>
        `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error loading transactions:", error);
            tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-red-500">Error loading transactions.</td>
        </tr>
      `;
        }
    };

    fetchTransactions();
});
