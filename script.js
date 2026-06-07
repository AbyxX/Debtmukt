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
      { el: document.querySelector('.stat-item:nth-child(1) .stat-number'), prefix: '₹', suffix: ' Cr+', end: 12 },
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

// ── HINDI TRANSLATION TOGGLE ──
const translations = {
  en: {
    // Nav
    'nav-process': 'How It Works',
    'nav-calc': 'Calculator',
    'nav-debt': 'Debt Types',
    'nav-stories': 'Success Stories',
    'nav-faqs': 'FAQs',
    'nav-cta': 'Free Consultation',
    'lang-btn': 'हिंदी',

    // Hero
    '.hero-badge': "India's #1 Debt Settlement Platform",
    '.hero-headline': 'Drowning<br>in debt?<br>We\'ll help you<br><span class="breathe">Breathe Again.</span>',
    '.hero-sub': 'Our certified legal experts negotiate directly with banks and NBFCs on your behalf — so you can stop the harassment, cut your debt by up to 80%, and rebuild your life.',
    '.trust-text': '<strong>850+ clients helped</strong>Across credit cards, personal loans & business debt',
    '.hero-bullets': '<li>Reduce debt by 40–80%</li><li>Stop creditor harassment calls</li><li>Transparent fees — know exactly what you pay</li><li>Complete legal process within 12 months</li>',

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
    '.trust .section-sub': 'From RBI compliance to full legal protection — every part of our service is designed around your safety and financial recovery.',

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
    '.eligibility .section-sub': 'Most people who qualify share these three traits. If you tick any of these boxes, we can likely help you — significantly.',
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
    'nav-process': 'यह कैसे काम करता है',
    'nav-calc': 'कैलकुलेटर',
    'nav-debt': 'कर्ज के प्रकार',
    'nav-stories': 'सफलता की कहानियाँ',
    'nav-faqs': 'सामान्य प्रश्न',
    'nav-cta': 'मुफ्त परामर्श',
    'lang-btn': 'English',

    // Hero
    '.hero-badge': 'भारत का नंबर 1 कर्ज निपटान मंच',
    '.hero-headline': 'कर्ज में<br>डूबे हैं?<br>हम आपको<br><span class="breathe">राहत दिलाएंगे।</span>',
    '.hero-sub': 'हमारे प्रमाणित कानूनी विशेषज्ञ सीधे बैंकों और एनबीएफसी से आपकी ओर से बात करते हैं — ताकि आप उत्पीड़न बंद कर सकें, अपना कर्ज 80% तक कम कर सकें और अपनी जिंदगी फिर से बना सकें।',
    '.trust-text': '<strong>850+ ग्राहकों की मदद</strong>क्रेडिट कार्ड, पर्सनल लोन और बिजनेस लोन में',
    '.hero-bullets': '<li>कर्ज 40–80% तक कम करें</li><li>वसूली एजेंट की कॉल बंद करें</li><li>पारदर्शी शुल्क — जानें कि आप क्या भुगतान करते हैं</li><li>12 महीने में पूरी कानूनी प्रक्रिया</li>',

    // Hero form
    '.calc-title': 'मुफ्त परामर्श',
    '.calc-headline': 'आज जानें आप क्या कर सकते हैं',
    '.hero-form-intro': 'कुछ बुनियादी जानकारी साझा करें। हमारी टीम आपको लोन समाधान या वसूली उत्पीड़न के लिए अगला सुरक्षित कदम समझने में मदद करेगी।',

    // Stats
    '.stat-item:nth-child(1) .stat-label': 'कुल कर्ज निपटान',
    '.stat-item:nth-child(2) .stat-label': 'खुश ग्राहक',
    '.stat-item:nth-child(3) .stat-label': 'वर्षों का अनुभव',
    '.stat-item:nth-child(4) .stat-label': 'गूगल रेटिंग',

    // Roadmap
    '.roadmap .section-label': 'प्रक्रिया',
    '.roadmap .section-headline': 'कर्ज मुक्ति का रोडमैप',
    '.roadmap .section-sub': 'वसूली दबाव से लेकर दस्तावेज़ी समाधान योजना तक — एक शांत और व्यवस्थित रास्ता।',

    // Harassment
    '.harassment-section .section-label': 'वसूली उत्पीड़न सहायता',
    '.harassment-section .section-headline': 'धमकी भरी कॉल अकेले मत झेलें।',
    '.harassment-section .section-sub': 'हमारी टीम आपको तथ्य दर्ज करने, सही चैनलों के माध्यम से जवाब देने और ऋणदाता की बातचीत को एक दस्तावेज़ी प्रक्रिया में लाने में मदद करती है।',

    // Trust
    '.trust .section-label': 'हम पर भरोसा क्यों?',
    '.trust .section-headline': 'हम आपके लिए लड़ते हैं',
    '.trust .section-sub': 'आरबीआई अनुपालन से लेकर पूर्ण कानूनी सुरक्षा तक — हमारी सेवा का हर हिस्सा आपकी सुरक्षा और वित्तीय पुनर्प्राप्ति के लिए बना है।',

    // Debt types
    '.debt-types .section-label': 'हम जिन कर्जों में मदद करते हैं',
    '.debt-types .section-headline': 'असुरक्षित लोन के तनाव में सहायता',
    '.debt-types .section-sub': 'EMI दबाव, वसूली कॉल, बकाया खाते या निपटान — हर मामले में साफ, केस-दर-केस सहायता।',

    // Testimonials
    '.testimonials .section-label': 'असली कहानियाँ',
    '.testimonials .section-headline': 'असली परिणाम, असली लोग',

    // Eligibility
    '.eligibility .section-label': 'क्या आप पात्र हैं?',
    '.eligibility .section-headline': 'त्वरित पात्रता<br>जाँच',
    '.eligibility .section-sub': 'पात्र लोगों में ये तीन बातें आम हैं। अगर इनमें से कोई भी आप पर लागू होती है, तो हम शायद आपकी काफी मदद कर सकते हैं।',
    '.elig-form-title': 'अपना मुफ्त<br>कर्ज विश्लेषण शुरू करें',
    '.elig-form-sub': '2 मिनट लगते हैं। कोई प्रतिबद्धता नहीं।',

    // FAQ
    '.faq .section-label': 'सवाल हैं?',
    '.faq .section-headline': 'अक्सर पूछे जाने वाले<br>सवाल',
    '.faq .section-sub': 'वित्तीय स्वतंत्रता की ओर पहला कदम उठाने से पहले जो कुछ जानना ज़रूरी है।',

    // CTA Banner
    '.cta-banner .section-label': 'पहला कदम उठाएं',
    '.cta-banner-headline': 'आपकी वित्तीय स्वतंत्रता<br>आज से शुरू होती है',
    '.cta-banner-sub': 'स्थिति बिगड़ने का इंतज़ार मत करें। आज मुफ्त विश्लेषण पाएं जो आपके लाखों और सालों का तनाव बचा सकता है।',
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
    btn.textContent = l === 'hi' ? 'English' : 'हिंदी';
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
