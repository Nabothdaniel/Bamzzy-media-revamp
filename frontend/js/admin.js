document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('createAccountModal');
  const backdrop = document.getElementById('modalBackdrop');

  const editModal = document.getElementById('editAccountModal');
  const closeEditBtn = document.getElementById('closeEditModalBtn');
  const openEditBtn = document.getElementById('openEditModalBtn');  // Fixed typo here

  const form = document.getElementById('socialMediaForm');
  const customAlert = document.getElementById('customAlert');
  const loader = document.getElementById('loader');

  // Open and close create account modal
  openModalBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  });

  backdrop.addEventListener('click', () => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  });

  // Open and close edit account modal
  function openEditModal() {
    editModal.classList.remove('hidden');
    setTimeout(() => {
      editModal.children[0].classList.remove('translate-y-full', 'opacity-0');
      editModal.children[0].classList.add('translate-y-0', 'opacity-100');
    }, 50);
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
  }

  openEditBtn.addEventListener('click', openEditModal);
  closeEditBtn.addEventListener('click', closeEditModal);

  // Custom alert utility
  function showCustomAlert(message, duration = 3000) {
    customAlert.textContent = message;
    customAlert.classList.remove('hidden');
    customAlert.classList.add('opacity-100');
    setTimeout(() => {
      customAlert.classList.add('opacity-0');
      setTimeout(() => {
        customAlert.classList.add('hidden');
        customAlert.classList.remove('opacity-0', 'opacity-100');
      }, 300);
    }, duration);
  }

  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    console.log('Submitting form...');
    console.log([...formData.entries()]);

    const imageInput = document.getElementById('imageUpload');

    if (!imageInput.files.length) {
      showCustomAlert('Please select an image.');
      return;
    }

    formData.set('image', imageInput.files[0]);

    loader.classList.remove('hidden');

    const token = localStorage.getItem('token');
    if (!token) {
      loader.classList.add('hidden');
      showCustomAlert('You are not authenticated. Please log in.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/accounts/create-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: Do NOT set 'Content-Type' header with FormData — browser does it automatically
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (response.ok) {
        showCustomAlert('Account created successfully!');
        form.reset();
        // Optionally close modal after success
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
      } else {
        showCustomAlert('Error: ' + (result?.message || 'Unknown error'));
        console.error('Error response:', result?.message);
      }
    } catch (err) {
      showCustomAlert('Error submitting form: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      loader.classList.add('hidden');
    }
  });
});
