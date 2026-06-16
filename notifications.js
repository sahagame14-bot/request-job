/* ================================================================
   Notification Bell — bell ring + ripple wave animations
   Usage:  NotifBell.init({ mount:'#notif-bell' });
   ================================================================ */
(function () {
  const POLL_MS = 30000;

  /* ── DEMO MODE — set IS_DEMO = false for production ── */
  const IS_DEMO = false;
  const _demo = [
    { id:1,  request_id:20, message:'งานใหม่: RJE-20260020 — Conveyor belt ชำรุด สายพานขาด',              is_read:0, created_at:'2026-06-15T09:12:00', rec_no:'RJE-20260020' },
    { id:2,  request_id:19, message:'งานใหม่: RJE-20260019 — เครื่องปั๊มน้ำมันรั่ว บริเวณไลน์ผลิต 2',    is_read:0, created_at:'2026-06-15T08:55:00', rec_no:'RJE-20260019' },
    { id:3,  request_id:18, message:'งานใหม่: RJE-20260018 — ระบบไฟฟ้าลัดวงจร แผนก B อาคาร 3',           is_read:0, created_at:'2026-06-15T08:30:00', rec_no:'RJE-20260018' },
    { id:4,  request_id:17, message:'งานใหม่: RJE-20260017 — Air compressor ไม่ทำงาน แรงดันตก',           is_read:0, created_at:'2026-06-14T17:42:00', rec_no:'RJE-20260017' },
    { id:5,  request_id:16, message:'งานใหม่: RJE-20260016 — Forklift ล้อยางแตก ต้องเปลี่ยนด่วน',        is_read:0, created_at:'2026-06-14T16:10:00', rec_no:'RJE-20260016' },
    { id:6,  request_id:15, message:'งานใหม่: RJE-20260015 — ท่อน้ำหล่อเย็นรั่ว ไลน์ผลิต 3',             is_read:1, created_at:'2026-06-14T14:25:00', rec_no:'RJE-20260015' },
    { id:7,  request_id:14, message:'งานใหม่: RJE-20260014 — เครื่องชั่งน้ำหนักอ่านค่าผิดพลาด',           is_read:1, created_at:'2026-06-14T11:08:00', rec_no:'RJE-20260014' },
    { id:8,  request_id:13, message:'งานใหม่: RJE-20260013 — ระบบ CCTV ห้องควบคุมไม่แสดงภาพ',             is_read:1, created_at:'2026-06-14T09:50:00', rec_no:'RJE-20260013' },
    { id:9,  request_id:12, message:'งานใหม่: RJE-20260012 — มอเตอร์ปั๊มน้ำเสียงดังผิดปกติ',              is_read:1, created_at:'2026-06-13T15:33:00', rec_no:'RJE-20260012' },
    { id:10, request_id:11, message:'งานใหม่: RJE-20260011 — ประตูโรงงานบานที่ 2 ปิดไม่สนิท',             is_read:1, created_at:'2026-06-13T13:20:00', rec_no:'RJE-20260011' },
    { id:11, request_id:10, message:'งานใหม่: RJE-20260010 — หลังคาโรงงานส่วน C มีน้ำรั่วซึม',            is_read:1, created_at:'2026-06-13T10:15:00', rec_no:'RJE-20260010' },
    { id:12, request_id:9,  message:'งานใหม่: RJE-20260009 — เครื่อง CNC หยุดกลางคัน อ่าน G-code ไม่ได้', is_read:1, created_at:'2026-06-12T16:45:00', rec_no:'RJE-20260009' },
    { id:13, request_id:8,  message:'งานใหม่: RJE-20260008 — สายพานลำเลียงสินค้าขาด ไลน์ A',              is_read:1, created_at:'2026-06-12T14:00:00', rec_no:'RJE-20260008' },
    { id:14, request_id:7,  message:'งานใหม่: RJE-20260007 — ระบบ PLC ค้าง ต้องรีเซ็ตใหม่',               is_read:1, created_at:'2026-06-12T11:30:00', rec_no:'RJE-20260007' },
    { id:15, request_id:6,  message:'งานใหม่: RJE-20260006 — ไฟส่องสว่างในโรงงานดับ 3 จุด',               is_read:1, created_at:'2026-06-11T15:55:00', rec_no:'RJE-20260006' },
    { id:16, request_id:5,  message:'งานใหม่: RJE-20260005 — เครื่องพิมพ์ฉลากสินค้าขัดข้อง',              is_read:1, created_at:'2026-06-11T13:10:00', rec_no:'RJE-20260005' },
    { id:17, request_id:4,  message:'งานใหม่: RJE-20260004 — ระบบดับเพลิงอัตโนมัติส่งสัญญาณผิดพลาด',      is_read:1, created_at:'2026-06-10T09:40:00', rec_no:'RJE-20260004' },
    { id:18, request_id:3,  message:'งานใหม่: RJE-20260003 — Conveyor check เช็คระบบประจำเดือน',           is_read:1, created_at:'2026-06-09T16:22:00', rec_no:'RJE-20260003' },
    { id:19, request_id:2,  message:'งานใหม่: RJE-20260002 — Printer error เครื่องพิมพ์ไม่ตอบสนอง',       is_read:1, created_at:'2026-06-09T10:05:00', rec_no:'RJE-20260002' },
    { id:20, request_id:1,  message:'งานใหม่: RJE-20260001 — ติดตีมชาติโปรดุเกส',                          is_read:1, created_at:'2026-06-08T14:30:00', rec_no:'RJE-20260001' },
  ];
  const _demoDetail = {
    20: { rec_no:'RJE-20260020', req_date:'2026-06-15', subject:'Conveyor belt ชำรุด สายพานขาด',              req_name:'สมชาย ใจดี',      position:'Operator',      section:'ไลน์ผลิต 1',   due_date:'2026-06-17', status:'pending',  work_type:'ซ่อมแซม',      detail:'สายพานลำเลียงบนไลน์ผลิต 1 ขาดกะทันหัน ไม่สามารถเดินเครื่องได้ ต้องการช่างเข้าซ่อมด่วน ระบุตำแหน่ง: หัวลำเลียงด้านขาออก' },
    19: { rec_no:'RJE-20260019', req_date:'2026-06-15', subject:'เครื่องปั๊มน้ำมันรั่ว บริเวณไลน์ผลิต 2',   req_name:'วิภาพร เพ็ชรดี',  position:'Technician',    section:'ไลน์ผลิต 2',   due_date:'2026-06-16', status:'pending',  work_type:'ซ่อมแซม',      detail:'พบน้ำมันหล่อลื่นรั่วซึมบริเวณข้อต่อปั๊ม อาจทำให้พื้นลื่น ต้องการซ่อมด่วนก่อนกะบ่าย' },
    18: { rec_no:'RJE-20260018', req_date:'2026-06-15', subject:'ระบบไฟฟ้าลัดวงจร แผนก B อาคาร 3',           req_name:'ประทีป สมบูรณ์', position:'Supervisor',    section:'แผนก B',        due_date:'2026-06-15', status:'receive',  work_type:'ซ่อมแซม',      detail:'ไฟดับเฉพาะโซน B3 ตรวจพบกลิ่นไหม้บริเวณตู้ MDB ห้องไฟฟ้า ต้องการช่างไฟเข้าตรวจสอบโดยด่วน' },
    17: { rec_no:'RJE-20260017', req_date:'2026-06-14', subject:'Air compressor ไม่ทำงาน แรงดันตก',           req_name:'สุรชาติ พงษ์ศิลป์', position:'Mechanic',   section:'Utility',       due_date:'2026-06-15', status:'receive',  work_type:'ตรวจสอบ',      detail:'Compressor หมายเลข 2 ไม่สามารถสร้างแรงดันได้ถึง 7 bar ส่งผลกระทบต่อเครื่องจักรในไลน์ผลิต 3 และ 4' },
    16: { rec_no:'RJE-20260016', req_date:'2026-06-14', subject:'Forklift ล้อยางแตก ต้องเปลี่ยนด่วน',        req_name:'มานพ ทองสุข',     position:'Driver',        section:'Warehouse',     due_date:'2026-06-14', status:'waiting',  work_type:'เปลี่ยนอะไหล่', detail:'Forklift หมายเลข FL-03 ล้อยางหน้าซ้ายแตก ไม่สามารถใช้งานได้ ต้องการเปลี่ยนยางด่วน มียางสำรองในคลังแล้ว' },
    15: { rec_no:'RJE-20260015', req_date:'2026-06-14', subject:'ท่อน้ำหล่อเย็นรั่ว ไลน์ผลิต 3',             req_name:'อนุชา วงศ์สวัสดิ์', position:'Operator',   section:'ไลน์ผลิต 3',   due_date:'2026-06-16', status:'waiting',  work_type:'ซ่อมแซม',      detail:'ท่อน้ำหล่อเย็น Chiller ขนาด 2 นิ้ว รั่วซึมบริเวณข้อต่อ Joint ที่ 3 น้ำหยดลงพื้น ต้องการช่างท่อ' },
    14: { rec_no:'RJE-20260014', req_date:'2026-06-14', subject:'เครื่องชั่งน้ำหนักอ่านค่าผิดพลาด',           req_name:'จิราพร นาคสุวรรณ', position:'QC',           section:'Quality Control',due_date:'2026-06-17', status:'finish',   work_type:'ปรับแต่ง',      detail:'เครื่องชั่ง Platform Scale หมายเลข SC-07 แสดงค่าเกิน ±5% จากมาตรฐาน ต้องการสอบเทียบและปรับแต่งใหม่' },
    13: { rec_no:'RJE-20260013', req_date:'2026-06-14', subject:'ระบบ CCTV ห้องควบคุมไม่แสดงภาพ',             req_name:'ธีรพล อินทรีย์',  position:'Security',      section:'Security',      due_date:'2026-06-15', status:'finish',   work_type:'ซ่อมแซม',      detail:'กล้อง CCTV หมายเลข CAM-12 ถึง CAM-15 ไม่แสดงภาพในห้องควบคุม ระบบบันทึกภาพยังทำงาน แต่ Monitor ไม่แสดงผล' },
    12: { rec_no:'RJE-20260012', req_date:'2026-06-13', subject:'มอเตอร์ปั๊มน้ำเสียงดังผิดปกติ',              req_name:'ศิริพร แก้วมณี',  position:'Technician',    section:'Utility',       due_date:'2026-06-16', status:'finish',   work_type:'ตรวจสอบ',      detail:'มอเตอร์ปั๊มน้ำดีหมายเลข WP-02 มีเสียงดังผิดปกติ คล้ายเสียงลูกปืน ต้องการช่างตรวจสอบและเปลี่ยนลูกปืนถ้าจำเป็น' },
    11: { rec_no:'RJE-20260011', req_date:'2026-06-13', subject:'ประตูโรงงานบานที่ 2 ปิดไม่สนิท',             req_name:'บุญชัย สารภี',    position:'Technician',    section:'Facility',      due_date:'2026-06-15', status:'finish',   work_type:'ซ่อมแซม',      detail:'ประตูเหล็กม้วนบานที่ 2 ทางเข้าหลักไม่ปิดสนิท มีช่องว่างด้านล่าง 10 ซม. ต้องการปรับสปริงและตรวจ Spring Tension' },
    10: { rec_no:'RJE-20260010', req_date:'2026-06-13', subject:'หลังคาโรงงานส่วน C มีน้ำรั่วซึม',            req_name:'ไพโรจน์ ดวงดี',  position:'Supervisor',    section:'Building C',    due_date:'2026-06-20', status:'finish',   work_type:'ซ่อมแซม',      detail:'พบน้ำรั่วซึมผ่านหลังคาช่วงฝนตก บริเวณพื้นที่ประมาณ 3x3 เมตร ใกล้คอลัมน์ C-12 ต้องการซ่อมแซมหลังคาแบบถาวร' },
    9:  { rec_no:'RJE-20260009', req_date:'2026-06-12', subject:'เครื่อง CNC หยุดกลางคัน อ่าน G-code ไม่ได้', req_name:'กิตติ เลิศวิทยา', position:'CNC Operator',  section:'Machining',     due_date:'2026-06-13', status:'finish',   work_type:'ซ่อมแซม',      detail:'CNC Machining Center หมายเลข MC-04 หยุดกลางโปรแกรม แสดง Error Code E-502 ไม่สามารถอ่านไฟล์ G-code ได้ ต้องการ Maintenance ตรวจสอบ Controller' },
    8:  { rec_no:'RJE-20260008', req_date:'2026-06-12', subject:'สายพานลำเลียงสินค้าขาด ไลน์ A',              req_name:'ดำรงค์ ศรีวิชัย', position:'Operator',      section:'ไลน์ A',        due_date:'2026-06-12', status:'cancel',   work_type:'เปลี่ยนอะไหล่', detail:'สายพาน V-Belt ชุดขับมอเตอร์ขาด ไลน์หยุด ต้องการสายพานเบอร์ B-72 จำนวน 4 เส้น (ยกเลิกเนื่องจากซ่อมชั่วคราวได้แล้ว)' },
    7:  { rec_no:'RJE-20260007', req_date:'2026-06-12', subject:'ระบบ PLC ค้าง ต้องรีเซ็ตใหม่',               req_name:'วิชัย ประทุมมาส', position:'Electrician',   section:'Electrical',    due_date:'2026-06-12', status:'finish',   work_type:'ตรวจสอบ',      detail:'PLC Siemens S7-300 ของเครื่องบรรจุภัณฑ์หมายเลข PK-06 ค้าง Output ไม่ตอบสนอง ต้องการ PLC Engineer ตรวจสอบ Program และ Hardware' },
    6:  { rec_no:'RJE-20260006', req_date:'2026-06-11', subject:'ไฟส่องสว่างในโรงงานดับ 3 จุด',               req_name:'สันติ ผลดี',      position:'Technician',    section:'Facility',      due_date:'2026-06-13', status:'finish',   work_type:'เปลี่ยนอะไหล่', detail:'หลอด LED High Bay ขนาด 200W ดับ 3 หลอด บริเวณ Row C, D และ E ส่งผลให้แสงสว่างไม่เพียงพอตามมาตรฐาน ต้องการเปลี่ยนหลอดใหม่' },
    5:  { rec_no:'RJE-20260005', req_date:'2026-06-11', subject:'เครื่องพิมพ์ฉลากสินค้าขัดข้อง',              req_name:'พิมพ์ใจ หมั้นทอง', position:'Packing',      section:'Packing',       due_date:'2026-06-12', status:'finish',   work_type:'ซ่อมแซม',      detail:'Thermal Printer หมายเลข TP-02 พิมพ์ฉลากสินค้าแล้วเกิดเส้นขาดพาดตามแนวนอน ต้องการตรวจสอบ Print Head และ Platen Roller' },
    4:  { rec_no:'RJE-20260004', req_date:'2026-06-10', subject:'ระบบดับเพลิงอัตโนมัติส่งสัญญาณผิดพลาด',      req_name:'นิพนธ์ อ่อนน้อม',  position:'Safety Officer',section:'Safety',        due_date:'2026-06-11', status:'finish',   work_type:'ตรวจสอบ',      detail:'Fire Alarm แผง Zone 4 (อาคาร A) ส่งสัญญาณเตือนโดยไม่มีเหตุ ตรวจสอบเบื้องต้นไม่พบควันหรือไฟ ต้องการช่างระบบดับเพลิงตรวจสอบ Detector' },
    3:  { rec_no:'RJE-20260003', req_date:'2026-06-09', subject:'Conveyor check เช็คระบบประจำเดือน',           req_name:'Admin',            position:'—',             section:'—',             due_date:'2026-06-11', status:'finish',   work_type:'ตรวจสอบ',      detail:'เช็คระบบ Conveyor ทั้งหมดประจำเดือนมิถุนายน 2569 ครอบคลุมทุกไลน์ผลิต' },
    2:  { rec_no:'RJE-20260002', req_date:'2026-06-09', subject:'Printer error เครื่องพิมพ์ไม่ตอบสนอง',       req_name:'Admin',            position:'—',             section:'—',             due_date:null,         status:'pending',  work_type:'ซ่อมแซม',      detail:'เครื่องพิมพ์ไม่ตอบสนอง' },
    1:  { rec_no:'RJE-20260001', req_date:'2026-06-07', subject:'ติดตีมชาติโปรดุเกส',                          req_name:'โรเบด้า',          position:'กองหน้าตัวเป้า', section:'กัปตันทีม',    due_date:'2026-06-07', status:'finish',   work_type:'—',             detail:'ฟุตบอลโลก 2026' },
  };
  /* ── END DEMO MODE ── */

  const BELL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>`;

  const STATUS_TH = { pending:'Pending', receive:'รับเรื่องแล้ว', waiting:'รอดำเนินการ', finish:'เสร็จแล้ว', cancel:'ยกเลิก' };

  const esc = s => (s ?? '').toString().replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const fmtDT = d => {
    if (!d) return '';
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, '0');
    const mon = String(dt.getMonth() + 1).padStart(2, '0');
    const h   = String(dt.getHours()).padStart(2, '0');
    const m   = String(dt.getMinutes()).padStart(2, '0');
    return `${day}/${mon}/${dt.getFullYear()} ${h}:${m}`;
  };

  const fmtDate = d => {
    if (!d) return '—';
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, '0');
    const mon = String(dt.getMonth() + 1).padStart(2, '0');
    return `${day}/${mon}/${dt.getFullYear()}`;
  };

  function init(opts) {
    const mount = document.querySelector(opts && opts.mount ? opts.mount : '#notif-bell');
    if (!mount) return;

    mount.innerHTML = `
      <div class="nb-wrap">
        <button class="nb-btn" id="nbBtn" title="การแจ้งเตือน">
          <span class="nb-icon" id="nbIcon">${BELL}</span>
          <span class="nb-badge" id="nbBadge" style="display:none">0</span>
        </button>
        <div class="nb-panel" id="nbPanel" style="display:none">
          <div class="nb-head">
            <span class="nb-title">การแจ้งเตือน</span>
            <button class="nb-markall" id="nbMarkAll">เคลียร์</button>
          </div>
          <div class="nb-list" id="nbList">
            <div class="nb-empty">ไม่มีการแจ้งเตือน</div>
          </div>
        </div>
      </div>`;

    /* Preview modal — singleton on body */
    let previewEl = document.getElementById('nbPreviewModal');
    if (!previewEl) {
      previewEl = document.createElement('div');
      previewEl.id = 'nbPreviewModal';
      previewEl.className = 'nbp-modal';
      previewEl.style.display = 'none';
      previewEl.innerHTML = `
        <div class="nbp-overlay" id="nbpOverlay"></div>
        <div class="nbp-box">
          <button class="nbp-close" id="nbpClose">✕</button>
          <div id="nbpContent"></div>
        </div>`;
      document.body.appendChild(previewEl);
      document.getElementById('nbpOverlay').addEventListener('click', () => previewEl.style.display = 'none');
      document.getElementById('nbpClose').addEventListener('click',   () => previewEl.style.display = 'none');
    }

    const btn     = document.getElementById('nbBtn');
    const icon    = document.getElementById('nbIcon');
    const badge   = document.getElementById('nbBadge');
    const panel   = document.getElementById('nbPanel');
    const list    = document.getElementById('nbList');
    const markAll = document.getElementById('nbMarkAll');

    let panelOpen = false;
    let lastUnread = -1;

    /* ── fetch ── */
    async function fetchNotifs() {
      try {
        let notifications, unread;

        if (IS_DEMO) {
          notifications = _demo;
          unread = _demo.filter(n => !n.is_read).length;
        } else {
          const res = await fetch('api/notifications.php');
          if (!res.ok) return;
          ({ notifications, unread } = await res.json());
        }

        if (lastUnread >= 0 && unread > lastUnread) {
          icon.classList.remove('nb-ring');
          void icon.offsetWidth;
          icon.classList.add('nb-ring');
        }
        lastUnread = unread;

        if (unread > 0) {
          badge.textContent = unread > 99 ? '99+' : unread;
          badge.style.display = '';
        } else {
          badge.style.display = 'none';
        }

        if (!notifications || !notifications.length) {
          list.innerHTML = '<div class="nb-empty">ไม่มีการแจ้งเตือน</div>';
          return;
        }

        list.innerHTML = notifications.map(n => `
          <div class="nb-item${n.is_read == 1 ? ' read' : ''}"
               data-nid="${n.id}" data-rid="${n.request_id || ''}">
            <span class="nb-dot"></span>
            <div class="nb-body">
              <div class="nb-msg">${esc(n.message)}</div>
              <div class="nb-time">${fmtDT(n.created_at)}</div>
            </div>
            <button class="nb-dismiss" data-nid="${n.id}" title="ลบออก">✕</button>
          </div>`).join('');

        list.querySelectorAll('.nb-item').forEach(el => {
          el.addEventListener('click', async () => {
            const nid = el.dataset.nid;
            const rid = el.dataset.rid;
            await markOne(nid);
            if (rid) showPreview(rid);
            else closePanel();
          });
        });

        list.querySelectorAll('.nb-dismiss').forEach(btn => {
          btn.addEventListener('click', async e => {
            e.stopPropagation();
            const nid = parseInt(btn.dataset.nid);
            if (IS_DEMO) {
              const idx = _demo.findIndex(n => n.id === nid);
              if (idx !== -1) _demo.splice(idx, 1);
            } else {
              await fetch('api/notifications_mark.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: nid, dismiss: true })
              });
            }
            await fetchNotifs();
          });
        });
      } catch (e) { /* non-critical */ }
    }

    /* ── mark ── */
    async function markOne(id) {
      if (IS_DEMO) {
        const n = _demo.find(n => n.id === parseInt(id));
        if (n) n.is_read = 1;
      } else {
        await fetch('api/notifications_mark.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: parseInt(id) })
        });
      }
      await fetchNotifs();
    }

    markAll.addEventListener('click', async () => {
      if (IS_DEMO) {
        _demo.forEach(n => n.is_read = 1);
      } else {
        await fetch('api/notifications_mark.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true })
        });
      }
      await fetchNotifs();
    });

    /* ── preview popup ── */
    async function showPreview(rid) {
      let d;
      if (IS_DEMO) {
        d = _demoDetail[parseInt(rid)];
        if (!d) return;
      } else {
        try {
          const res = await fetch(`api/request_get.php?id=${rid}`);
          if (!res.ok) { location.href = `form.html?id=${rid}`; return; }
          d = (await res.json()).request;
        } catch { location.href = `form.html?id=${rid}`; return; }
      }
      if (!d) return;

      document.getElementById('nbpContent').innerHTML = `
        <div class="nbp-header">
          <span class="nbp-recno">${esc(d.rec_no)}</span>
          <span class="badge ${d.status}">${STATUS_TH[d.status] || d.status}</span>
        </div>
        <div class="nbp-subject">${esc(d.subject || '(ไม่มีหัวข้อ)')}</div>
        <div class="nbp-grid">
          <div class="nbp-row"><span class="nbp-lbl">ผู้แจ้ง</span><span class="nbp-val">${esc(d.req_name || '—')}</span></div>
          <div class="nbp-row"><span class="nbp-lbl">ตำแหน่ง</span><span class="nbp-val">${esc(d.position || '—')}</span></div>
          <div class="nbp-row"><span class="nbp-lbl">แผนก/ส่วน</span><span class="nbp-val">${esc(d.section || '—')}</span></div>
          <div class="nbp-row"><span class="nbp-lbl">วันที่แจ้ง</span><span class="nbp-val">${fmtDate(d.req_date)}</span></div>
          <div class="nbp-row"><span class="nbp-lbl">กำหนดเสร็จ</span><span class="nbp-val">${fmtDate(d.due_date)}</span></div>
          <div class="nbp-row"><span class="nbp-lbl">ประเภทงาน</span><span class="nbp-val">${esc(d.work_type || '—')}</span></div>
        </div>
        ${d.detail ? `<div class="nbp-detail-wrap"><span class="nbp-lbl">รายละเอียด</span><p class="nbp-detail-txt">${esc(d.detail)}</p></div>` : ''}
        <div class="nbp-footer">
          <a class="btn primary nbp-link" href="form.html?id=${rid}">ดูรายละเอียดเต็ม →</a>
        </div>`;
      previewEl.style.display = '';
    }

    /* ── toggle panel ── */
    function openPanel()  { panel.style.display = ''; panelOpen = true; fetchNotifs(); }
    function closePanel() { panel.style.display = 'none'; panelOpen = false; }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      panelOpen ? closePanel() : openPanel();
    });
    document.addEventListener('click', e => {
      if (!mount.contains(e.target)) closePanel();
    });

    fetchNotifs();
    setInterval(fetchNotifs, POLL_MS);
  }

  window.NotifBell = { init };
})();
