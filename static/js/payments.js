// Airtime Recharge Page Logic
document.addEventListener('DOMContentLoaded', function() {
	// Only run if on the Airtime Recharge page
	const rechargeForm = document.getElementById('rechargeForm');
	if (!rechargeForm) return;

	const networkBtns = document.querySelectorAll('.network-btn');
	const networkInput = document.getElementById('networkInput');
	networkBtns.forEach(b => b.classList.remove('selected'));
	networkInput.value = '';
	networkBtns.forEach(btn => {
		btn.addEventListener('click', function() {
			networkBtns.forEach(b => b.classList.remove('selected'));
			btn.classList.add('selected');
			networkInput.value = btn.getAttribute('data-network');
			networkInput.setCustomValidity('');
		});
	});

	// Auto-select network when a phone number is entered (handles +234 and 0-prefix)
	(function setupAutoSelectByPhone() {
		const phoneInput = document.getElementById('phoneInput');
		if (!phoneInput) return;

		// Sets of 4-digit prefixes (with leading 0)
		const mtn = new Set(['0803','0806','0810','0813','0814','0816','0703','0704','0706','0903','0906','0913','0916']);
		const glo = new Set(['0805','0807','0811','0815','0705','0905','0915']);
		const airtel = new Set(['0802','0808','0812','0901','0902','0904','0907','0701','0708','0911','0912']);
		const nine = new Set(['0809','0817','0818','0908','0909']);

		function normalizeToLocal(num) {
			if (!num) return '';
			let digits = num.replace(/\D/g, '');
			// Handle numbers starting with country code 234 -> replace with leading 0
			if (digits.startsWith('234')) {
				digits = '0' + digits.slice(3);
			}
			// If number already starts with 0, keep as is
			if (!digits.startsWith('0')) {
				// If it's short, try to pad? just return as-is
				return digits;
			}
			return digits;
		}

		function findNetworkByPrefix(localNum) {
			if (localNum.length < 4) return null;
			const prefix = localNum.slice(0,4);
			if (mtn.has(prefix)) return 'MTN';
			if (glo.has(prefix)) return 'Glo'; // Match button value
			if (airtel.has(prefix)) return 'Airtel'; // Match button value
			if (nine.has(prefix)) return '9Mobile'; // Match button value
			return null;
		}

		phoneInput.addEventListener('input', function() {
			const local = normalizeToLocal(phoneInput.value.trim());
			const network = findNetworkByPrefix(local);
			if (!network) {
				// If no matching prefix, do not change user's selection
				return;
			}
			// If already selected and matches, do nothing
			if (networkInput.value && networkInput.value.toLowerCase() === network.toLowerCase()) return;
			// Find a button whose data-network matches the detected network (case-insensitive)
			for (const btn of networkBtns) {
				const dn = (btn.getAttribute('data-network') || '').toLowerCase();
				if (dn.includes(network.toLowerCase()) || network.toLowerCase().includes(dn)) {
					// Trigger click so existing behavior runs (visual selection + value set)
					btn.click();
					return;
				}
			}
			// Fallback: set networkInput directly (if no matching button found)
			networkInput.value = network;
		});
	})();
 
	// Add comma formatting to amount input
	const amountInput = document.getElementById('amountInput');
	if (amountInput) {
		amountInput.addEventListener('input', function(e) {
			let value = amountInput.value.replace(/[^\d]/g, '');
			value = value.replace(/^0+/, '');
			if (value) {
				value = parseInt(value, 10).toLocaleString('en-NG');
			}
			amountInput.value = value;
		});
		amountInput.addEventListener('keydown', function(e) {
			if ([8,9,13,27,46,37,38,39,40].includes(e.keyCode)) return;
			if ((e.ctrlKey||e.metaKey)&&['a','c','v','x'].includes(e.key.toLowerCase())) return;
			if (!/\d/.test(e.key)) { e.preventDefault(); }
		});
	}

	// Form validation and submit
	rechargeForm.addEventListener('submit', function(e) {
		e.preventDefault();
		e.stopPropagation();
		if (!networkInput.value) {
			networkInput.setCustomValidity('Please select a network.');
			networkInput.reportValidity();
			const group = networkInput.closest('.mb-3');
			if (group) { group.classList.add('was-validated'); }
			window.zaAlert?.('Network is not selected.', 'error');
			return;
		} else {
			networkInput.setCustomValidity('');
			const group = networkInput.closest('.mb-3');
			if (group) { group.classList.remove('was-validated'); }
		}
		const phoneInput = document.getElementById('phoneInput');
		const phoneVal = phoneInput.value.trim();
		const phonePattern = /^0[789][01][0-9]{8}$/;
		if (!phonePattern.test(phoneVal)) {
			phoneInput.setCustomValidity('Enter a valid 11-digit Nigerian phone number (e.g. 08012345678).');
		} else {
			phoneInput.setCustomValidity('');
		}
		let amountVal = amountInput.value.replace(/,/g, '');
		if (!amountVal || isNaN(amountVal) || amountVal < 50 || amountVal > 10000) {
			amountInput.setCustomValidity('Enter a valid amount (₦50 - ₦10,000).');
		} else {
			amountInput.setCustomValidity('');
		}
		if (!rechargeForm.checkValidity()) {
			rechargeForm.classList.add('was-validated');
			return;
		}

		// Disable form while processing
		const submitBtn = rechargeForm.querySelector('button[type="submit"]');
		submitBtn.disabled = true;

		// Show loading spinner with initial message
		window.zaShowLoader?.(document.body, 'Initializing recharge...');

		// Simulate a processing sequence with different messages
		setTimeout(() => {
			window.zaShowLoader?.(document.body, 'Validating details...');
			setTimeout(() => {
				window.zaShowLoader?.(document.body, 'Processing recharge...');
				setTimeout(() => {
					window.zaShowLoader?.(document.body, 'Completing transaction...');
					setTimeout(() => {
						window.zaHideLoader?.();
						const msg = 'Recharge successful!\nNetwork: ' + networkInput.value + '\nAmount: ₦' + parseInt(amountVal, 10).toLocaleString('en-NG') + '\nPhone: ' + phoneInput.value;
						window.zaAlert?.(msg, 'success');
						rechargeForm.reset();
						networkBtns.forEach(b => b.classList.remove('selected'));
						rechargeForm.classList.remove('was-validated');
						submitBtn.disabled = false;
					}, 750);
				}, 750);
			}, 750);
		}, 750);
	});

});
