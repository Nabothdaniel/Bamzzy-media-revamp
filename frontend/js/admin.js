document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('createAccountModal');
  const backdrop = document.getElementById('modalBackdrop');

  const Modal = document.getElementById('editAccountModal');
  const closeBtn = document.getElementById('closeEditModalBtn');
  const opneBtn = document.getElementById('openEditModalBtn');


  //create account form
  const form = document.getElementById('socialMediaForm');
  const customAlert = document.getElementById('customAlert');

  //loader
  const loader = document.getElementById('loader');

  //openModalBtn

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


  // Open modal (you trigger this based on user action)
  function openEditModal() {
    Modal.classList.remove('hidden');
    setTimeout(() => {
      Modal.children[0].classList.remove('translate-y-full', 'opacity-0');
      Modal.children[0].classList.add('translate-y-0', 'opacity-100');
    }, 50);
  }

  // Close modal
  function closeEditModal() {
    Modal.classList.add('hidden')
  }

  opneBtn.addEventListener('click', openEditModal);
  closeBtn.addEventListener('click', closeEditModal);



  function showCustomAlert(message, duration = 3000) {
    customAlert.textContent = message;
    customAlert.classList.remove('hidden');
    // Optional: add fade-in effect
    customAlert.classList.add('opacity-100');
    setTimeout(() => {
      // Optional: add fade-out effect
      customAlert.classList.add('opacity-0');
      setTimeout(() => {
        customAlert.classList.add('hidden');
        customAlert.classList.remove('opacity-0', 'opacity-100');
      }, 300); // match fade-out duration
    }, duration);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const imageInput = document.getElementById('imageUpload');
    if (imageInput.files.length > 0) {
      formData.set('image', imageInput.files[0]);
    } else {
      showCustomAlert('Please select an image.');
      return;
    }

    const token = localStorage.getItem('token');

    loader.classList.remove('hidden');  // Show loader

    try {
      const response = await fetch('http://localhost:5000/api/v1/accounts/create-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showCustomAlert('Account created successfully!');
        form.reset();
      } else {
        showCustomAlert('Error: ' + result.message);
      }
    } catch (err) {
      showCustomAlert('Error submitting form: ' + err.message);
    }
  });


})