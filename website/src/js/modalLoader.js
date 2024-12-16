export const loadModals = () => {
  document.querySelectorAll('.dialog_open').forEach((button) => {
    button.addEventListener('click', () => {
      const dialogId = button.dataset.dialogId;
      const modal = document.querySelector(`#${dialogId}`)

      const closeModalHandler = () => {
        modal.removeEventListener('click', clickOutsideToClose)
        modal.close();
      }

      const clickOutsideToClose = (e) => {
        if (e.target.id === dialogId) {
          closeModalHandler();
        }
      }

      modal.showModal();
      modal.addEventListener('click', clickOutsideToClose);
    });
  });

  document.querySelectorAll('.dialog_close').forEach((button) => {
    button.addEventListener('click', () => {
      const dialogId = button.dataset.dialogId;
      document.querySelector(`#${dialogId}`).close();
    });
  });
}
