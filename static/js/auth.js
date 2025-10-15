window.addEventListener('DOMContentLoaded', function() {
  let mode = 'signin'; // or 'signup'

  function switchMode(newMode) {
    if (newMode) mode = newMode;
    else mode = (mode === 'signin') ? 'signup' : 'signin';
    document.getElementById('formTitle').textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
    document.getElementById('submitBtn').textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
    document.getElementById('switchText').textContent = mode === 'signin' ? "Don't have an account?" : "Already have an account?";
    document.getElementById('switchMode').textContent = mode === 'signin' ? "Sign Up" : "Sign In";
    document.getElementById('signupFields').style.display = mode === 'signup' ? '' : 'none';
    document.getElementById('agreementField').style.display = mode === 'signup' ? '' : 'none';
    // Only show send code text and code field in signup mode
    document.getElementById('sendCodeText').style.display = mode === 'signup' ? '' : 'none';
    document.getElementById('codeGroup').style.display = 'none';
    // Show forgot password only in signin mode
    const forgotContainer = document.getElementById('forgotPasswordContainer');
    if (forgotContainer) {
      forgotContainer.style.display = mode === 'signin' ? '' : 'none';
    }
  }

  document.getElementById('switchMode').addEventListener('click', function(e) {
    e.preventDefault();
    switchMode();
  });

  // On page load, ensure sign in is default
  switchMode('signin');

  // Send code logic (only for signup) with 60s cooldown
  const sendCodeText = document.getElementById('sendCodeText');
  const emailInput = document.getElementById('emailInput');
  const codeGroup = document.getElementById('codeGroup');
  let signupCooldown = 0;
  let signupTimer = null;
  function startSignupCooldown() {
    signupCooldown = 60;
    sendCodeText.style.pointerEvents = 'none';
    updateSignupCooldown();
    signupTimer = setInterval(() => {
      signupCooldown--;
      updateSignupCooldown();
      if (signupCooldown <= 0) {
        clearInterval(signupTimer);
        sendCodeText.textContent = 'Resend Code';
        sendCodeText.style.pointerEvents = '';
      }
    }, 1000);
  }
  function updateSignupCooldown() {
    sendCodeText.textContent = signupCooldown > 0 ? `Wait ${signupCooldown}s` : 'Resend Code';
  }
  sendCodeText.addEventListener('click', async function() {
    if (mode !== 'signup' || signupCooldown > 0) return;
    const email = emailInput.value.trim();
    if (!email) {
      zaAlert('Enter your email first', 'error');
      return;
    }
    sendCodeText.textContent = 'Sending...';
    sendCodeText.style.pointerEvents = 'none';
    try {
      const resp = await fetch('/api/auth/send_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      if (data.ok) {
        zaAlert('Code sent to your email', 'success');
        codeGroup.style.display = '';
        startSignupCooldown();
      } else {
        zaAlert(data.error || 'Failed to send code', 'error');
        sendCodeText.textContent = 'Send Code';
        sendCodeText.style.pointerEvents = '';
      }
    } catch (e) {
      zaAlert('Network error', 'error');
      sendCodeText.textContent = 'Send Code';
      sendCodeText.style.pointerEvents = '';
    }
  });

  document.getElementById('authForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = this.email.value.trim();
    const password = this.password.value;
    if (!email || !password) {
      zaAlert('Email and password required', 'error');
      return;
    }
    let payload = { email, password };
    if (mode === 'signup') {
      const fullname = this.fullname.value.trim();
      const phone = this.phone.value.trim();
      const confirm_password = this.confirm_password.value;
      const agreement = this.agreement.checked;
      const email_code = this.email_code.value.trim();
      if (!fullname || !phone || !confirm_password) {
        zaAlert('Please fill all signup fields', 'error');
        return;
      }
      if (password !== confirm_password) {
        zaAlert('Passwords do not match', 'error');
        return;
      }
      if (!agreement) {
        zaAlert('You must agree to the terms', 'error');
        return;
      }
      if (!email_code) {
        zaAlert('Enter the verification code sent to your email', 'error');
        return;
      }
      payload = { ...payload, fullname, phone, email_code };
    }
    const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
    try {
      const loaderText = mode === 'signin' ? 'Logging in...' : 'Signing up...';
      window.zaShowLoader && window.zaShowLoader(document.body, loaderText);
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      window.zaHideLoader && window.zaHideLoader();
      if (data.ok) {
        zaAlert(data.message || (mode === 'signin' ? 'Signed in!' : 'Signup successful!'), 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        zaAlert(data.error || 'Error', 'error');
      }
    } catch (err) {
      window.zaHideLoader && window.zaHideLoader();
      zaAlert('Network error', 'error');
    }
  });

  // Forgot password modal logic with 60s cooldown
  document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotModal = document.getElementById('forgotModal');
    const forgotForm = document.getElementById('forgotForm');
    const forgotEmail = document.getElementById('forgotEmail');
    const forgotSendCodeBtn = document.getElementById('forgotSendCodeBtn');
    const forgotCodeGroup = document.getElementById('forgotCodeGroup');
    const forgotCode = document.getElementById('forgotCode');
    const forgotPasswordGroup = document.getElementById('forgotPasswordGroup');
    const forgotPassword = document.getElementById('forgotPassword');
    const forgotConfirmPasswordGroup = document.getElementById('forgotConfirmPasswordGroup');
    const forgotConfirmPassword = document.getElementById('forgotConfirmPassword');
    const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
    const forgotCancelBtn = document.getElementById('forgotCancelBtn');
    let forgotCooldown = 0;
    let forgotTimer = null;
    function startForgotCooldown() { 
      forgotCooldown = 60;
      forgotSendCodeBtn.disabled = true;
      updateForgotCooldown();
      forgotTimer = setInterval(() => {
        forgotCooldown--;
        updateForgotCooldown();
        if (forgotCooldown <= 0) {
          clearInterval(forgotTimer);
          forgotSendCodeBtn.textContent = 'Resend Code';
          forgotSendCodeBtn.disabled = false;
        }
      }, 1000);
    }
    function updateForgotCooldown() {
      forgotSendCodeBtn.textContent = forgotCooldown > 0 ? `Wait ${forgotCooldown}s` : 'Resend Code';
    }
    forgotSendCodeBtn?.addEventListener('click', async function() {
      if (forgotCooldown > 0) return;
      const email = forgotEmail.value.trim();
      if (!email) {
        zaAlert('Enter your email', 'error');
        return;
      }
      forgotSendCodeBtn.textContent = 'Sending...';
      forgotSendCodeBtn.disabled = true;
      try {
        const resp = await fetch('/api/auth/send_code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await resp.json();
        if (data.ok) {
          zaAlert('Code sent to your email', 'success');
          forgotCodeGroup.style.display = '';
          forgotPasswordGroup.style.display = '';
          forgotConfirmPasswordGroup.style.display = '';
          forgotSendCodeBtn.style.display = 'none';
          forgotSubmitBtn.style.display = '';
          startForgotCooldown();
        } else {
          zaAlert(data.error || 'Failed to send code', 'error');
          forgotSendCodeBtn.textContent = 'Send Code';
          forgotSendCodeBtn.disabled = false;
        }
      } catch (e) {
        zaAlert('Network error', 'error');
        forgotSendCodeBtn.textContent = 'Send Code';
        forgotSendCodeBtn.disabled = false;
      }
    });
    // ...existing code for forgot modal open/close and submit...
  });
});