document.addEventListener('DOMContentLoaded', () => {
  const fundBtn = document.getElementById('fundAccountBtn');
  const modal = document.getElementById('fundModal');
  const closeModal = document.getElementById('closeModal');
  const buttons = document.querySelectorAll('#platformButtons button');

  fundBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeModal.addEventListener('click', () => modal.classList.add('hidden'));

  //for available accounts
  const showcaseContainer = document.getElementById("showcaseContainer");
  const items = showcaseContainer.children;
  const seeMoreBtn = document.getElementById("seeMoreBtn");

  const initialVisibleCount = 10;

  document.getElementById('fundForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    alert(`Funding account with $${amount}...`);
    modal.classList.add('hidden');
    // Here, trigger your API call or payment process
  });

  //utils


  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'hover:bg-blue-200');
      });

      button.classList.add('bg-blue-600', 'text-white');
      button.classList.remove('bg-gray-200', 'hover:bg-blue-200');
    });
  });

// for the available accounts

  // Hide items after 10th
  for (let i = initialVisibleCount; i < items.length; i++) {
    items[i].style.display = "none";
  }

  seeMoreBtn.addEventListener("click", () => {
    const isExpanded = seeMoreBtn.dataset.expanded === "true";

    if (isExpanded) {
      // Hide extra items
      for (let i = initialVisibleCount; i < items.length; i++) {
        items[i].style.display = "none";
      }
      seeMoreBtn.textContent = "See More";
      seeMoreBtn.dataset.expanded = "false";
    } else {
      // Show all items
      for (let i = initialVisibleCount; i < items.length; i++) {
        items[i].style.display = "flex";
      }
      seeMoreBtn.textContent = "Show Less";
      seeMoreBtn.dataset.expanded = "true";
    }
  });
});
