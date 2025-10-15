// ZirabAfrica frontend JS — full, finished, enhanced with "View Details" (FORMAT 1, passenger table)

// helper selectors
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

// set footer year
try { if (document.getElementById('year')) document.getElementById('year').textContent = new Date().getFullYear(); } catch (e) {}

// bootstrap validation helper
(function () {
  'use strict';
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
      form.classList.add('was-validated');
    }, false);
  });
})();

// -----------------------------
// Bookings (localStorage)
// -----------------------------
function saveBooking(type, data) {
  const all = JSON.parse(localStorage.getItem('za_bookings') || '[]');
  const id = type.slice(0, 3).toUpperCase() + '-' + Date.now().toString(36).slice(-6);
  const item = { id, type, data, created: new Date().toISOString() };
  all.unshift(item);
  localStorage.setItem('za_bookings', JSON.stringify(all));
  renderBookings();
}

function renderBookings() {
  const list = document.getElementById('bookingList'); if (!list) return;
  list.innerHTML = '';
  const all = JSON.parse(localStorage.getItem('za_bookings') || '[]');
  if (!all.length) { list.innerHTML = '<div class="text-muted">No bookings yet — try a demo booking above.</div>'; return; }
  all.forEach(b => {
    const el = document.createElement('div'); el.className = 'list-group-item d-flex justify-content-between align-items-start';
    el.innerHTML = `
      <div>
        <div class="fw-semibold">${b.type} <small class="text-muted">${new Date(b.created).toLocaleString()}</small></div>
        <div class="small text-muted">${summaryFromData(b)}</div>
      </div>
      <div class="text-end">
        <button class="btn btn-sm btn-outline-secondary me-2" data-id="${b.id}" onclick="viewBooking('${b.id}')"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-id="${b.id}" onclick="deleteBooking('${b.id}')"><i class="bi bi-trash"></i></button>
      </div>
    `;
    list.appendChild(el);
  });
}

function summaryFromData(b) {
  try {
    if (b.type === 'Flight') {
      return `${b.data.from || ''} → ${b.data.to || ''} • ${b.data.depart || b.data.date || ''} (${b.data.adult || 1} Adult, ${b.data.children || 0} Children, ${b.data.infant || 0} Infant, ${b.data.class || 'Economy'})`;
    }
    if (b.type === 'Hotel') return `${b.data.location} • ${b.data.checkin} → ${b.data.checkout}`;
    if (b.type === 'Tour') return `${b.data.tour} • ${b.data.tourdate}`;
    if (b.type === 'Train') return `${b.data.from} → ${b.data.to} • ${b.data.date}`;
    if (b.type === 'Bus') return `${b.data.route} • ${b.data.date}`;
    if (b.type === 'Bill') return `${b.data.service} • ${b.data.account} • ${b.data.amount}`;
  } catch (e) { return 'Details...'; }
  return 'Details...';
}

window.viewBooking = function (id) {
  const all = JSON.parse(localStorage.getItem('za_bookings') || '[]');
  const b = all.find(x => x.id === id); if (!b) return;
  const node = document.createElement('div'); node.className = 'modal fade show'; node.style.display = 'block';
  node.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">${b.type} — ${b.id}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body"><pre class="small">${JSON.stringify(b, null, 2)}</pre></div>
        <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Close</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(node);
  const bs = new bootstrap.Modal(node); bs.show();
  node.addEventListener('hidden.bs.modal', () => { node.remove(); });
}

window.deleteBooking = function (id) {
  if (!confirm('Delete this booking?')) return;
  const all = JSON.parse(localStorage.getItem('za_bookings') || '[]').filter(x => x.id !== id);
  localStorage.setItem('za_bookings', JSON.stringify(all)); renderBookings();
}

// -----------------------------
// UI helpers (grid, mini actions, layout)
// -----------------------------
function attachGridActions() {
  document.querySelectorAll('#grid-payments button[data-action]').forEach(btn => {
    if (btn.__attached) return; btn.__attached = true;
    btn.addEventListener('click', function () {
      const svc = this.dataset.service; const sf = document.querySelector('#billsForm');
      if (sf) {
        const sel = sf.querySelector('select[name="service"]'); if (sel) sel.value = svc;
        const tabBtn = document.querySelector('#serviceTabs button[data-bs-target="#billsForm"]'); if (tabBtn) { try { new bootstrap.Tab(tabBtn).show(); } catch (e) { } }
        zaAlert(`${svc} selected — open Payments form`);
        setTimeout(() => { const el = document.querySelector('#billsForm'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }, 200);
      }
    });
  });
}

function attachMiniActions() {
  const mini = document.getElementById('miniPayments'); if (!mini) return;
  mini.querySelectorAll('.mini-item').forEach(item => {
    if (item.__attached) return; item.__attached = true;
    item.addEventListener('click', function () {
      if (this.id === 'miniViewAll') {
        const wrapper = document.getElementById('gridWrapper');
        const isHidden = wrapper.classList.contains('grid-hidden');
        toggleGrid(isHidden, true);
        if (isHidden) {
          document.getElementById('announcement').style.display = 'flex';
          // Only scroll if not on mobile
          if (window.innerWidth > 575) {
            setTimeout(() => document.getElementById('gridWrapper').scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
          }
          // Hide mini row on mobile
          if (window.innerWidth <= 575) {
            mini.style.display = 'none';
          }
        } else {
          setTimeout(() => document.getElementById('miniPayments').scrollIntoView({ behavior: 'smooth', block: 'center' }), 260);
          // Show mini row again on mobile
          if (window.innerWidth <= 575) {
            mini.style.display = 'flex';
          }
        }
        return;
      }
      const svc = this.dataset.service; const sf = document.querySelector('#billsForm'); if (sf) {
        const sel = sf.querySelector('select[name="service"]'); if (sel) { sel.value = svc; const tabBtn = document.querySelector('#serviceTabs button[data-bs-target="#billsForm"]'); if (tabBtn) { try { new bootstrap.Tab(tabBtn).show(); } catch (e) { } } zaAlert(`${svc} selected — open Payments form`); setTimeout(() => { const el = document.querySelector('#billsForm'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }, 200); }
      }
    });
  });
}

function toggleGrid(show, animate = true) {
  const wrapper = document.getElementById('gridWrapper');
  if (!wrapper) return;
  const miniView = document.getElementById('miniViewAll');
  const hideBtn = document.getElementById('hideGridBtn');
  if (show) {
    wrapper.classList.remove('grid-hidden');
    wrapper.classList.add('grid-shown');
    wrapper.setAttribute('aria-hidden', 'false');
    document.getElementById('grid-payments').classList.remove('compact-hidden');
    if (miniView) {
      miniView.querySelector('.label').textContent = 'Hide';
      miniView.querySelector('i').className = 'bi bi-chevron-up';
      miniView.title = 'Hide services';
    }
    // Show hide button on mobile
    if (hideBtn && window.innerWidth <= 575) {
      hideBtn.style.display = '';
    }
  } else {
    wrapper.classList.remove('grid-shown');
    wrapper.classList.add('grid-hidden');
    wrapper.setAttribute('aria-hidden', 'true');
    document.getElementById('grid-payments').classList.add('compact-hidden');
    if (miniView) {
      miniView.querySelector('.label').textContent = 'View All →';
      miniView.querySelector('i').className = 'bi bi-grid-3x3-gap-fill';
      miniView.title = 'View All services';
    }
    // Hide hide button
    if (hideBtn) {
      hideBtn.style.display = 'none';
    }
  }
}

// Attach event to the hide button
document.getElementById('hideGridBtn')?.addEventListener('click', function () {
  toggleGrid(false, true);
  // Show mini payments row again on mobile
  const mini = document.getElementById('miniPayments');
  if (mini && window.innerWidth <= 575) {
    mini.style.display = 'flex';
  }
});

function layoutForWidth() {
  const isSmall = window.innerWidth <= 400; const mini = document.getElementById('miniPayments'); const announce = document.getElementById('announcement');
  if (isSmall) { if (mini) { mini.setAttribute('aria-hidden', 'false'); mini.style.display = 'flex'; } if (announce) announce.style.display = 'none'; toggleGrid(false, false); }
  else { if (mini) { mini.setAttribute('aria-hidden', 'true'); mini.style.display = 'none'; } if (announce) announce.style.display = 'flex'; const wrapper = document.getElementById('gridWrapper'); if (wrapper) { wrapper.classList.remove('grid-hidden'); wrapper.classList.add('grid-shown'); wrapper.setAttribute('aria-hidden', 'false'); } const gp = document.getElementById('grid-payments'); if (gp) gp.classList.remove('compact-hidden'); }
}

// -----------------------------
// Forms wiring
// -----------------------------
function attachForms() {
  document.getElementById('form-flight')?.addEventListener('submit', function (e) {
    e.preventDefault(); if (!this.checkValidity()) return;
    const hiddenFrom = document.querySelector('input[name="from"]');
    const hiddenTo = document.querySelector('input[name="to"]');
    const depart = this.querySelector('input[name="depart"]')?.value || '';
    const tripType = this.querySelector('input[name="tripType"]:checked')?.value || 'oneway';
    const returnDate = this.querySelector('input[name="return"]')?.value || '';
    const cls = this.querySelector('select[name="class"]')?.value || 'Economy';
    const adult = this.querySelector('input[name="adult"]')?.value || 1;
    const children = this.querySelector('input[name="children"]')?.value || 0;
    const infant = this.querySelector('input[name="infant"]')?.value || 0;
    function extractCode(val) {
      if (!val) return '';
      const m = val.match(/^([A-Z0-9]{3})/);
      return m ? m[1] : val;
    }
    const fromCode = extractCode(hiddenFrom?.value);
    const toCode = extractCode(hiddenTo?.value);
    if (!fromCode || !toCode || !depart) { zaAlert('Please select origin, destination and depart date', 'error'); return; }
    const currency = document.getElementById('currencySelect')?.value || 'USD';
    // Pass returnDate if round trip
    searchFlightsAndRender({
      from: fromCode,
      to: toCode,
      date: depart,
      adults: adult,
      children,
      infant,
      cabin: cls,
      tripType,
      returnDate: tripType === 'round' ? returnDate : '',
      currency
    });
  });

  // keep other forms behaviour unchanged
  document.getElementById('form-hotel')?.addEventListener('submit', function (e) { e.preventDefault(); if (!this.checkValidity()) return; const fd = Object.fromEntries(new FormData(this).entries()); saveBooking('Hotel', fd); this.reset(); this.classList.remove('was-validated'); });
  document.getElementById('form-tour')?.addEventListener('submit', function (e) { e.preventDefault(); if (!this.checkValidity()) return; const fd = Object.fromEntries(new FormData(this).entries()); saveBooking('Tour', fd); this.reset(); this.classList.remove('was-validated'); });
  document.getElementById('form-train')?.addEventListener('submit', function (e) { e.preventDefault(); if (!this.checkValidity()) return; const fd = Object.fromEntries(new FormData(this).entries()); saveBooking('Train', fd); this.reset(); this.classList.remove('was-validated'); });
  document.getElementById('form-bus')?.addEventListener('submit', function (e) { e.preventDefault(); if (!this.checkValidity()) return; const fd = Object.fromEntries(new FormData(this).entries()); saveBooking('Bus', fd); this.reset(); this.classList.remove('was-validated'); });
  document.getElementById('form-bills')?.addEventListener('submit', function (e) { e.preventDefault(); if (!this.checkValidity()) return; const fd = Object.fromEntries(new FormData(this).entries()); saveBooking('Bill', fd); this.reset(); this.classList.remove('was-validated'); });
}

// -----------------------------
// deep-link anchors
// -----------------------------
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const href = a.getAttribute('href');
  if (href.startsWith('#') && href.length > 1) {
    const el = document.querySelector(href);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
  }
}));

// -----------------------------
// Category tab toggle for Payments & Travel
// -----------------------------
function attachCategoryToggle() {
  const catBtns = $$('.cat-btn');
  const gridPayments = $('#gridWrapper');
  const gridTravel = $('#grid-travel');

  catBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      catBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.cat;
      if (cat === 'payments') {
        if (gridPayments) {
          gridPayments.style.display = '';
          gridPayments.setAttribute('aria-hidden', 'false');
        }
        if (gridTravel) gridTravel.style.display = 'none';
      } else if (cat === 'travel') {
        if (gridPayments) {
          gridPayments.style.display = 'none';
          gridPayments.setAttribute('aria-hidden', 'true');
        }
        if (gridTravel) gridTravel.style.display = '';
      }
    });
  });
}

// -----------------------------
// Demo airport data + selector
// -----------------------------
const AIRPORTS = [
  { code: "LOS", name: "Murtala Muhammed International Airport", state: "Lagos", country: "Nigeria" },
  { code: "ABV", name: "Nnamdi Azikiwe International Airport", state: "Abuja", country: "Nigeria" },
  { code: "KAN", name: "Mallam Aminu Kano International Airport", state: "Kano", country: "Nigeria" },
  { code: "PHC", name: "Port Harcourt International Airport", state: "Rivers", country: "Nigeria" },
  { code: "ENU", name: "Akanu Ibiam International Airport", state: "Enugu", country: "Nigeria" },
  { code: "BEN", name: "Benin Airport", state: "Edo", country: "Nigeria" },
  { code: "ILR", name: "Ilorin International Airport", state: "Kwara", country: "Nigeria" },
  { code: "JFK", name: "John F. Kennedy International Airport", state: "New York", country: "USA" },
  { code: "LHR", name: "London Heathrow Airport", state: "London", country: "UK" },
  { code: "CDG", name: "Charles de Gaulle Airport", state: "Paris", country: "France" },
  { code: "DXB", name: "Dubai International Airport", state: "Dubai", country: "UAE" },
  { code: "HND", name: "Tokyo Haneda Airport", state: "Tokyo", country: "Japan" },
  { code: "SYD", name: "Sydney Airport", state: "Sydney", country: "Australia" },
  { code: "FRA", name: "Frankfurt Airport", state: "Frankfurt", country: "Germany" },
  { code: "AMS", name: "Amsterdam Schiphol Airport", state: "Amsterdam", country: "Netherlands" },
  { code: "SIN", name: "Singapore Changi Airport", state: "Singapore", country: "Singapore" },
  { code: "ICN", name: "Incheon International Airport", state: "Seoul", country: "South Korea" },
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", state: "Atlanta", country: "USA" },
  { code: "PEK", name: "Beijing Capital International Airport", state: "Beijing", country: "China" },
  { code: "LAX", name: "Los Angeles International Airport", state: "Los Angeles", country: "USA" },
];

// airport selection UI
let selectedFrom = null;
let selectedTo = null;

function setupAirportSelection() {
  const fromSelected = $('#fromSelected');
  const toSelected = $('#toSelected');
  const hiddenFrom = $('input[name="from"]');
  const hiddenTo = $('input[name="to"]');
  const airportModal = $('#airportModal');
  const bsModal = new bootstrap.Modal(airportModal);
  const modalFromInput = $('#modalFromInput');
  const modalToInput = $('#modalToInput');
  const modalFromOptions = $('#modalFromOptions');
  const modalToOptions = $('#modalToOptions');
  const swapBtn = $('#swapAirports');
  const clearFromInput = $('#clearFromInput');
  const clearToInput = $('#clearToInput');

  function toggleClearIcon(input, clearIcon) {
    clearIcon.style.display = input.value ? 'block' : 'none';
  }
  modalFromInput.addEventListener('input', () => toggleClearIcon(modalFromInput, clearFromInput));
  modalToInput.addEventListener('input', () => toggleClearIcon(modalToInput, clearToInput));
  modalFromInput.addEventListener('focus', () => toggleClearIcon(modalFromInput, clearFromInput));
  modalToInput.addEventListener('focus', () => toggleClearIcon(modalToInput, clearToInput));
  modalFromInput.addEventListener('blur', () => setTimeout(() => toggleClearIcon(modalFromInput, clearFromInput), 150));
  modalToInput.addEventListener('blur', () => setTimeout(() => toggleClearIcon(modalToInput, clearToInput), 150));

  clearFromInput.addEventListener('click', () => {
    modalFromInput.value = '';
    selectedFrom = null;
    modalFromOptions.innerHTML = '';
    toggleClearIcon(modalFromInput, clearFromInput);
    renderOptions(modalFromInput, modalFromOptions, '');
  });
  clearToInput.addEventListener('click', () => {
    modalToInput.value = '';
    selectedTo = null;
    modalToOptions.innerHTML = '';
    toggleClearIcon(modalToInput, clearToInput);
    renderOptions(modalToInput, modalToOptions, '');
  });

  [fromSelected, toSelected].forEach(el => {
    el.addEventListener('click', () => {
      modalFromInput.value = selectedFrom ? `${selectedFrom.code} — ${selectedFrom.name}, ${selectedFrom.state}, ${selectedFrom.country}` : '';
      modalToInput.value = selectedTo ? `${selectedTo.code} — ${selectedTo.name}, ${selectedTo.state}, ${selectedTo.country}` : '';
      bsModal.show();
    });
  });

  swapBtn.addEventListener('click', () => {
    const tempValue = modalFromInput.value;
    modalFromInput.value = modalToInput.value;
    modalToInput.value = tempValue;

    const tempSelected = selectedFrom;
    selectedFrom = selectedTo;
    selectedTo = tempSelected;
  });

  function renderOptions(input, optionsDiv, filter) {
    optionsDiv.innerHTML = '';
    const val = (filter || '').toLowerCase();
    let matches = AIRPORTS.filter(a =>
      a.name.toLowerCase().includes(val) ||
      a.code.toLowerCase().includes(val) ||
      a.state.toLowerCase().includes(val) ||
      a.country.toLowerCase().includes(val)
    );

    if (val === '') matches = AIRPORTS;
    if (!matches.length) { optionsDiv.innerHTML = '<div class="airport-option text-muted">No results</div>'; return; }

    matches.forEach(a => {
      const opt = document.createElement('div');
      opt.className = 'airport-option';
      opt.innerHTML = `<div class="airport-name">${a.code} — ${a.name}</div><div class="airport-state">${a.state}, ${a.country}</div>`;
      opt.addEventListener('click', () => {
        input.value = `${a.code} — ${a.name}, ${a.state}, ${a.country}`;
        if (input === modalFromInput) selectedFrom = a; else selectedTo = a;
        optionsDiv.innerHTML = '';
      });
      optionsDiv.appendChild(opt);
    });
  }

  [ { input: modalFromInput, options: modalFromOptions }, { input: modalToInput, options: modalToOptions } ].forEach(({ input, options }) => {
    input.addEventListener('input', () => renderOptions(input, options, input.value.trim()));
    input.addEventListener('focus', () => renderOptions(input, options, input.value.trim()));
  });

  function hideAllSuggestions() { modalFromOptions.innerHTML = ''; modalToOptions.innerHTML = ''; }
  airportModal.addEventListener('hidden.bs.modal', hideAllSuggestions);
  airportModal.addEventListener('hidden.bs.modal', () => {
    if (selectedFrom) {
      fromSelected.querySelector('.airport-abbr').textContent = selectedFrom.code;
      fromSelected.querySelector('.airport-state').textContent = `${selectedFrom.state}, ${selectedFrom.country}`;
      hiddenFrom.value = `${selectedFrom.code} — ${selectedFrom.name}`;
      fromSelected.querySelector('.airport-placeholder').style.display = 'none';
    } else {
      fromSelected.querySelector('.airport-abbr').textContent = '';
      fromSelected.querySelector('.airport-state').textContent = '';
      fromSelected.querySelector('.airport-placeholder').style.display = 'block';
    }

    if (selectedTo) {
      toSelected.querySelector('.airport-abbr').textContent = selectedTo.code;
      toSelected.querySelector('.airport-state').textContent = `${selectedTo.state}, ${selectedTo.country}`;
      hiddenTo.value = `${selectedTo.code} — ${selectedTo.name}`;
      toSelected.querySelector('.airport-placeholder').style.display = 'none';
    } else {
      toSelected.querySelector('.airport-abbr').textContent = '';
      toSelected.querySelector('.airport-state').textContent = '';
      toSelected.querySelector('.airport-placeholder').style.display = 'block';
    }
  });
}

// -----------------------------
// Trip toggle + passenger modal
// -----------------------------
function setupTripTypeToggle() {
  const oneWay = document.getElementById('oneWay'); const roundTrip = document.getElementById('roundTrip'); const returnField = document.getElementById('returnField');
  function updateReturnField() { if (roundTrip.checked) { returnField.style.display = ''; returnField.querySelector('input[name="return"]').required = true; } else { returnField.style.display = 'none'; returnField.querySelector('input[name="return"]').required = false; returnField.querySelector('input[name="return"]').value = ''; } }
  if (oneWay && roundTrip) { oneWay.addEventListener('change', updateReturnField); roundTrip.addEventListener('change', updateReturnField); }
  try { updateReturnField(); } catch (e) {}
}

function setupPassengerModal() {
  const openBtn = document.getElementById('openPassengerModal'); if (!openBtn) return;
  const modalEl = document.getElementById('passengerModal'); const applyBtn = document.getElementById('applyPassengerSelection'); const summary = document.getElementById('passengerSummary');
  const inputAdult = document.querySelector('input[name="adult"]'); const inputChildren = document.querySelector('input[name="children"]'); const inputInfant = document.querySelector('input[name="infant"]');
  const bsModal = new bootstrap.Modal(modalEl);
  const adultMinus = document.getElementById('adultMinus'); const adultPlus = document.getElementById('adultPlus'); const adultCount = document.getElementById('adultCount');
  const childrenMinus = document.getElementById('childrenMinus'); const childrenPlus = document.getElementById('childrenPlus'); const childrenCount = document.getElementById('childrenCount');
  const infantMinus = document.getElementById('infantMinus'); const infantPlus = document.getElementById('infantPlus'); const infantCount = document.getElementById('infantCount');
  const ADULT_MIN = 1, ADULT_MAX = 9, CHILD_MIN = 0, CHILD_MAX = 5, INFANT_MIN = 0, INFANT_MAX = 1;
  function updateSummary() { const a = adultCount.textContent; const c = childrenCount.textContent; const i = infantCount.textContent; let txt = `${a} Adult`; if (c > 0) txt += `, ${c} Children`; if (i > 0) txt += `, ${i} Infant`; summary.textContent = txt; }
  function setModalCountsFromInputs() { inputAdult && (adultCount.textContent = inputAdult.value); inputChildren && (childrenCount.textContent = inputChildren.value); inputInfant && (infantCount.textContent = inputInfant.value); updateSummary(); }
  openBtn.addEventListener('click', () => { setModalCountsFromInputs(); bsModal.show(); });
  function stepperHandler(min, max, countEl, delta) { let val = parseInt(countEl.textContent, 10) + delta; if (val < min) val = min; if (val > max) val = max; countEl.textContent = val; updateSummary(); }
  adultMinus && adultMinus.addEventListener('click', () => stepperHandler(ADULT_MIN, ADULT_MAX, adultCount, -1)); adultPlus && adultPlus.addEventListener('click', () => stepperHandler(ADULT_MIN, ADULT_MAX, adultCount, 1));
  childrenMinus && childrenMinus.addEventListener('click', () => stepperHandler(CHILD_MIN, CHILD_MAX, childrenCount, -1)); childrenPlus && childrenPlus.addEventListener('click', () => stepperHandler(CHILD_MIN, CHILD_MAX, childrenCount, 1));
  infantMinus && infantMinus.addEventListener('click', () => stepperHandler(INFANT_MIN, INFANT_MAX, infantCount, -1)); infantPlus && infantPlus.addEventListener('click', () => stepperHandler(INFANT_MIN, INFANT_MAX, infantCount, 1));
  applyBtn && applyBtn.addEventListener('click', () => { inputAdult && (inputAdult.value = adultCount.textContent); inputChildren && (inputChildren.value = childrenCount.textContent); inputInfant && (inputInfant.value = infantCount.textContent); updateSummary(); });
  setModalCountsFromInputs();
}

// -----------------------------
// Rendering helpers and result UI
// -----------------------------
const API_BASE = '/search';

function ensureResultsStyles() {
  if (document.getElementById('flight-results-styles')) return;
  const s = document.createElement('style'); s.id = 'flight-results-styles'; s.textContent = `
    #results { margin-top: 1rem; }
    .flight-card { border-radius: 12px; overflow: hidden; }
    .flight-card .logo { width:64px; height:64px; object-fit:contain; border-radius:10px; }
    .flight-price { font-size:1.25rem; font-weight:700; }
    .flight-meta { font-size:0.9rem; color: #6c757d; }
    .details-table td, .details-table th { vertical-align: middle; }
    @media (max-width:576px) {
      .flight-card .logo { width:56px; height:56px; }
      .flight-price { font-size:1.05rem; }
    }
  `; document.head.appendChild(s);
}

function renderError(container, message) { container.innerHTML = `<div class="alert alert-warning" role="alert">${message}</div>`; }
function renderEmpty(container) { container.innerHTML = `<div class="text-muted py-3">No flights found for that route/date.</div>`; }
function formatCurrency(amount) { const n = Number(amount); if (isNaN(n)) return amount; return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// Logo helpers (r9cdn -> pics.avs -> ui-avatars)
function logoR9(iata) { if (!iata) return ''; return `https://content.r9cdn.net/rimg/provider-logos/airlines/v/${iata}.png?width=200&height=200`; }
function logoPics(iata) { if (!iata) return ''; return `https://pics.avs.io/200/200/${iata}.png`; }
function logoAvatar(code) { const initials = encodeURIComponent(code || 'A'); return `https://ui-avatars.com/api/?name=${initials}&size=128&background=0D6EFD&color=fff&font-size=0.5&rounded=true`; }

// small unique id helper
function uid(prefix = 'f') { return prefix + '-' + Math.random().toString(36).slice(2, 9); }

// Render passenger breakdown TABLE (FORMAT 1 -> T)
function renderPassengerTable(passengers) {
  const adults = (passengers && passengers.adults) ? passengers.adults : { count: 1, fare: null };
  const children = (passengers && passengers.children) ? passengers.children : { count: 0, fare: null };
  const infants = (passengers && passengers.infants) ? passengers.infants : (passengers && passengers.infant ? passengers.infant : { count: 0, fare: null });

  // Normalize keys (some responses use infant vs infants)
  const infantObj = infants.count !== undefined ? infants : (passengers && passengers.infant ? passengers.infant : { count: 0, fare: null });

  return `
    <table class="table table-sm details-table">
      <thead>
        <tr><th>Type</th><th class="text-end">Count</th><th class="text-end">Fare</th></tr>
      </thead>
      <tbody>
        <tr><td>Adult</td><td class="text-end">${adults.count || 0}</td><td class="text-end">${adults.fare != null ? formatCurrency(adults.fare) : '-'}</td></tr>
        <tr><td>Children</td><td class="text-end">${children.count || 0}</td><td class="text-end">${children.fare != null ? formatCurrency(children.fare) : '-'}</td></tr>
        <tr><td>Infant</td><td class="text-end">${infantObj.count || 0}</td><td class="text-end">${infantObj.fare != null ? formatCurrency(infantObj.fare) : '-'}</td></tr>
      </tbody>
    </table>
  `;
}

// Render details panel from FORMAT 1
function renderDetailsPanel(f) {
  const baggage = f.baggage || 'No baggage info';
  const refund = f.refund || 'No refund info';
  const change = f.change || 'No change policy info';
  const checkin = f.checkin || 'Check-in info not available';
  const passengers = f.passengers || f.passenger_info || f.passengers_info || null;

  // passenger_info in some responses might be {adults:1,children:0,infant:0} without fares — we still show counts
  // normalize simple counts -> format expected by passenger table
  let normalizedPassengers = null;
  if (passengers) {
    if (passengers.adults || passengers.children || passengers.infants || passengers.infant) {
      normalizedPassengers = {
        adults: passengers.adults ? (typeof passengers.adults === 'object' ? passengers.adults : { count: passengers.adults, fare: passengers.adultFare || null }) : { count: 1, fare: null },
        children: passengers.children ? (typeof passengers.children === 'object' ? passengers.children : { count: passengers.children, fare: passengers.childFare || null }) : { count: 0, fare: null },
        infants: passengers.infants ? (typeof passengers.infants === 'object' ? passengers.infants : { count: passengers.infants, fare: passengers.infantFare || null }) : (passengers.infant ? (typeof passengers.infant === 'object' ? passengers.infant : { count: passengers.infant, fare: null }) : { count: 0, fare: null })
      };
    } else {
      // maybe already in desired shape
      normalizedPassengers = passengers;
    }
  }

  return `
    <div class="row">
      <div class="col-md-6 mb-3">
        <h6 class="mb-1">Fare & Policies</h6>
        <div class="small text-muted mb-1"><strong>Refund:</strong> ${refund}</div>
        <div class="small text-muted mb-1"><strong>Change:</strong> ${change}</div>
        <div class="small text-muted"><strong>Check-in:</strong> ${checkin}</div>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="mb-1">Baggage</h6>
        <div class="small text-muted">${typeof baggage === 'string' ? baggage : JSON.stringify(baggage)}</div>
      </div>

      <div class="col-12">
        <h6 class="mb-2">Passenger Breakdown</h6>
        ${renderPassengerTable(normalizedPassengers || { adults: { count: 1, fare: null }, children: { count: 0, fare: null }, infants: { count: 0, fare: null } })}
      </div>
    </div>
  `;
}

// Create the flight card (summary + collapsed details)
function createFlightCard(flight) {
  const code = flight.airline_iata || flight.airline || '';
  const name = flight.airline_full_name || flight.airline || code || 'Airline';
  const iata = (typeof code === 'string' && code.length <= 3) ? code : (flight.airline_iata || '');
  const r9 = logoR9(iata);
  const pics = logoPics(iata);
  const avatar = logoAvatar(code || name);
  const price = (flight.price != null) ? formatCurrency(flight.price) : 'N/A';
  const currency = flight.currency || 'USD';
  const depart = flight.depart_time ? new Date(flight.depart_time).toLocaleString() : (flight.depart_time || '');
  const arrive = flight.arrive_time ? new Date(flight.arrive_time).toLocaleString() : (flight.arrive_time || '');
  const from = flight.from || (flight.segments && flight.segments[0] && flight.segments[0].departure && (flight.segments[0].departure.iataCode || flight.segments[0].departure.iata)) || '';
  const to = flight.to || (flight.segments && flight.segments.slice(-1)[0] && flight.segments.slice(-1)[0].arrival && (flight.segments.slice(-1)[0].arrival.iataCode || flight.segments.slice(-1)[0].arrival.iata)) || '';
  const stops = (flight.stops !== undefined) ? flight.stops : (flight.segments ? Math.max(0, flight.segments.length - 1) : 0);
  const duration = flight.duration || '';
  const detailsId = uid('details');

  const card = document.createElement('div');
  card.className = 'card flight-card mb-3 shadow-sm';

  card.innerHTML = `
    <div class="card-body">
      <div class="d-flex gap-3 align-items-start">
        <img src="${r9}" data-fallback="${pics}" data-avatar="${avatar}" alt="${name}" class="logo" loading="lazy">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-semibold">${name} ${code ? `<span class="text-muted small">(${code})</span>` : ''}</div>
              <div class="flight-meta">${from} → ${to}</div>
              <div class="flight-meta">Departs: ${depart}</div>
              <div class="flight-meta">Arrives: ${arrive}</div>
              <div class="flight-meta">Stops: ${stops} • Duration: ${duration}</div>
            </div>
            <div class="text-end">
              <div class="flight-price">${currency} ${price}</div>
              <div class="flight-meta">Total fare</div>
            </div>
          </div>

          <div class="mt-3 d-flex gap-2">
            <a class="btn btn-primary btn-sm ms-auto" href="${flight.link || '#'}" target="_blank" rel="noopener">Book</a>
            <button class="btn btn-outline-secondary btn-sm save-flight">Save</button>
            <button class="btn btn-outline-secondary btn-sm details-toggle" data-target="#${detailsId}">View Details</button>
          </div>

          <div class="collapse mt-3" id="${detailsId}">
            <div class="card card-body small">
              ${renderDetailsPanel(flight)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Logo fallback chain
  const img = card.querySelector('img');
  img.addEventListener('error', function () {
    try {
      if (this.src && this.src.includes('rimg')) {
        this.src = this.getAttribute('data-fallback') || this.getAttribute('data-avatar');
        return;
      }
      if (this.src && this.src.includes('avs.io')) {
        this.src = this.getAttribute('data-avatar');
        return;
      }
    } catch (e) { /* ignore */ }
    this.src = this.getAttribute('data-avatar');
  });

  // Save button
  card.querySelector('.save-flight')?.addEventListener('click', () => {
    try {
      const data = {
        airline: name,
        code,
        price,
        currency,
        from,
        to,
        depart_time: depart,
        arrive_time: arrive,
        stops,
        duration,
        fetchedAt: new Date().toISOString()
      };
      saveBooking('Flight', data);
      zaAlert('Flight saved to bookings', 'success');
    } catch (err) { console.error(err); zaAlert('Could not save booking', 'error'); }
  });

  // Details toggle uses bootstrap collapse
  const toggleBtn = card.querySelector('.details-toggle');
  toggleBtn?.addEventListener('click', () => {
    const el = card.querySelector(toggleBtn.getAttribute('data-target'));
    if (!el) return;
    const bs = new bootstrap.Collapse(el, { toggle: false });
    bs.toggle();
  });

  // Example addition for displaying return info:
  if (flight.return_depart_time && flight.return_arrive_time) {
    card.querySelector('.flight-meta').insertAdjacentHTML('afterend', `
      <div class="flight-meta text-primary">Return: Departs ${new Date(flight.return_depart_time).toLocaleString()} — Arrives ${new Date(flight.return_arrive_time).toLocaleString()}</div>
    `);
  }

  return card;
}

// -----------------------------
// Search & render flow
// -----------------------------
async function searchFlightsAndRender(opts) {
  const modal = document.getElementById('flightResultsModal');
  const resultsContainer = document.getElementById('flightResultsBody');
  if (!modal || !resultsContainer) return;
  ensureResultsStyles();

  resultsContainer.innerHTML = '';
  
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  // Show spinner
  window.zaShowLoader && window.zaShowLoader(resultsContainer, 'Searching flights...');

  const params = new URLSearchParams();
  params.set('from', opts.from);
  params.set('to', opts.to);
  params.set('date', opts.date);
  if (opts.returnDate) params.set('returnDate', opts.returnDate);
  if (opts.adults) params.set('adults', opts.adults);
  if (opts.children) params.set('children', opts.children);
  if (opts.infant) params.set('infant', opts.infant);
  if (opts.cabin) params.set('class', opts.cabin);
  if (opts.currency) params.set('currency', opts.currency);

  const url = `${API_BASE}?${params.toString()}`;

  try {
    const resp = await fetch(url, { method: 'GET' });
    
    // Hide spinner
    window.zaHideLoader && window.zaHideLoader();

    if (!resp.ok) {
      const text = await resp.text().catch(() => null);
      renderError(resultsContainer, `Server error: ${resp.status} ${resp.statusText}${text ? ' — ' + text : ''}`);
      zaAlert('Failed to fetch flights', 'error');
      return;
    }
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      if (data && data.error) renderError(resultsContainer, JSON.stringify(data));
      else renderEmpty(resultsContainer);
      zaAlert('No flights found', 'error');
      return;
    }

    resultsContainer.innerHTML = '';
    data.forEach(f => {
      if (!f.airline_full_name && f.airline && f.airline.length > 2 && f.airline.indexOf(' ') > -1) f.airline_full_name = f.airline;
      const card = createFlightCard(f);
      resultsContainer.appendChild(card);
    });
    zaAlert('Flights loaded', 'success');
  } catch (err) {
    // Hide spinner on error
    window.zaHideLoader && window.zaHideLoader();
    console.error(err);
    renderError(resultsContainer, 'Network error or server not reachable');
    zaAlert('Network error', 'error');
  }
}

// -----------------------------
// Init on DOMContentLoaded
// -----------------------------
document.addEventListener('DOMContentLoaded', function () {
  attachGridActions(); attachMiniActions(); attachForms(); layoutForWidth(); renderBookings(); attachCategoryToggle(); setupAirportSelection(); setupTripTypeToggle(); setupPassengerModal();

  // passenger modal stepper (keeps the stepper UX)
  (function setupPassengerModalV2() {
    const openBtn = document.getElementById('openPassengerModal');
    if (!openBtn) return;
    const modalEl = document.getElementById('passengerModal');
    const applyBtn = document.getElementById('applyPassengerSelection');
    const summary = document.getElementById('passengerSummary');
    const inputAdult = document.querySelector('input[name="adult"]');
    const inputChildren = document.querySelector('input[name="children"]');
    const inputInfant = document.querySelector('input[name="infant"]');
    const bsModal = new bootstrap.Modal(modalEl);

    const adultMinus = document.getElementById('adultMinus');
    const adultPlus = document.getElementById('adultPlus');
    const adultCount = document.getElementById('adultCount');
    const childrenMinus = document.getElementById('childrenMinus');
    const childrenPlus = document.getElementById('childrenPlus');
    const childrenCount = document.getElementById('childrenCount');
    const infantMinus = document.getElementById('infantMinus');
    const infantPlus = document.getElementById('infantPlus');
    const infantCount = document.getElementById('infantCount');

    const ADULT_MIN = 1, ADULT_MAX = 9;
    const CHILD_MIN = 0, CHILD_MAX = 5;
    const INFANT_MIN = 0, INFANT_MAX = 1;

    function updateSummary() {
      const a = adultCount.textContent;
      const c = childrenCount.textContent;
      const i = infantCount.textContent;
      let txt = `${a} Adult`;
      if (c > 0) txt += `, ${c} Children`;
      if (i > 0) txt += `, ${i} Infant`;
      summary.textContent = txt;
    }

    function setModalCountsFromInputs() {
      inputAdult && (adultCount.textContent = inputAdult.value);
      inputChildren && (childrenCount.textContent = inputChildren.value);
      inputInfant && (infantCount.textContent = inputInfant.value);
      updateSummary();
    }

    openBtn.addEventListener('click', () => {
      setModalCountsFromInputs();
      bsModal.show();
    });

    function stepperHandler(min, max, countEl, delta) {
      let val = parseInt(countEl.textContent, 10) + delta;
      if (val < min) val = min;
      if (val > max) val = max;
      countEl.textContent = val;
      updateSummary();
    }

    adultMinus && adultMinus.addEventListener('click', () => stepperHandler(ADULT_MIN, ADULT_MAX, adultCount, -1));
    adultPlus && adultPlus.addEventListener('click', () => stepperHandler(ADULT_MIN, ADULT_MAX, adultCount, 1));
    childrenMinus && childrenMinus.addEventListener('click', () => stepperHandler(CHILD_MIN, CHILD_MAX, childrenCount, -1));
    childrenPlus && childrenPlus.addEventListener('click', () => stepperHandler(CHILD_MIN, CHILD_MAX, childrenCount, 1));
    infantMinus && infantMinus.addEventListener('click', () => stepperHandler(INFANT_MIN, INFANT_MAX, infantCount, -1));
    infantPlus && infantPlus.addEventListener('click', () => stepperHandler(INFANT_MIN, INFANT_MAX, infantCount, 1));

    applyBtn && applyBtn.addEventListener('click', () => {
      inputAdult && (inputAdult.value = adultCount.textContent);
      inputChildren && (inputChildren.value = childrenCount.textContent);
      inputInfant && (inputInfant.value = infantCount.textContent);
      updateSummary();
    });

    setModalCountsFromInputs();
  })();

  // respond to resize (debounced)
  let rtid = null;
  window.addEventListener('resize', () => {
    if (rtid) clearTimeout(rtid);
    rtid = setTimeout(() => { layoutForWidth(); }, 140);
  });

  function hideMiniPaymentsOnMobileIfViewAllActive() {
    const mini = document.getElementById('miniPayments');
    const gridWrapper = document.getElementById('gridWrapper');
    if (!mini || !gridWrapper) return;
    const isMobile = window.innerWidth <= 575;
    const isViewAllActive = gridWrapper.classList.contains('grid-shown');
    if (isMobile && isViewAllActive) {
      mini.style.display = 'none';
    } else if (isMobile && !isViewAllActive) {
      mini.style.display = 'flex';
    }
  }

  // Example usage: call this function after toggling "View All"
  document.getElementById('miniViewAll')?.addEventListener('click', function () {
    setTimeout(hideMiniPaymentsOnMobileIfViewAllActive, 300);
  });
});