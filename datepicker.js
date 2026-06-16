/* datepicker.js — self-contained DD/MM/YYYY picker that wraps <input type="date"> */
(function () {
  /* ---- inject CSS once ---- */
  if (!document.getElementById('dp-style')) {
    const s = document.createElement('style');
    s.id = 'dp-style';
    s.textContent = `
.dp-wrap{display:inline-block;position:relative;}
.dp-txt{cursor:pointer;background:#fff;}
.dp-cal{position:absolute;top:calc(100% + 4px);left:0;z-index:9999;width:286px;
  background:#fff;border:1px solid #cbd5e1;border-radius:14px;
  box-shadow:0 18px 44px rgba(15,23,42,.18);padding:12px;display:none;}
.dp-cal.open{display:block;animation:dpIn .15s ease;}
@keyframes dpIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
.dp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:6px;}
.dp-title{font-weight:700;font-size:14px;color:#1e3a5f;}
.dp-nav{border:none;background:#f1f5f9;width:28px;height:28px;border-radius:8px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;color:#374151;}
.dp-nav:hover{background:#e2e8f0;}
.dp-nav svg{width:15px;height:15px;}
.dp-grid{display:grid !important;grid-template-columns:repeat(7,1fr) !important;}
.dp-dow{text-align:center;font-size:11px;font-weight:700;color:#64748b;padding:4px 0;}
.dp-day{text-align:center;font-size:13px;height:32px;line-height:32px;cursor:pointer;
  border-radius:8px;transition:background .1s,color .1s;user-select:none;}
.dp-day:hover{background:#eef4ff;}
.dp-day.muted{color:#cbd5e1;cursor:default;pointer-events:none;}
.dp-day.today{box-shadow:inset 0 0 0 1.5px #1d4ed8;font-weight:700;}
.dp-day.sel{background:#1d4ed8;color:#fff;}
.dp-foot{display:flex;margin-top:10px;}
.dp-foot button{flex:1;height:34px;border-radius:9px;border:1px solid #e2e8f0;
  background:#fff;font:inherit;font-weight:600;font-size:13px;cursor:pointer;color:#374151;}
.dp-foot button:hover{background:#f8fafc;}
@media print{.dp-cal{display:none !important;}}
`;
    document.head.appendChild(s);
  }

  const pad = n => String(n).padStart(2, '0');
  const ymd  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const dmy  = v => { if (!v) return ''; const [y,m,d]=v.split('-'); return `${d}/${m}/${y}`; };
  const parseY = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };

  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const PREV = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  const NEXT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  const protoVal  = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const protoDate = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'valueAsDate');

  function attach(id) {
    const orig = document.getElementById(id);
    if (!orig || orig.dataset.dp) return;
    orig.dataset.dp = '1';

    const inlineStyle = orig.getAttribute('style') || '';

    /* wrapper */
    const wrap = document.createElement('span');
    wrap.className = 'dp-wrap';
    orig.parentNode.insertBefore(wrap, orig);

    /* visible text input */
    const txt = document.createElement('input');
    txt.type = 'text';
    txt.readOnly = true;
    txt.placeholder = 'DD/MM/YYYY';
    txt.className = (orig.className + ' dp-txt').trim();
    txt.style.cssText = inlineStyle;
    wrap.appendChild(txt);

    /* calendar popup */
    const cal = document.createElement('div');
    cal.className = 'dp-cal';
    wrap.appendChild(cal);

    /* hide original */
    orig.style.display = 'none';
    wrap.appendChild(orig);

    /* sync text from orig value */
    function sync() { txt.value = dmy(protoVal.get.call(orig)); }
    sync();

    /* intercept .value */
    Object.defineProperty(orig, 'value', {
      get()  { return protoVal.get.call(this); },
      set(v) { protoVal.set.call(this, v || ''); sync(); },
      configurable: true
    });

    /* intercept .valueAsDate */
    if (protoDate) {
      Object.defineProperty(orig, 'valueAsDate', {
        get()  { return protoDate.get.call(this); },
        set(v) { protoDate.set.call(this, v); sync(); },
        configurable: true
      });
    }

    /* calendar */
    let view = new Date(); view.setDate(1);

    function renderCal() {
      const y = view.getFullYear(), m = view.getMonth();
      const startDow = new Date(y, m, 1).getDay();
      const dim = new Date(y, m+1, 0).getDate();
      const todayStr = ymd(new Date());
      const selVal = protoVal.get.call(orig);

      const blanks = Array.from({length: startDow}, () => '<div class="dp-day muted"></div>');
      const days = Array.from({length: dim}, (_, i) => {
        const d = i + 1;
        const ds = ymd(new Date(y, m, d));
        const cls = ['dp-day'];
        if (ds === selVal) cls.push('sel');
        if (ds === todayStr) cls.push('today');
        return `<div class="${cls.join(' ')}" data-d="${d}">${d}</div>`;
      });

      cal.innerHTML = `
        <div class="dp-head">
          <button type="button" class="dp-nav" data-nav="-1">${PREV}</button>
          <div class="dp-title">${MONTHS[m]} ${y+543}</div>
          <button type="button" class="dp-nav" data-nav="1">${NEXT}</button>
        </div>
        <div class="dp-grid">
          ${DOW.map(w=>`<div class="dp-dow">${w}</div>`).join('')}
          ${blanks.join('')}${days.join('')}
        </div>
        <div class="dp-foot">
          <button type="button">ล้าง</button>
        </div>`;

      cal.querySelectorAll('[data-nav]').forEach(b =>
        b.addEventListener('click', () => {
          view.setMonth(view.getMonth() + Number(b.dataset.nav)); renderCal();
        }));

      cal.querySelectorAll('.dp-day[data-d]').forEach(c =>
        c.addEventListener('click', () => {
          orig.value = ymd(new Date(y, m, Number(c.dataset.d)));
          orig.dispatchEvent(new Event('change', {bubbles:true}));
          closeCal();
        }));

      cal.querySelector('.dp-foot button').addEventListener('click', () => {
        orig.value = '';
        orig.dispatchEvent(new Event('change', {bubbles:true}));
        closeCal();
      });
    }

    function openCal() {
      const v = protoVal.get.call(orig);
      if (v) { view = parseY(v); view.setDate(1); }
      renderCal();
      cal.classList.add('open');
    }
    function closeCal() { cal.classList.remove('open'); }

    cal.addEventListener('click', e => e.stopPropagation());
    txt.addEventListener('click', e => {
      e.stopPropagation();
      cal.classList.contains('open') ? closeCal() : openCal();
    });
    document.addEventListener('click', closeCal);
  }

  window.DatePicker = { attach };
})();
