(function() {
  if (window.zaAlert) return; // Prevent double init

  function showAlert(msg, type = 'success', duration = 3000) {
    let alertEl = document.getElementById('zaAlert');
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.id = 'zaAlert';
      alertEl.className = 'za-alert';
      document.body.appendChild(alertEl);
    }
    alertEl.textContent = msg;
    alertEl.className = 'za-alert za-alert-show' + (type === 'error' ? ' za-alert-error' : ' za-alert-success');
    clearTimeout(alertEl._timeout);
    alertEl._timeout = setTimeout(() => {
      alertEl.classList.remove('za-alert-show');
    }, duration);
  }

  window.zaAlert = showAlert;
})();



// Add after existing code

(function() {
  if (window.zaShowLoader) return; // Prevent double init

  // Create spinner overlay
  const spinnerOverlay = document.createElement('div');
  spinnerOverlay.className = 'za-spinner-overlay';
  spinnerOverlay.style.display = 'none';
  spinnerOverlay.innerHTML = `
    <div class="za-spinner-container">
      <div class="za-spinner"></div>
      <div class="za-spinner-text">Loading...</div>
    </div>
  `;
  document.body.appendChild(spinnerOverlay);

  // Make sure the spinner is on top of everything
  spinnerOverlay.style.zIndex = '9999';

  // Show/hide loader functions
  function showLoader(parent = document.body, text = 'Loading...') {
    spinnerOverlay.querySelector('.za-spinner-text').textContent = text;
    spinnerOverlay.style.display = 'flex';
  }

  function hideLoader() {
    spinnerOverlay.style.display = 'none';
  }

  // Expose functions globally
  window.zaShowLoader = showLoader;
  window.zaHideLoader = hideLoader;
})();