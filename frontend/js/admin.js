document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('createAccountModal');
  const backdrop = document.getElementById('modalBackdrop');

  const Modal = document.getElementById('editAccountModal');
  const closeBtn = document.getElementById('closeEditModalBtn');
  const opneBtn = document.getElementById('openEditModalBtn');

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

})