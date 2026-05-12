// FAQ toggle
  function toggleFaq(el) {
    const item = el.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  }

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Stat counter animation
  function animateCounters() {
    const nums = [
      { el: document.querySelector('.stat-item:nth-child(1) .stat-number'), prefix: '₹', suffix: ' Cr+', end: 500 },
      { el: document.querySelector('.stat-item:nth-child(2) .stat-number'), prefix: '', suffix: '+', end: 10000 },
      { el: document.querySelector('.stat-item:nth-child(3) .stat-number'), prefix: '', suffix: '+', end: 15 },
    ];

    nums.forEach(({ el, prefix, suffix, end }) => {
      if (!el) return;
      let start = 0;
      const duration = 1800;
      const step = 16;
      const increment = end / (duration / step);
      const timer = setInterval(() => {
        start = Math.min(start + increment, end);
        const val = end >= 1000 ? Math.round(start).toLocaleString('en-IN') : Math.round(start);
        el.textContent = `${prefix}${val}${suffix}`;
        if (start >= end) clearInterval(timer);
      }, step);
    });
  }

  const statsBar = document.querySelector('.stats-bar');
  const statsObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { animateCounters(); statsObs.disconnect(); }
  }, { threshold: 0.5 });
  statsObs.observe(statsBar);

  // Debt calculator live update
  const debtAmtEl = document.getElementById('debtAmt');
  const savingsEl = document.getElementById('savingsVal');

  function updateCalc() {
    const raw = debtAmtEl.value.replace(/[^0-9]/g, '');
    const amt = parseInt(raw) || 500000;
    const savings = Math.round(amt * 0.65);
    const formatted = '₹' + savings.toLocaleString('en-IN');
    savingsEl.textContent = formatted;
  }

  if (debtAmtEl) debtAmtEl.addEventListener('input', updateCalc);

  // Debt tag toggle
  document.querySelectorAll('.debt-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.debt-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
    });
  });

  // Updated hero lead form
  const heroLeadForm = document.getElementById('heroLeadForm');
const heroLeadStatus = document.getElementById('heroLeadStatus');

if (heroLeadForm) {
  heroLeadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!heroLeadForm.checkValidity()) {
      heroLeadStatus.textContent = 'Please complete the required fields.';
      heroLeadForm.reportValidity();
      return;
    }

    const submitButton = heroLeadForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;

    const formData = new URLSearchParams({
      name:      heroLeadForm.querySelector('[name="name"]').value,
      phone:     heroLeadForm.querySelector('[name="phone"]').value,
      email:     heroLeadForm.querySelector('[name="email"]').value,
      issue:     heroLeadForm.querySelector('[name="issue"]').value,
      amount:    heroLeadForm.querySelector('[name="amount"]').value,
      situation: '',
      source:    'Hero Form'
    });

    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwBvSy-duYrDA1xjzG3dX-C6ZB6Gbz_34gsJ3cTFHfuRUDbEa7CcC1ojFfFaNaONTmb8Q/exec';

    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      submitButton.textContent = 'Review Requested ✓';
      heroLeadStatus.textContent = 'Thank you. Our team will contact you shortly.';
      heroLeadForm.reset();
    } catch (err) {
      submitButton.textContent = 'Request My Review';
      submitButton.disabled = false;
      heroLeadStatus.textContent = 'Something went wrong. Please try again.';
    }
  });
}

  // FREED-inspired settlement calculator for DebtMukt
  (function initSettlementCalculator() {
    const rupee = '\u20B9';
    const cardDebt = document.getElementById('cardDebt');
    const personalDebt = document.getElementById('personalDebt');
    const cardDebtInput = document.getElementById('cardDebtInput');
    const personalDebtInput = document.getElementById('personalDebtInput');
    const cardDebtVal = document.getElementById('cardDebtVal');
    const personalDebtVal = document.getElementById('personalDebtVal');
    const totalDebtOut = document.getElementById('totalDebtOut');
    const loanMonthsOut = document.getElementById('loanMonthsOut');
    const withDebtMuktOut = document.getElementById('withDebtMuktOut');
    const withoutShortOut = document.getElementById('withoutShortOut');
    const withShortOut = document.getElementById('withShortOut');
    const savingOut = document.getElementById('savingOut');
    const withBar = document.getElementById('withBar');
    const withoutBar = document.getElementById('withoutBar');
    const payCardLabel = document.getElementById('payCardLabel');
    if (!cardDebt || !personalDebt) return;

    let mode = 'settle';
    let late = 'yes';

    const formatINR = (value) => rupee + Math.round(value).toLocaleString('en-IN');
    const formatShort = (value) => {
      const rounded = Math.max(0, Math.round(value));
      if (rounded >= 10000000) return rupee + (rounded / 10000000).toFixed(2).replace(/\.00$/, '') + 'Cr';
      if (rounded >= 100000) return rupee + (rounded / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
      return formatINR(rounded);
    };
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const snapToStep = (value, step) => Math.round(value / step) * step;

    const fields = [
      { range: cardDebt, input: cardDebtInput, output: cardDebtVal },
      { range: personalDebt, input: personalDebtInput, output: personalDebtVal },
    ];

    function setRangeFill(range) {
      const min = Number(range.min) || 0;
      const max = Number(range.max) || 100;
      const value = Number(range.value) || 0;
      const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
      range.style.setProperty('--fill', clamp(pct, 0, 100) + '%');
      range.setAttribute('aria-valuetext', formatINR(value));
    }

    function setFieldValue(field, rawValue) {
      if (!field || !field.range) return;
      const min = Number(field.range.min) || 0;
      const max = Number(field.range.max) || 0;
      const step = Number(field.range.step) || 1;
      const cleanValue = Number.isFinite(Number(rawValue)) ? Number(rawValue) : min;
      const value = clamp(snapToStep(cleanValue, step), min, max);
      field.range.value = value;
      if (field.input) field.input.value = value;
      setRangeFill(field.range);
    }

    function barHeight(value, chartCeiling) {
      const maxHeight = 210;
      const minHeight = 34;
      return clamp(Math.round((value / chartCeiling) * maxHeight), minHeight, maxHeight);
    }

    function update() {
      fields.forEach((field) => setRangeFill(field.range));

      const card = Number(cardDebt.value) || 0;
      const personal = Number(personalDebt.value) || 0;
      const total = Math.max(card + personal, 50000);
      const isSettle = mode === 'settle';
      const lateFactor = late === 'yes' ? 0.45 : 0.58;
      const settlementPayable = total * (isSettle ? lateFactor : 0.72);
      const withoutSupport = total * (isSettle ? 2.143 : 1.42);
      const saving = Math.max(withoutSupport - settlementPayable, 0);
      const months = isSettle ? (late === 'yes' ? 34 : 28) : 24;

      // Fixed visual ceilings make the chart bars grow/shrink as the entered debt changes.
      // The values still represent the actual calculated estimates above each bar.
      const chartCeiling = isSettle ? 2500000 : 3000000;
      const withHeight = barHeight(settlementPayable, chartCeiling);
      const withoutHeight = barHeight(withoutSupport, chartCeiling);

      if (cardDebtVal) cardDebtVal.textContent = formatINR(card);
      if (personalDebtVal) personalDebtVal.textContent = formatINR(personal);
      if (totalDebtOut) totalDebtOut.textContent = formatINR(total);
      if (loanMonthsOut) loanMonthsOut.textContent = months + ' Months';
      if (withDebtMuktOut) withDebtMuktOut.textContent = formatINR(settlementPayable);
      if (withShortOut) withShortOut.textContent = formatShort(settlementPayable);
      if (withoutShortOut) withoutShortOut.textContent = formatShort(withoutSupport);
      if (savingOut) savingOut.textContent = formatINR(saving);
      if (payCardLabel) payCardLabel.textContent = isSettle ? 'Possible Settlement Payable' : 'Estimated Consolidated Payable';
      if (withBar) withBar.style.height = withHeight + 'px';
      if (withoutBar) withoutBar.style.height = withoutHeight + 'px';
    }

    fields.forEach((field) => {
      if (!field.range) return;
      setFieldValue(field, field.range.value);
      field.range.addEventListener('input', () => {
        if (field.input) field.input.value = field.range.value;
        update();
      });
      field.range.addEventListener('change', update);
      if (field.input) {
        field.input.addEventListener('input', () => {
          if (field.input.value === '') return;
          const min = Number(field.range.min) || 0;
          const max = Number(field.range.max) || 0;
          const value = clamp(Number(field.input.value) || 0, min, max);
          field.range.value = value;
          setRangeFill(field.range);
          update();
        });
        field.input.addEventListener('blur', () => {
          if (field.input.value === '') field.input.value = field.range.min || 0;
          setFieldValue(field, field.input.value);
          update();
        });
      }
    });

    document.querySelectorAll('.calc-mode-tab').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.calc-mode-tab').forEach((b) => b.classList.remove('active'));
        button.classList.add('active');
        mode = button.dataset.mode || 'settle';
        update();
      });
    });

    document.querySelectorAll('.late-option').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.late-option').forEach((b) => b.classList.remove('active'));
        button.classList.add('active');
        late = button.dataset.late || 'yes';
        update();
      });
    });

    update();
  })();

  // Eligibility form submission
  const eligForm = document.getElementById('eligForm');
  const eligStatus = document.getElementById('eligStatus');

  if (eligForm) {
    eligForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const firstName = eligForm.querySelector('[name="firstName"]').value.trim();
      const phone     = eligForm.querySelector('[name="phone"]').value.trim();

      if (!firstName || !phone) {
        eligStatus.style.color = '#c0392b';
        eligStatus.textContent = 'Please fill in your name and phone number.';
        return;
      }

      const submitBtn = eligForm.querySelector('[type="submit"]');
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;
      eligStatus.textContent = '';

      const formData = new URLSearchParams({
        name:      (firstName + ' ' + eligForm.querySelector('[name="lastName"]').value.trim()).trim(),
        phone:     phone,
        email:     '',
        issue:     '',
        amount:    eligForm.querySelector('[name="amount"]').value,
        situation: eligForm.querySelector('[name="situation"]').value,
        source:    'Eligibility Form'
      });

      try {
        await fetch(SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        submitBtn.textContent = 'Eligibility Checked ✓';
        eligStatus.style.color = 'var(--green-dark, #1a7a4a)';
        eligStatus.textContent = 'Thank you! Our team will reach out to you shortly.';
        eligForm.reset();
      } catch (err) {
        submitBtn.textContent = 'Check My Eligibility →';
        submitBtn.disabled = false;
        eligStatus.style.color = '#c0392b';
        eligStatus.textContent = 'Something went wrong. Please try again.';
      }
    });
  }

  document.querySelectorAll('[data-scroll-consult]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById('heroLeadForm');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', href);
    });
  });


  // Fallback: force all .reveal elements visible after 800ms
  // in case IntersectionObserver doesn't fire (e.g. file:// quirks)
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      el.classList.add('visible');
    });
  }, 800);
