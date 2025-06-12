document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('createAccountModal');
  const backdrop = document.getElementById('modalBackdrop');

 

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

  function getSessionData() {
    try {
      return JSON.parse(window.name || '{}');
    } catch {
      return {};
    }
  }


  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    console.log('Submitting form...');
    console.log([...formData.entries()]);


   

    loader.classList.remove('hidden');
    
   const sessionData = getSessionData();
    const token = sessionData.token;

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
