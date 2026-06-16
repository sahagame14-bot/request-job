/* =====================================================================
   Shared filter bar — date-range picker · recorder search · clear · sort
   Usage:
     FilterBar.init({
       mount: '#filterbar',
       status: true,                         // show the status <select>
       statusOptions: [['','ทุกสถานะ'], ...],// optional custom options
       defaultStatus: '',                    // optional preselected value
       onChange: load                        // called whenever a filter changes
     });
     // in load():  const f = FilterBar.state();  // {q,status,date_from,date_to,sort}
   ===================================================================== */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const sameYmd = (a, b) => a && b && ymd(a) === ymd(b);
  const fmtD  = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  const fmtDY = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  const ICON_CAL  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const ICON_SRCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  const ICON_TRASH= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
  const ICON_PREV = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  const ICON_NEXT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  function init(opts) {
    const mount = document.querySelector(opts.mount);
    if (!mount) return null;
    const onChange = opts.onChange || (() => {});
    const statusOptions = opts.statusOptions || [
      ['', 'ทุกสถานะ'], ['pending', 'Pending'], ['receive', 'Receive'],
      ['waiting', 'Waiting'], ['finish', 'Finish'], ['cancel', 'Cancel'],
    ];

    const st = { q: '', status: opts.defaultStatus || '', from: null, to: null, sort: 'desc' };

    // ---------- build bar markup ----------
    const statusHtml = opts.status ? `
      <div class="fb-field">
        <label>สถานะ</label>
        <select class="fb-pill" data-fb="status">
          ${statusOptions.map(([v, t]) => `<option value="${v}"${v === st.status ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>` : '';

    mount.classList.add('filterbar');
    mount.innerHTML = `
      <div class="fb-field">
        <label>ช่วงวันที่</label>
        <button type="button" class="fb-pill" data-fb="date">
          ${ICON_CAL}<span class="fb-date-label ph" data-fb="datelabel">เลือกช่วงวันที่</span>
        </button>
        <div class="fb-cal" data-fb="cal"></div>
      </div>
      <div class="fb-field">
        <label>ผู้บันทึก</label>
        <span class="fb-pill">${ICON_SRCH}<input type="search" data-fb="search" placeholder="ค้นหาชื่อ…"></span>
      </div>
      ${statusHtml}
      <div class="fb-field">
        <label>&nbsp;</label>
        <button type="button" class="fb-btn clear" data-fb="clear">${ICON_TRASH}<span>ล้างตัวกรอง</span></button>
      </div>
      <div class="fb-field">
        <label>&nbsp;</label>
        <button type="button" class="fb-btn" data-fb="sort"><span data-fb="sorticon">↓</span> <span data-fb="sortlabel">ใหม่ → เก่า</span></button>
      </div>`;

    const $ = sel => mount.querySelector(`[data-fb="${sel}"]`);
    const dateBtn = $('date'), dateLabel = $('datelabel'), cal = $('cal');
    const searchEl = $('search'), statusEl = $('status');
    const clearBtn = $('clear'), sortBtn = $('sort'), sortIcon = $('sorticon'), sortLabel = $('sortlabel');

    cal.addEventListener('click', e => e.stopPropagation());

    // ---------- search (debounced) ----------
    let t = null;
    searchEl.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { st.q = searchEl.value.trim(); onChange(); }, 300);
    });

    // ---------- status ----------
    if (statusEl) statusEl.addEventListener('change', () => { st.status = statusEl.value; onChange(); });

    // ---------- sort ----------
    sortBtn.addEventListener('click', () => {
      st.sort = st.sort === 'desc' ? 'asc' : 'desc';
      sortIcon.textContent = st.sort === 'desc' ? '↓' : '↑';
      sortLabel.textContent = st.sort === 'desc' ? 'ใหม่ → เก่า' : 'เก่า → ใหม่';
      onChange();
    });

    // ---------- clear ----------
    clearBtn.addEventListener('click', () => {
      st.q = ''; st.status = ''; st.from = null; st.to = null;
      searchEl.value = '';
      if (statusEl) statusEl.value = '';
      updateDateLabel();
      onChange();
    });

    // ---------- date range calendar ----------
    let view = new Date(); view.setDate(1);
    let selFrom = null, selTo = null;            // tentative selection inside the popover

    function updateDateLabel() {
      if (st.from && st.to) {
        dateLabel.textContent = `${fmtD(parseYmd(st.from))} – ${fmtDY(parseYmd(st.to))}`;
        dateLabel.classList.remove('ph');
      } else if (st.from) {
        dateLabel.textContent = fmtDY(parseYmd(st.from));
        dateLabel.classList.remove('ph');
      } else {
        dateLabel.textContent = 'เลือกช่วงวันที่';
        dateLabel.classList.add('ph');
      }
    }

    function renderCal() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = new Date(y, m, 1);
      const startDow = first.getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const today = new Date();
      const cells = [];
      for (let i = 0; i < startDow; i++) cells.push('<div class="fb-cal-day muted"></div>');
      for (let d = 1; d <= daysInMonth; d++) {
        const cur = new Date(y, m, d);
        const cls = ['fb-cal-day'];
        if (sameYmd(cur, today)) cls.push('today');
        if (selFrom && selTo) {
          if (cur > selFrom && cur < selTo) cls.push('in-range');
          if (sameYmd(cur, selFrom)) cls.push('range-start', 'in-range');
          if (sameYmd(cur, selTo))   cls.push('range-end', 'in-range');
        } else if (selFrom && sameYmd(cur, selFrom)) {
          cls.push('range-start', 'range-end');
        }
        cells.push(`<div class="${cls.join(' ')}" data-d="${d}">${d}</div>`);
      }
      cal.innerHTML = `
        <div class="fb-cal-head">
          <button type="button" class="fb-cal-nav" data-nav="-1">${ICON_PREV}</button>
          <div class="fb-cal-title">${MONTHS[m]} ${y + 543}</div>
          <button type="button" class="fb-cal-nav" data-nav="1">${ICON_NEXT}</button>
        </div>
        <div class="fb-cal-grid">${DOW.map(w => `<div class="fb-cal-dow">${w}</div>`).join('')}${cells.join('')}</div>
        <div class="fb-cal-foot">
          <button type="button" class="clr">ล้าง</button>
          <button type="button" class="ok">ตกลง</button>
        </div>`;

      cal.querySelectorAll('[data-nav]').forEach(b =>
        b.addEventListener('click', () => { view.setMonth(view.getMonth() + Number(b.dataset.nav)); renderCal(); }));
      cal.querySelectorAll('.fb-cal-day[data-d]').forEach(c => {
        const d = new Date(y, m, Number(c.dataset.d));
        c.addEventListener('click', () => pickDay(d));
        c.addEventListener('dblclick', () => {
          pickDay(d);
          st.from = ymd(selFrom || d);
          st.to   = selTo ? ymd(selTo) : ymd(selFrom || d);
          updateDateLabel(); closeCal(); onChange();
        });
      });
      cal.querySelector('.clr').addEventListener('click', () => {
        selFrom = selTo = null; st.from = st.to = null; updateDateLabel(); closeCal(); onChange();
      });
      cal.querySelector('.ok').addEventListener('click', () => {
        st.from = selFrom ? ymd(selFrom) : null;
        st.to   = selTo ? ymd(selTo) : (selFrom ? ymd(selFrom) : null);
        updateDateLabel(); closeCal(); onChange();
      });
    }

    function pickDay(d) {
      if (!selFrom || (selFrom && selTo)) { selFrom = d; selTo = null; }
      else if (d >= selFrom) { selTo = d; }
      else { selFrom = d; selTo = null; }
      renderCal();
    }

    function openCal() {
      selFrom = st.from ? parseYmd(st.from) : null;
      selTo   = st.to ? parseYmd(st.to) : null;
      if (selFrom) { view = new Date(selFrom); view.setDate(1); }
      renderCal();
      cal.classList.add('show'); dateBtn.classList.add('open');
    }
    function closeCal() { cal.classList.remove('show'); dateBtn.classList.remove('open'); }

    dateBtn.addEventListener('click', e => {
      e.stopPropagation();
      cal.classList.contains('show') ? closeCal() : openCal();
    });
    document.addEventListener('click', e => { if (!cal.contains(e.target) && e.target !== dateBtn) closeCal(); });

    updateDateLabel();

    // ---------- public API ----------
    const api = {
      state: () => ({ q: st.q, status: st.status, date_from: st.from || '', date_to: st.to || '', sort: st.sort }),
    };
    // expose on the global too, so pages can call FilterBar.state() directly
    window.FilterBar.state = api.state;
    return api;
  }

  window.FilterBar = { init, state: () => ({ q:'', status:'', date_from:'', date_to:'', sort:'desc' }) };
})();
