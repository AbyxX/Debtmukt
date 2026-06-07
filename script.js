const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwBvSy-duYrDA1xjzG3dX-C6ZB6Gbz_34gsJ3cTFHfuRUDbEa7CcC1ojFfFaNaONTmb8Q/exec';

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
      { el: document.querySelector('.stat-item:nth-child(1) .stat-number'), prefix: '\u20b9', suffix: ' Cr+', end: 12 },
      { el: document.querySelector('.stat-item:nth-child(2) .stat-number'), prefix: '', suffix: '+', end: 850 },
      { el: document.querySelector('.stat-item:nth-child(3) .stat-number'), prefix: '', suffix: '+', end: 5 },
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
    const formatted = '\u20b9' + savings.toLocaleString('en-IN');
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


    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      submitButton.textContent = 'Review Requested \u2713';
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

        submitBtn.textContent = 'Eligibility Checked \u2713';
        eligStatus.style.color = 'var(--green-dark, #1a7a4a)';
        eligStatus.textContent = 'Thank you! Our team will reach out to you shortly.';
        eligForm.reset();
      } catch (err) {
        submitBtn.textContent = 'Check My Eligibility \u2192';
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

// \u2500\u2500 HINDI TRANSLATION TOGGLE \u2500\u2500
const translations = {
  en: {
    // Nav
    'nav-process': 'How It Works',
    'nav-calc': 'Calculator',
    'nav-debt': 'Debt Types',
    'nav-stories': 'Success Stories',
    'nav-faqs': 'FAQs',
    'nav-cta': 'Free Consultation',
    'lang-btn': '\u0939\u093f\u0902\u0926\u0940',

    // Hero
    '.hero-badge': "India's #1 Debt Settlement Platform",
    '.hero-headline': 'Drowning<br>in debt?<br>We\'ll help you<br><span class="breathe">Breathe Again.</span>',
    '.hero-sub': 'Our certified legal experts negotiate directly with banks and NBFCs on your behalf \u2014 so you can stop the harassment, cut your debt by up to 80%, and rebuild your life.',
    '.trust-text': '<strong>850+ clients helped</strong>Across credit cards, personal loans & business debt',
    '.hero-bullets': '<li>Reduce debt by 40\u201380%</li><li>Stop creditor harassment calls</li><li>Transparent fees \u2014 know exactly what you pay</li><li>Complete legal process within 12 months</li>',

    // Hero form
    '.calc-title': 'Free Consultation',
    '.calc-headline': 'Check what you can do today',
    '.hero-form-intro': 'Share a few basics. Our team will help you understand the next safe step for loan resolution or recovery harassment support.',

    // Stats
    '.stat-item:nth-child(1) .stat-label': 'Total Debt Settled',
    '.stat-item:nth-child(2) .stat-label': 'Happy Clients',
    '.stat-item:nth-child(3) .stat-label': 'Years Experience',
    '.stat-item:nth-child(4) .stat-label': 'Google Rating',

    // Roadmap
    '.roadmap .section-label': 'The Process',
    '.roadmap .section-headline': 'Your Roadmap to Debt Freedom',
    '.roadmap .section-sub': 'A calmer, more structured route from collection pressure to a documented resolution plan.',

    // Harassment
    '.harassment-section .section-label': 'Recovery Harassment Support',
    '.harassment-section .section-headline': 'Stop dealing with threatening calls alone.',
    '.harassment-section .section-sub': 'Our team helps you record facts, respond through proper channels and reduce direct pressure by moving lender conversations into a documented process.',

    // Trust
    '.trust .section-label': 'Why Indians Trust Us',
    '.trust .section-headline': 'We Fight for You',
    '.trust .section-sub': 'From RBI compliance to full legal protection \u2014 every part of our service is designed around your safety and financial recovery.',

    // Debt types
    '.debt-types .section-label': 'Debt Types We Handle',
    '.debt-types .section-headline': 'Support for unsecured loan stress',
    '.debt-types .section-sub': 'Clean, case-by-case support for borrowers dealing with repayment pressure, recovery calls, overdue accounts or settlement discussions.',

    // Testimonials
    '.testimonials .section-label': 'Real Stories',
    '.testimonials .section-headline': 'Real Results, Real People',

    // Eligibility
    '.eligibility .section-label': 'Are You Eligible?',
    '.eligibility .section-headline': 'Quick Eligibility<br>Check',
    '.eligibility .section-sub': 'Most people who qualify share these three traits. If you tick any of these boxes, we can likely help you \u2014 significantly.',
    '.elig-form-title': 'Start Your Free<br>Debt Analysis',
    '.elig-form-sub': 'Takes 2 minutes. No commitment required.',

    // FAQ
    '.faq .section-label': 'Got Questions?',
    '.faq .section-headline': 'Frequently Asked<br>Questions',
    '.faq .section-sub': 'Everything you need to know before taking the first step toward financial freedom.',

    // CTA Banner
    '.cta-banner .section-label': 'Take the First Step',
    '.cta-banner-headline': 'Your Financial Freedom<br>Starts Today',
    '.cta-banner-sub': "Don't wait for things to get worse. Get a free analysis today that can save you lakhs and years of stress.",
  },

  hi: {
    // Nav
    'nav-process': '\u092f\u0939 \u0915\u0948\u0938\u0947 \u0915\u093e\u092e \u0915\u0930\u0924\u093e \u0939\u0948',
    'nav-calc': '\u0915\u0948\u0932\u0915\u0941\u0932\u0947\u091f\u0930',
    'nav-debt': '\u0915\u0930\u094d\u091c \u0915\u0947 \u092a\u094d\u0930\u0915\u093e\u0930',
    'nav-stories': '\u0938\u092b\u0932\u0924\u093e \u0915\u0940 \u0915\u0939\u093e\u0928\u093f\u092f\u093e\u0901',
    'nav-faqs': '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u092a\u094d\u0930\u0936\u094d\u0928',
    'nav-cta': '\u092e\u0941\u092b\u094d\u0924 \u092a\u0930\u093e\u092e\u0930\u094d\u0936',
    'lang-btn': 'English',

    // Hero
    '.hero-badge': '\u092d\u093e\u0930\u0924 \u0915\u093e \u0928\u0902\u092c\u0930 1 \u0915\u0930\u094d\u091c \u0928\u093f\u092a\u091f\u093e\u0928 \u092e\u0902\u091a',
    '.hero-headline': '\u0915\u0930\u094d\u091c \u092e\u0947\u0902<br>\u0921\u0942\u092c\u0947 \u0939\u0948\u0902?<br>\u0939\u092e \u0906\u092a\u0915\u094b<br><span class="breathe">\u0930\u093e\u0939\u0924 \u0926\u093f\u0932\u093e\u090f\u0902\u0917\u0947\u0964</span>',
    '.hero-sub': '\u0939\u092e\u093e\u0930\u0947 \u092a\u094d\u0930\u092e\u093e\u0923\u093f\u0924 \u0915\u093e\u0928\u0942\u0928\u0940 \u0935\u093f\u0936\u0947\u0937\u091c\u094d\u091e \u0938\u0940\u0927\u0947 \u092c\u0948\u0902\u0915\u094b\u0902 \u0914\u0930 \u090f\u0928\u092c\u0940\u090f\u092b\u0938\u0940 \u0938\u0947 \u0906\u092a\u0915\u0940 \u0913\u0930 \u0938\u0947 \u092c\u093e\u0924 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902 \u2014 \u0924\u093e\u0915\u093f \u0906\u092a \u0909\u0924\u094d\u092a\u0940\u0921\u093c\u0928 \u092c\u0902\u0926 \u0915\u0930 \u0938\u0915\u0947\u0902, \u0905\u092a\u0928\u093e \u0915\u0930\u094d\u091c 80% \u0924\u0915 \u0915\u092e \u0915\u0930 \u0938\u0915\u0947\u0902 \u0914\u0930 \u0905\u092a\u0928\u0940 \u091c\u093f\u0902\u0926\u0917\u0940 \u092b\u093f\u0930 \u0938\u0947 \u092c\u0928\u093e \u0938\u0915\u0947\u0902\u0964',
    '.trust-text': '<strong>850+ \u0917\u094d\u0930\u093e\u0939\u0915\u094b\u0902 \u0915\u0940 \u092e\u0926\u0926</strong>\u0915\u094d\u0930\u0947\u0921\u093f\u091f \u0915\u093e\u0930\u094d\u0921, \u092a\u0930\u094d\u0938\u0928\u0932 \u0932\u094b\u0928 \u0914\u0930 \u092c\u093f\u091c\u0928\u0947\u0938 \u0932\u094b\u0928 \u092e\u0947\u0902',
    '.hero-bullets': '<li>\u0915\u0930\u094d\u091c 40\u201380% \u0924\u0915 \u0915\u092e \u0915\u0930\u0947\u0902</li><li>\u0935\u0938\u0942\u0932\u0940 \u090f\u091c\u0947\u0902\u091f \u0915\u0940 \u0915\u0949\u0932 \u092c\u0902\u0926 \u0915\u0930\u0947\u0902</li><li>\u092a\u093e\u0930\u0926\u0930\u094d\u0936\u0940 \u0936\u0941\u0932\u094d\u0915 \u2014 \u091c\u093e\u0928\u0947\u0902 \u0915\u093f \u0906\u092a \u0915\u094d\u092f\u093e \u092d\u0941\u0917\u0924\u093e\u0928 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902</li><li>12 \u092e\u0939\u0940\u0928\u0947 \u092e\u0947\u0902 \u092a\u0942\u0930\u0940 \u0915\u093e\u0928\u0942\u0928\u0940 \u092a\u094d\u0930\u0915\u094d\u0930\u093f\u092f\u093e</li>',

    // Hero form
    '.calc-title': '\u092e\u0941\u092b\u094d\u0924 \u092a\u0930\u093e\u092e\u0930\u094d\u0936',
    '.calc-headline': '\u0906\u091c \u091c\u093e\u0928\u0947\u0902 \u0906\u092a \u0915\u094d\u092f\u093e \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902',
    '.hero-form-intro': '\u0915\u0941\u091b \u092c\u0941\u0928\u093f\u092f\u093e\u0926\u0940 \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u0938\u093e\u091d\u093e \u0915\u0930\u0947\u0902\u0964 \u0939\u092e\u093e\u0930\u0940 \u091f\u0940\u092e \u0906\u092a\u0915\u094b \u0932\u094b\u0928 \u0938\u092e\u093e\u0927\u093e\u0928 \u092f\u093e \u0935\u0938\u0942\u0932\u0940 \u0909\u0924\u094d\u092a\u0940\u0921\u093c\u0928 \u0915\u0947 \u0932\u093f\u090f \u0905\u0917\u0932\u093e \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0915\u0926\u092e \u0938\u092e\u091d\u0928\u0947 \u092e\u0947\u0902 \u092e\u0926\u0926 \u0915\u0930\u0947\u0917\u0940\u0964',

    // Stats
    '.stat-item:nth-child(1) .stat-label': '\u0915\u0941\u0932 \u0915\u0930\u094d\u091c \u0928\u093f\u092a\u091f\u093e\u0928',
    '.stat-item:nth-child(2) .stat-label': '\u0916\u0941\u0936 \u0917\u094d\u0930\u093e\u0939\u0915',
    '.stat-item:nth-child(3) .stat-label': '\u0935\u0930\u094d\u0937\u094b\u0902 \u0915\u093e \u0905\u0928\u0941\u092d\u0935',
    '.stat-item:nth-child(4) .stat-label': '\u0917\u0942\u0917\u0932 \u0930\u0947\u091f\u093f\u0902\u0917',

    // Roadmap
    '.roadmap .section-label': '\u092a\u094d\u0930\u0915\u094d\u0930\u093f\u092f\u093e',
    '.roadmap .section-headline': '\u0915\u0930\u094d\u091c \u092e\u0941\u0915\u094d\u0924\u093f \u0915\u093e \u0930\u094b\u0921\u092e\u0948\u092a',
    '.roadmap .section-sub': '\u0935\u0938\u0942\u0932\u0940 \u0926\u092c\u093e\u0935 \u0938\u0947 \u0932\u0947\u0915\u0930 \u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c\u093c\u0940 \u0938\u092e\u093e\u0927\u093e\u0928 \u092f\u094b\u091c\u0928\u093e \u0924\u0915 \u2014 \u090f\u0915 \u0936\u093e\u0902\u0924 \u0914\u0930 \u0935\u094d\u092f\u0935\u0938\u094d\u0925\u093f\u0924 \u0930\u093e\u0938\u094d\u0924\u093e\u0964',

    // Harassment
    '.harassment-section .section-label': '\u0935\u0938\u0942\u0932\u0940 \u0909\u0924\u094d\u092a\u0940\u0921\u093c\u0928 \u0938\u0939\u093e\u092f\u0924\u093e',
    '.harassment-section .section-headline': '\u0927\u092e\u0915\u0940 \u092d\u0930\u0940 \u0915\u0949\u0932 \u0905\u0915\u0947\u0932\u0947 \u092e\u0924 \u091d\u0947\u0932\u0947\u0902\u0964',
    '.harassment-section .section-sub': '\u0939\u092e\u093e\u0930\u0940 \u091f\u0940\u092e \u0906\u092a\u0915\u094b \u0924\u0925\u094d\u092f \u0926\u0930\u094d\u091c \u0915\u0930\u0928\u0947, \u0938\u0939\u0940 \u091a\u0948\u0928\u0932\u094b\u0902 \u0915\u0947 \u092e\u093e\u0927\u094d\u092f\u092e \u0938\u0947 \u091c\u0935\u093e\u092c \u0926\u0947\u0928\u0947 \u0914\u0930 \u090b\u0923\u0926\u093e\u0924\u093e \u0915\u0940 \u092c\u093e\u0924\u091a\u0940\u0924 \u0915\u094b \u090f\u0915 \u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c\u093c\u0940 \u092a\u094d\u0930\u0915\u094d\u0930\u093f\u092f\u093e \u092e\u0947\u0902 \u0932\u093e\u0928\u0947 \u092e\u0947\u0902 \u092e\u0926\u0926 \u0915\u0930\u0924\u0940 \u0939\u0948\u0964',

    // Trust
    '.trust .section-label': '\u0939\u092e \u092a\u0930 \u092d\u0930\u094b\u0938\u093e \u0915\u094d\u092f\u094b\u0902?',
    '.trust .section-headline': '\u0939\u092e \u0906\u092a\u0915\u0947 \u0932\u093f\u090f \u0932\u0921\u093c\u0924\u0947 \u0939\u0948\u0902',
    '.trust .section-sub': '\u0906\u0930\u092c\u0940\u0906\u0908 \u0905\u0928\u0941\u092a\u093e\u0932\u0928 \u0938\u0947 \u0932\u0947\u0915\u0930 \u092a\u0942\u0930\u094d\u0923 \u0915\u093e\u0928\u0942\u0928\u0940 \u0938\u0941\u0930\u0915\u094d\u0937\u093e \u0924\u0915 \u2014 \u0939\u092e\u093e\u0930\u0940 \u0938\u0947\u0935\u093e \u0915\u093e \u0939\u0930 \u0939\u093f\u0938\u094d\u0938\u093e \u0906\u092a\u0915\u0940 \u0938\u0941\u0930\u0915\u094d\u0937\u093e \u0914\u0930 \u0935\u093f\u0924\u094d\u0924\u0940\u092f \u092a\u0941\u0928\u0930\u094d\u092a\u094d\u0930\u093e\u092a\u094d\u0924\u093f \u0915\u0947 \u0932\u093f\u090f \u092c\u0928\u093e \u0939\u0948\u0964',

    // Debt types
    '.debt-types .section-label': '\u0939\u092e \u091c\u093f\u0928 \u0915\u0930\u094d\u091c\u094b\u0902 \u092e\u0947\u0902 \u092e\u0926\u0926 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902',
    '.debt-types .section-headline': '\u0905\u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0932\u094b\u0928 \u0915\u0947 \u0924\u0928\u093e\u0935 \u092e\u0947\u0902 \u0938\u0939\u093e\u092f\u0924\u093e',
    '.debt-types .section-sub': 'EMI \u0926\u092c\u093e\u0935, \u0935\u0938\u0942\u0932\u0940 \u0915\u0949\u0932, \u092c\u0915\u093e\u092f\u093e \u0916\u093e\u0924\u0947 \u092f\u093e \u0928\u093f\u092a\u091f\u093e\u0928 \u2014 \u0939\u0930 \u092e\u093e\u092e\u0932\u0947 \u092e\u0947\u0902 \u0938\u093e\u092b, \u0915\u0947\u0938-\u0926\u0930-\u0915\u0947\u0938 \u0938\u0939\u093e\u092f\u0924\u093e\u0964',

    // Testimonials
    '.testimonials .section-label': '\u0905\u0938\u0932\u0940 \u0915\u0939\u093e\u0928\u093f\u092f\u093e\u0901',
    '.testimonials .section-headline': '\u0905\u0938\u0932\u0940 \u092a\u0930\u093f\u0923\u093e\u092e, \u0905\u0938\u0932\u0940 \u0932\u094b\u0917',

    // Eligibility
    '.eligibility .section-label': '\u0915\u094d\u092f\u093e \u0906\u092a \u092a\u093e\u0924\u094d\u0930 \u0939\u0948\u0902?',
    '.eligibility .section-headline': '\u0924\u094d\u0935\u0930\u093f\u0924 \u092a\u093e\u0924\u094d\u0930\u0924\u093e<br>\u091c\u093e\u0901\u091a',
    '.eligibility .section-sub': '\u092a\u093e\u0924\u094d\u0930 \u0932\u094b\u0917\u094b\u0902 \u092e\u0947\u0902 \u092f\u0947 \u0924\u0940\u0928 \u092c\u093e\u0924\u0947\u0902 \u0906\u092e \u0939\u0948\u0902\u0964 \u0905\u0917\u0930 \u0907\u0928\u092e\u0947\u0902 \u0938\u0947 \u0915\u094b\u0908 \u092d\u0940 \u0906\u092a \u092a\u0930 \u0932\u093e\u0917\u0942 \u0939\u094b\u0924\u0940 \u0939\u0948, \u0924\u094b \u0939\u092e \u0936\u093e\u092f\u0926 \u0906\u092a\u0915\u0940 \u0915\u093e\u092b\u0940 \u092e\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964',
    '.elig-form-title': '\u0905\u092a\u0928\u093e \u092e\u0941\u092b\u094d\u0924<br>\u0915\u0930\u094d\u091c \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902',
    '.elig-form-sub': '2 \u092e\u093f\u0928\u091f \u0932\u0917\u0924\u0947 \u0939\u0948\u0902\u0964 \u0915\u094b\u0908 \u092a\u094d\u0930\u0924\u093f\u092c\u0926\u094d\u0927\u0924\u093e \u0928\u0939\u0940\u0902\u0964',

    // FAQ
    '.faq .section-label': '\u0938\u0935\u093e\u0932 \u0939\u0948\u0902?',
    '.faq .section-headline': '\u0905\u0915\u094d\u0938\u0930 \u092a\u0942\u091b\u0947 \u091c\u093e\u0928\u0947 \u0935\u093e\u0932\u0947<br>\u0938\u0935\u093e\u0932',
    '.faq .section-sub': '\u0935\u093f\u0924\u094d\u0924\u0940\u092f \u0938\u094d\u0935\u0924\u0902\u0924\u094d\u0930\u0924\u093e \u0915\u0940 \u0913\u0930 \u092a\u0939\u0932\u093e \u0915\u0926\u092e \u0909\u0920\u093e\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947 \u091c\u094b \u0915\u0941\u091b \u091c\u093e\u0928\u0928\u093e \u091c\u093c\u0930\u0942\u0930\u0940 \u0939\u0948\u0964',

    // CTA Banner
    '.cta-banner .section-label': '\u092a\u0939\u0932\u093e \u0915\u0926\u092e \u0909\u0920\u093e\u090f\u0902',
    '.cta-banner-headline': '\u0906\u092a\u0915\u0940 \u0935\u093f\u0924\u094d\u0924\u0940\u092f \u0938\u094d\u0935\u0924\u0902\u0924\u094d\u0930\u0924\u093e<br>\u0906\u091c \u0938\u0947 \u0936\u0941\u0930\u0942 \u0939\u094b\u0924\u0940 \u0939\u0948',
    '.cta-banner-sub': '\u0938\u094d\u0925\u093f\u0924\u093f \u092c\u093f\u0917\u0921\u093c\u0928\u0947 \u0915\u093e \u0907\u0902\u0924\u091c\u093c\u093e\u0930 \u092e\u0924 \u0915\u0930\u0947\u0902\u0964 \u0906\u091c \u092e\u0941\u092b\u094d\u0924 \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u092a\u093e\u090f\u0902 \u091c\u094b \u0906\u092a\u0915\u0947 \u0932\u093e\u0916\u094b\u0902 \u0914\u0930 \u0938\u093e\u0932\u094b\u0902 \u0915\u093e \u0924\u0928\u093e\u0935 \u092c\u091a\u093e \u0938\u0915\u0924\u093e \u0939\u0948\u0964',
  }
};

(function initLangToggle() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;

  let lang = localStorage.getItem('debtmukt_lang') || 'en';

  function applyLang(l) {
    const t = translations[l];
    if (!t) return;

    // data-i18n elements (nav links etc.)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });

    // Selector-based elements
    Object.entries(t).forEach(([sel, text]) => {
      if (sel.startsWith('.') || sel.startsWith('#')) {
        const el = document.querySelector(sel);
        if (el) el.innerHTML = text;
      }
    });

    // Toggle button label
    btn.textContent = l === 'hi' ? 'English' : '\u0939\u093f\u0902\u0926\u0940';
    document.documentElement.lang = l === 'hi' ? 'hi' : 'en';
  }

  // Apply saved preference on load
  if (lang === 'hi') applyLang('hi');

  btn.addEventListener('click', () => {
    lang = lang === 'en' ? 'hi' : 'en';
    localStorage.setItem('debtmukt_lang', lang);
    applyLang(lang);
  });
})();
