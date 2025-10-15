// Logout logic with confirmation
document.getElementById('logoutBtn')?.addEventListener('click', function () {
    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.setAttribute('tabindex', '-1');
    modalElement.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Logout</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to logout?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No, Stay</button>
            <button type="button" class="btn btn-danger" id="confirmLogout">Yes, Logout</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalElement);
    
    const confirmModal = new bootstrap.Modal(modalElement);
    
    // Handle confirm button click
    modalElement.querySelector('#confirmLogout').addEventListener('click', function() {
      confirmModal.hide();
      window.zaShowLoader && window.zaShowLoader(document.body, 'Logging out...');
      
      // Add a delay of 3 seconds before actual logout
      setTimeout(() => {
        fetch('/logout', { method: 'GET' })
          .then(() => {
            window.zaHideLoader && window.zaHideLoader();
            window.location.href = '/auth';
          })
          .catch(() => {
            window.zaHideLoader && window.zaHideLoader();
            console.error('Logout failed');
          });
      }, 3000); // 3 seconds delay
    });

    // Clean up modal when hidden
    modalElement.addEventListener('hidden.bs.modal', function() {
      document.body.removeChild(modalElement);
    });

    confirmModal.show();
});

// Mobile redirect for Airtime mini-item
document.addEventListener('DOMContentLoaded', function() {
    var miniAirtime = document.querySelector('.mini-item[data-service="Airtime"]');
    if (miniAirtime) {
      miniAirtime.addEventListener('click', function(e) {
        if (window.innerWidth <= 575) {
          window.location.href = 'airtime.html';
        }
      });
    }
});