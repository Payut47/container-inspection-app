/**
 * Container & Cargo Inspection App - Application Logic
 */

// Application State
const state = {
  currentId: null,
  checklist: {}, // { c1: { value: 'ดี', type: 'pass' }, ... }
  decision: '',  // 'รับ' | 'ไม่รับ'
  damageItems: [],
  photos: [],    // [ { id, dataUrl, category, timestamp } ]
};

// DOM Elements
const inspectDateInput = document.getElementById('inspectDate');
const btnToday = document.getElementById('btnToday');
const productTypeInput = document.getElementById('productType');
const truckTypeInput = document.getElementById('truckType');
const invoiceNoInput = document.getElementById('invoiceNo');
const containerNoInput = document.getElementById('containerNo');
const licensePlateInput = document.getElementById('licensePlate');
const sealNumberInput = document.getElementById('sealNumber');
const weldLocationInput = document.getElementById('weldLocation');

const startTimeInput = document.getElementById('startTime');
const finishTimeInput = document.getElementById('finishTime');
const btnNowStart = document.getElementById('btnNowStart');
const btnNowFinish = document.getElementById('btnNowFinish');

const receiverNameInput = document.getElementById('receiverName');
const supervisorNameInput = document.getElementById('supervisorName');

const btnAccept = document.getElementById('btnAccept');
const btnReject = document.getElementById('btnReject');
const btnQuickPassAll = document.getElementById('btnQuickPassAll');

const damageTableBody = document.getElementById('damageTableBody');
const noDamageMessage = document.getElementById('noDamageMessage');
const btnAddDamageRow = document.getElementById('btnAddDamageRow');

const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const photosGrid = document.getElementById('photosGrid');
const emptyPhotosPrompt = document.getElementById('emptyPhotosPrompt');

const btnSaveInspection = document.getElementById('btnSaveInspection');
const btnPrintReport = document.getElementById('btnPrintReport');
const btnDownloadPdf = document.getElementById('btnDownloadPdf');
const btnOpenEmailModal = document.getElementById('btnOpenEmailModal');
const btnCloseEmailModal = document.getElementById('btnCloseEmailModal');
const btnShareLine = document.getElementById('btnShareLine');
const btnNewForm = document.getElementById('btnNewForm');

// Email Modal Elements
const emailModal = document.getElementById('emailModal');
const emailTo = document.getElementById('emailTo');
const emailSubject = document.getElementById('emailSubject');
const emailBody = document.getElementById('emailBody');
const btnSendMailto = document.getElementById('btnSendMailto');
const btnSendGmailWeb = document.getElementById('btnSendGmailWeb');

// Report Preview Modal Elements
const reportPreviewModal = document.getElementById('reportPreviewModal');
const reportPreviewBody = document.getElementById('reportPreviewBody');
const btnPreviewPrint = document.getElementById('btnPreviewPrint');
const btnPreviewDownload = document.getElementById('btnPreviewDownload');
const btnCloseReportPreview = document.getElementById('btnCloseReportPreview');

// History Modal Elements
const btnOpenHistory = document.getElementById('btnOpenHistory');
const btnCloseHistory = document.getElementById('btnCloseHistory');
const btnRefreshHistory = document.getElementById('btnRefreshHistory');
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const historyCountBadge = document.getElementById('historyCount');
const searchHistoryInput = document.getElementById('searchHistoryInput');
const btnExportCsv = document.getElementById('btnExportCsv');

// Photo Modal Elements
const photoModal = document.getElementById('photoModal');
const modalImg = document.getElementById('modalImg');
const modalCaption = document.getElementById('modalCaption');
const btnClosePhotoModal = document.getElementById('btnClosePhotoModal');

// Canvas Elements
const canvas1 = document.getElementById('sigCanvas1');
const canvas2 = document.getElementById('sigCanvas2');
const btnClearSig1 = document.getElementById('btnClearSig1');
const btnClearSig2 = document.getElementById('btnClearSig2');
const printSig1 = document.getElementById('printSig1');
const printSig2 = document.getElementById('printSig2');

let pad1, pad2;

// --- 1. SIGNATURE PAD IMPLEMENTATION ---
class SimpleSignaturePad {
  constructor(canvas) {
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isDrawing = false;
    this.hasDrawn = false;
    this.init();
  }

  init() {
    this.resizeCanvas();
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#1e293b';

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.start(e.offsetX, e.offsetY));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e.offsetX, e.offsetY));
    window.addEventListener('mouseup', () => this.stop());

    // Touch events for Mobile/Tablet
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.start(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.draw(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => this.stop());

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    // Save image before resize if already drawn
    let tempImage = null;
    if (this.hasDrawn) {
      tempImage = this.canvas.toDataURL();
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#1e293b';

    if (tempImage) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = tempImage;
    }
  }

  start(x, y) {
    this.isDrawing = true;
    this.hasDrawn = true;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(x, y) {
    if (!this.isDrawing) return;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stop() {
    this.isDrawing = false;
  }

  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.hasDrawn = false;
  }

  toDataURL() {
    return this.hasDrawn ? this.canvas.toDataURL('image/png') : null;
  }

  fromDataURL(dataUrl) {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.clear();
      this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      this.hasDrawn = true;
    };
    img.src = dataUrl;
  }
}

// --- 2. INITIALIZATION ---
function initApp() {
  console.log('[App] Initializing Container Inspection App...');
  try {
    // Init signature pads
    if (canvas1) pad1 = new SimpleSignaturePad(canvas1);
    if (canvas2) pad2 = new SimpleSignaturePad(canvas2);

    // Set default date to today
    setTodayDate();

    // Attach Event Listeners
    setupEventListeners();

    // Load records saved in this browser.
    loadInspectionsData();

    // Add initial empty damage row if none
    renderDamageTable();
    console.log('[App] Initialized successfully. All button listeners attached.');
  } catch (err) {
    console.error('[App] Initialization error:', err);
  }
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  if (inspectDateInput) inspectDateInput.value = today;
}

function getCurrentTimeStr() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// --- 3. EVENT LISTENERS ---
function setupEventListeners() {
  // Date & Time quick buttons
  if (btnToday) btnToday.addEventListener('click', setTodayDate);
  if (btnNowStart) btnNowStart.addEventListener('click', () => { if (startTimeInput) startTimeInput.value = getCurrentTimeStr(); });
  if (btnNowFinish) btnNowFinish.addEventListener('click', () => { if (finishTimeInput) finishTimeInput.value = getCurrentTimeStr(); });

  // Checklist Option Buttons
  document.querySelectorAll('.checklist-row').forEach(row => {
    const rowId = row.dataset.id;
    const buttons = row.querySelectorAll('.check-opt');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        const type = btn.dataset.type; // 'pass' or 'fail'
        setChecklistChoice(rowId, val, type);
      });
    });
  });

  // Acceptance Decision Buttons
  if (btnAccept) btnAccept.addEventListener('click', () => setDecision('รับ'));
  if (btnReject) btnReject.addEventListener('click', () => setDecision('ไม่รับ'));

  // Quick Pass All
  if (btnQuickPassAll) btnQuickPassAll.addEventListener('click', handleQuickPassAll);

  // Damage items
  if (btnAddDamageRow) btnAddDamageRow.addEventListener('click', () => addDamageRow());

  // Photos
  if (cameraInput) cameraInput.addEventListener('change', (e) => handleImageUpload(e.target.files));
  if (galleryInput) galleryInput.addEventListener('change', (e) => handleImageUpload(e.target.files));

  // Signature Clears
  if (btnClearSig1) btnClearSig1.addEventListener('click', () => { if (pad1) pad1.clear(); });
  if (btnClearSig2) btnClearSig2.addEventListener('click', () => { if (pad2) pad2.clear(); });

  // Action Buttons
  if (btnSaveInspection) btnSaveInspection.addEventListener('click', saveInspection);
  if (btnPrintReport) btnPrintReport.addEventListener('click', openReportPreview);
  if (btnDownloadPdf) btnDownloadPdf.addEventListener('click', handleDownloadPdf);
  if (btnOpenEmailModal) btnOpenEmailModal.addEventListener('click', openEmailModal);
  if (btnCloseEmailModal) btnCloseEmailModal.addEventListener('click', () => { if (emailModal) emailModal.classList.add('hidden'); });
  if (btnSendMailto) btnSendMailto.addEventListener('click', sendMailto);
  if (btnSendGmailWeb) btnSendGmailWeb.addEventListener('click', sendGmailWeb);
  if (btnShareLine) btnShareLine.addEventListener('click', shareToLine);
  if (btnNewForm) btnNewForm.addEventListener('click', confirmResetForm);

  // Report Preview Modal Listeners
  if (btnCloseReportPreview) btnCloseReportPreview.addEventListener('click', () => { if (reportPreviewModal) reportPreviewModal.classList.add('hidden'); });
  if (btnPreviewPrint) btnPreviewPrint.addEventListener('click', handlePrintOfficialReport);
  if (btnPreviewDownload) btnPreviewDownload.addEventListener('click', handleDownloadPdf);

  // History Modal
  if (btnOpenHistory) btnOpenHistory.addEventListener('click', openHistoryModal);
  if (btnCloseHistory) btnCloseHistory.addEventListener('click', () => { if (historyModal) historyModal.classList.add('hidden'); });
  if (btnRefreshHistory) {
    btnRefreshHistory.addEventListener('click', async () => {
      const origHtml = btnRefreshHistory.innerHTML;
      btnRefreshHistory.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> โหลด...';
      btnRefreshHistory.disabled = true;
      await loadInspectionsData();
      renderHistoryList();
      btnRefreshHistory.innerHTML = origHtml;
      btnRefreshHistory.disabled = false;
    });
  }
  if (searchHistoryInput) searchHistoryInput.addEventListener('input', renderHistoryList);
  if (btnExportCsv) btnExportCsv.addEventListener('click', exportToCSV);

  // Photo Modal
  if (btnClosePhotoModal) btnClosePhotoModal.addEventListener('click', () => { if (photoModal) photoModal.classList.add('hidden'); });
  if (photoModal) {
    photoModal.addEventListener('click', (e) => {
      if (e.target === photoModal) photoModal.classList.add('hidden');
    });
  }
}

// --- 4. CHECKLIST LOGIC ---
function setChecklistChoice(rowId, value, type) {
  state.checklist[rowId] = { value, type };
  const row = document.querySelector(`.checklist-row[data-id="${rowId}"]`);
  if (!row) return;

  row.querySelectorAll('.check-opt').forEach(btn => {
    const box = btn.querySelector('.check-box');
    if (btn.dataset.value === value) {
      if (type === 'pass') {
        btn.classList.add('active-pass');
        btn.classList.remove('active-fail');
        if (box) box.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else {
        btn.classList.add('active-fail');
        btn.classList.remove('active-pass');
        if (box) box.innerHTML = '<i class="fa-solid fa-check"></i>';
      }
    } else {
      btn.classList.remove('active-pass', 'active-fail');
      if (box) box.innerHTML = '';
    }
  });

  // Auto-alert: if any item fails, suggest "ไม่รับ" or highlight
  checkOverallStatus();
}

function setDecision(decision) {
  state.decision = decision;
  if (decision === 'รับ') {
    btnAccept.classList.add('bg-emerald-600', 'text-white', 'shadow-md');
    btnAccept.classList.remove('bg-white', 'text-emerald-700');
    btnReject.classList.remove('bg-red-600', 'text-white', 'shadow-md');
    btnReject.classList.add('bg-white', 'text-red-700');
  } else if (decision === 'ไม่รับ') {
    btnReject.classList.add('bg-red-600', 'text-white', 'shadow-md');
    btnReject.classList.remove('bg-white', 'text-red-700');
    btnAccept.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
    btnAccept.classList.add('bg-white', 'text-emerald-700');
  }
}

function handleQuickPassAll() {
  const defaults = {
    c1: 'ดี',
    c2: 'แน่น',
    c3: 'ดี',
    c4: 'แน่น',
    c5: 'ดี',
    c6: 'ไม่มี',
    c7: 'ไม่มี',
    c8: 'ไม่มี',
    c9: 'ไม่มี',
    c10: 'ไม่มี',
    c11: 'ไม่มี',
    c12: 'เหมาะสม',
    c13: 'ดี',
    c14: 'ดี'
  };

  Object.entries(defaults).forEach(([id, val]) => {
    setChecklistChoice(id, val, 'pass');
  });

  setDecision('รับ');
}

function checkOverallStatus() {
  // If any fail exists and decision not set, notify subtle indicator
  const hasFail = Object.values(state.checklist).some(item => item.type === 'fail');
  if (hasFail && !state.decision) {
    setDecision('ไม่รับ');
  }
}

// --- 5. DAMAGE ITEMS MANAGEMENT ---
function addDamageRow(code = '', cause = '', qty = '') {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 4);
  state.damageItems.push({ id: newId, code, cause, qty });
  renderDamageTable();
}

function removeDamageRow(id) {
  state.damageItems = state.damageItems.filter(item => item.id !== id);
  renderDamageTable();
}

function updateDamageItem(id, field, value) {
  const item = state.damageItems.find(i => i.id === id);
  if (item) {
    item[field] = value;
  }
}

function renderDamageTable() {
  damageTableBody.innerHTML = '';
  if (state.damageItems.length === 0) {
    noDamageMessage.classList.remove('hidden');
    return;
  }
  noDamageMessage.classList.add('hidden');

  state.damageItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="p-2 text-center text-xs font-semibold text-slate-500">${index + 1}</td>
      <td class="p-2">
        <input type="text" value="${escapeHtml(item.code)}" placeholder="รหัสสินค้า" 
          onchange="updateDamageItem('${item.id}', 'code', this.value)"
          class="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500">
      </td>
      <td class="p-2">
        <input type="text" value="${escapeHtml(item.cause)}" placeholder="สาเหตุความเสียหาย เช่น กล่องบุบ ฉีกขาด" 
          onchange="updateDamageItem('${item.id}', 'cause', this.value)"
          class="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500">
      </td>
      <td class="p-2">
        <input type="text" value="${escapeHtml(item.qty)}" placeholder="เช่น 5 ลัง" 
          onchange="updateDamageItem('${item.id}', 'qty', this.value)"
          class="w-full border border-slate-300 rounded px-2 py-1 text-xs text-center focus:ring-1 focus:ring-blue-500">
      </td>
      <td class="p-2 text-center no-print">
        <button type="button" onclick="removeDamageRow('${item.id}')" class="text-red-500 hover:text-red-700 text-xs px-2 py-1">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    damageTableBody.appendChild(tr);
  });
}

// --- 6. PHOTO CAPTURE & COMPRESSION ---
async function handleImageUpload(files) {
  if (!files || files.length === 0) return;

  for (const file of Array.from(files)) {
    try {
      const compressedDataUrl = await compressImage(file, 1200, 0.75);
      const photoObj = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        dataUrl: compressedDataUrl,
        category: guessPhotoCategory(),
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      state.photos.push(photoObj);
    } catch (err) {
      console.error('Error reading image:', err);
    }
  }

  renderPhotosGrid();
}

function guessPhotoCategory() {
  const count = state.photos.length;
  if (count === 0) return 'หมายเลขตู้ / ป้ายทะเบียน';
  if (count === 1) return 'ซีลล็อคตู้ (Seal Number)';
  if (count === 2) return 'สภาพตู้สินค้า';
  if (state.damageItems.length > 0) return 'สินค้าเสียหาย';
  return 'เอกสาร Invoice แนบ';
}

function compressImage(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

function updatePhotoCategory(id, category) {
  const p = state.photos.find(photo => photo.id === id);
  if (p) p.category = category;
}

function removePhoto(id) {
  state.photos = state.photos.filter(p => p.id !== id);
  renderPhotosGrid();
}

function openPhotoPreview(id) {
  const p = state.photos.find(photo => photo.id === id);
  if (!p) return;
  modalImg.src = p.dataUrl;
  modalCaption.textContent = `${p.category} (${p.timestamp})`;
  photoModal.classList.remove('hidden');
}

function renderPhotosGrid() {
  photosGrid.innerHTML = '';
  if (state.photos.length === 0) {
    emptyPhotosPrompt.classList.remove('hidden');
    return;
  }
  emptyPhotosPrompt.classList.add('hidden');

  const categories = [
    'หมายเลขตู้ / ป้ายทะเบียน',
    'ซีลล็อคตู้ (Seal Number)',
    'สภาพตู้ภายนอก-ใน',
    'สินค้าเสียหาย',
    'สำเนาใบ Invoice'
  ];

  state.photos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'photo-card bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col';
    
    let optionsHtml = categories.map(cat => 
      `<option value="${cat}" ${photo.category === cat ? 'selected' : ''}>${cat}</option>`
    ).join('');

    card.innerHTML = `
      <div class="relative aspect-video sm:aspect-square bg-black/5 overflow-hidden group cursor-pointer" onclick="openPhotoPreview('${photo.id}')">
        <img src="${photo.dataUrl}" class="w-full h-full object-cover print-photo-img" alt="${photo.category}">
        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1">
          <i class="fa-solid fa-magnifying-glass-plus text-base"></i> ดูภาพใหญ่
        </div>
        <button type="button" onclick="event.stopPropagation(); removePhoto('${photo.id}')" class="no-print absolute top-1.5 right-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
      <div class="p-1.5 bg-white border-t border-slate-100 flex-1 flex flex-col justify-between">
        <select onchange="updatePhotoCategory('${photo.id}', this.value)" class="no-print w-full text-[11px] font-medium border border-slate-200 rounded px-1 py-0.5 text-slate-700 focus:outline-none">
          ${optionsHtml}
        </select>
        <span class="print-only text-[10px] font-bold text-slate-800 text-center block">${photo.category}</span>
        <span class="text-[10px] text-slate-400 text-right mt-1 no-print">${photo.timestamp}</span>
      </div>
    `;
    photosGrid.appendChild(card);
  });
}

// --- 7. BROWSER LOCAL STORAGE ---
const STORAGE_KEY = 'container_inspections_records_v1';
let cachedRecords = [];

function getLocalInspections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('LocalStorage load error:', e);
    return [];
  }
}

function loadInspectionsData() {
  cachedRecords = getLocalInspections();
  updateHistoryBadge();
  return cachedRecords;
}

function getSavedInspections() {
  return cachedRecords;
}

async function saveInspection() {
  if (!containerNoInput.value.trim()) {
    alert('กรุณากรอก "หมายเลขตู้ (Container No.)"');
    containerNoInput.focus();
    return;
  }
  if (!licensePlateInput.value.trim()) {
    alert('กรุณากรอก "ทะเบียนรถ"');
    licensePlateInput.focus();
    return;
  }
  if (!sealNumberInput.value.trim()) {
    alert('กรุณากรอก "Seal Number"');
    sealNumberInput.focus();
    return;
  }

  const origSaveHtml = btnSaveInspection.innerHTML;
  btnSaveInspection.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกลงเครื่อง...';
  btnSaveInspection.disabled = true;

  const inspectionData = {
    id: state.currentId || 'INS-' + Date.now(),
    updatedAt: new Date().toISOString(),
    general: {
      date: inspectDateInput.value,
      productType: productTypeInput.value,
      truckType: truckTypeInput.value,
      invoiceNo: invoiceNoInput.value,
      containerNo: containerNoInput.value.toUpperCase().trim(),
      licensePlate: licensePlateInput.value.trim(),
      sealNumber: sealNumberInput.value.trim(),
      weldLocation: weldLocationInput.value.trim()
    },
    checklist: state.checklist,
    decision: state.decision,
    damageItems: state.damageItems,
    photos: state.photos,
    times: {
      start: startTimeInput.value,
      finish: finishTimeInput.value
    },
    signatures: {
      receiverSig: pad1.toDataURL(),
      receiverName: receiverNameInput.value.trim(),
      supervisorSig: pad2.toDataURL(),
      supervisorName: supervisorNameInput.value.trim()
    }
  };

  // Update local memory and persist it in this browser.
  const existingIndex = cachedRecords.findIndex(r => r.id === inspectionData.id);
  if (existingIndex >= 0) {
    cachedRecords[existingIndex] = inspectionData;
  } else {
    cachedRecords.unshift(inspectionData);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedRecords));
  } catch (e) {
    console.warn('LocalStorage quota limit reached:', e);
  }

  state.currentId = inspectionData.id;
  updateHistoryBadge();

  btnSaveInspection.innerHTML = origSaveHtml;
  btnSaveInspection.disabled = false;

  alert('✅ บันทึกข้อมูลลงในเบราว์เซอร์เครื่องนี้เรียบร้อยแล้ว');
}

function updateHistoryBadge() {
  const records = getSavedInspections();
  if (historyCountBadge) {
    historyCountBadge.textContent = records.length;
  }
}

function openHistoryModal() {
  historyModal.classList.remove('hidden');
  historyList.innerHTML = `
    <div class="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
      <i class="fa-solid fa-spinner fa-spin text-blue-600 text-base"></i>
      <span>กำลังโหลดข้อมูลจากเครื่องนี้...</span>
    </div>`;
  loadInspectionsData();
  renderHistoryList();
}

function renderHistoryList() {
  const records = getSavedInspections();
  const query = (searchHistoryInput.value || '').toLowerCase().trim();

  const filtered = records.filter(r => {
    if (!query) return true;
    const g = r.general || {};
    return (
      (g.containerNo || '').toLowerCase().includes(query) ||
      (g.licensePlate || '').toLowerCase().includes(query) ||
      (g.sealNumber || '').toLowerCase().includes(query) ||
      (g.invoiceNo || '').toLowerCase().includes(query) ||
      (g.date || '').includes(query)
    );
  });

  historyList.innerHTML = '';
  if (filtered.length === 0) {
    historyList.innerHTML = `
      <div class="py-10 text-center text-slate-400 text-xs">
        <i class="fa-solid fa-inbox text-3xl text-slate-300 block mb-2"></i>
        ไม่พบประวัติการตรวจรับในเบราว์เซอร์นี้
      </div>`;
    return;
  }

  filtered.forEach(record => {
    const item = document.createElement('div');
    item.className = 'py-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors px-2 rounded-lg';
    
    const decisionBadge = record.decision === 'รับ' 
      ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">รับ</span>'
      : record.decision === 'ไม่รับ'
      ? '<span class="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ไม่รับ</span>'
      : '<span class="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">ยังไม่ระบุ</span>';

    const g = record.general || {};
    item.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm text-slate-800">${escapeHtml(g.containerNo || 'ไม่ระบุเลขตู้')}</span>
          ${decisionBadge}
        </div>
        <div class="text-xs text-slate-500 mt-0.5">
          วันที่: ${escapeHtml(g.date || '-')} | ทะเบียน: ${escapeHtml(g.licensePlate || '-')} | Seal: ${escapeHtml(g.sealNumber || '-')}
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
          <span><i class="fa-solid fa-camera"></i> ${record.photos?.length || 0} รูป</span>
          <span><i class="fa-solid fa-box-open"></i> เสียหาย ${record.damageItems?.length || 0} รายการ</span>
          ${record.updatedAt ? `<span><i class="fa-solid fa-clock"></i> ${new Date(record.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button type="button" onclick="loadInspectionRecord('${record.id}')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors">
          <i class="fa-solid fa-folder-open"></i> โหลด
        </button>
        <button type="button" onclick="deleteInspectionRecord('${record.id}')" class="text-red-500 hover:text-red-700 text-xs p-1.5 transition-colors" title="ลบข้อมูล">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function loadInspectionRecord(id) {
  const records = getSavedInspections();
  const record = records.find(r => r.id === id);
  if (!record) return;

  const containerName = record.general?.containerNo || 'ตู้สินค้านี้';
  if (!confirm(`ต้องการโหลดข้อมูลการตรวจตู้ "${containerName}" ใช่หรือไม่?`)) return;

  state.currentId = record.id;
  const g = record.general || {};
  inspectDateInput.value = g.date || '';
  productTypeInput.value = g.productType || '';
  truckTypeInput.value = g.truckType || '';
  invoiceNoInput.value = g.invoiceNo || '';
  containerNoInput.value = g.containerNo || '';
  licensePlateInput.value = g.licensePlate || '';
  sealNumberInput.value = g.sealNumber || '';
  weldLocationInput.value = g.weldLocation || '';

  startTimeInput.value = record.times?.start || '';
  finishTimeInput.value = record.times?.finish || '';

  receiverNameInput.value = record.signatures?.receiverName || '';
  supervisorNameInput.value = record.signatures?.supervisorName || '';

  // Checklist
  state.checklist = record.checklist || {};
  document.querySelectorAll('.checklist-row .check-opt').forEach(btn => {
    btn.classList.remove('active-pass', 'active-fail');
    const box = btn.querySelector('.check-box');
    if (box) box.innerHTML = '';
  });
  Object.entries(state.checklist).forEach(([rowId, item]) => {
    if (item && item.value && item.type) {
      setChecklistChoice(rowId, item.value, item.type);
    }
  });

  // Decision
  setDecision(record.decision || '');

  // Damage
  state.damageItems = record.damageItems || [];
  renderDamageTable();

  // Photos
  state.photos = record.photos || [];
  renderPhotosGrid();

  // Signatures
  pad1.clear();
  if (record.signatures?.receiverSig) {
    pad1.fromDataURL(record.signatures.receiverSig);
  }
  pad2.clear();
  if (record.signatures?.supervisorSig) {
    pad2.fromDataURL(record.signatures.supervisorSig);
  }

  historyModal.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteInspectionRecord(id) {
  const records = getSavedInspections();
  const record = records.find(r => r.id === id);
  const containerName = record?.general?.containerNo || 'รายการนี้';

  if (!confirm(`ยืนยันการลบประวัติการตรวจตู้ "${containerName}" ออกจากเบราว์เซอร์นี้ใช่หรือไม่?`)) return;

  cachedRecords = cachedRecords.filter(r => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedRecords));
  } catch (e) {}

  updateHistoryBadge();
  renderHistoryList();
}

function confirmResetForm() {
  if (confirm('คุณต้องการล้างข้อมูลเพื่อเริ่มตรวจตู้ใหม่ใช่หรือไม่?')) {
    resetForm();
  }
}

function resetForm() {
  state.currentId = null;
  state.checklist = {};
  state.decision = '';
  state.damageItems = [];
  state.photos = [];

  document.getElementById('inspectionForm').reset();
  setTodayDate();

  document.querySelectorAll('.checklist-row .check-opt').forEach(btn => {
    btn.classList.remove('active-pass', 'active-fail');
    const box = btn.querySelector('.check-box');
    if (box) box.innerHTML = '';
  });

  btnAccept.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
  btnAccept.classList.add('bg-white', 'text-emerald-700');
  btnReject.classList.remove('bg-red-600', 'text-white', 'shadow-md');
  btnReject.classList.add('bg-white', 'text-red-700');

  pad1.clear();
  pad2.clear();
  renderDamageTable();
  renderPhotosGrid();
}

// --- 8. OFFICIAL REPORT GENERATOR & PREVIEW & PDF EXPORT ---
function generateOfficialReportBody() {
  const c = state.checklist;
  const general = {
    date: inspectDateInput.value || '-',
    productType: productTypeInput.value || '-',
    truckType: truckTypeInput.value || '-',
    invoiceNo: invoiceNoInput.value || '-',
    containerNo: containerNoInput.value.toUpperCase().trim() || '-',
    licensePlate: licensePlateInput.value.trim() || '-',
    sealNumber: sealNumberInput.value.trim() || '-',
    weldLocation: weldLocationInput.value.trim() || ''
  };

  const check = (id, expectedVal) => {
    return c[id]?.value === expectedVal ? '☑' : '☐';
  };

  // Build Damage Rows HTML
  let damageRowsHtml = '';
  if (state.damageItems.length > 0) {
    state.damageItems.forEach((item, idx) => {
      damageRowsHtml += `
        <tr>
          <td style="border:1px solid #000; padding:4px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:4px;">${escapeHtml(item.code || '-')}</td>
          <td style="border:1px solid #000; padding:4px;">${escapeHtml(item.cause || '-')}</td>
          <td style="border:1px solid #000; padding:4px; text-align:center;">${escapeHtml(item.qty || '-')}</td>
        </tr>
      `;
    });
  } else {
    damageRowsHtml = `
      <tr>
        <td colspan="4" style="border:1px solid #000; padding:6px; text-align:center; color:#666;">(ไม่มีรายการสินค้าเสียหาย / สินค้าอยู่ในสภาพสมบูรณ์)</td>
      </tr>
    `;
  }

  // Signatures
  const sig1 = pad1.toDataURL();
  const sig2 = pad2.toDataURL();

  const sig1Html = sig1 
    ? `<img src="${sig1}" style="max-height:55px; max-width:180px; object-fit:contain; display:inline-block;" alt="ลายเซ็นผู้รับสินค้า">` 
    : `<div style="height:45px; border-bottom:1px dotted #888; width:180px; margin:0 auto;"></div>`;

  const sig2Html = sig2 
    ? `<img src="${sig2}" style="max-height:55px; max-width:180px; object-fit:contain; display:inline-block;" alt="ลายเซ็น Supervisor">` 
    : `<div style="height:45px; border-bottom:1px dotted #888; width:180px; margin:0 auto;"></div>`;

  // Photos
  let photosSectionHtml = '';
  if (state.photos.length > 0) {
    let photoCards = state.photos.map(p => `
      <div style="display:inline-block; vertical-align:top; width:48%; margin:1%; border:1px solid #ccc; padding:4px; box-sizing:border-box; text-align:center; page-break-inside:avoid;">
        <img src="${p.dataUrl}" style="width:100%; height:130px; object-fit:contain; display:block; margin:0 auto;" alt="${escapeHtml(p.category)}">
        <div style="font-size:9pt; font-weight:bold; margin-top:4px; color:#333;">${escapeHtml(p.category)}</div>
      </div>
    `).join('');

    photosSectionHtml = `
      <div style="page-break-before:always; margin-top:20px;">
        <div style="font-size:12pt; font-weight:bold; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:8px;">
          ภาพถ่ายหน้างาน & เอกสารแนบ (${state.photos.length} ภาพ)
        </div>
        <div>
          ${photoCards}
        </div>
      </div>
    `;
  }

  return `
  <!-- Document Header -->
  <div style="text-align:center; font-weight:bold; font-size:14pt; margin-bottom:4px; text-decoration: underline; color:#000;">
    การตรวจสอบตู้ขนส่งสินค้าและสภาพสินค้า
  </div>

  <table style="width:100%; border-collapse:collapse; margin-bottom:6px; font-size:10pt; color:#000;">
    <tr>
      <td style="width:65%;"><strong>ชนิดสินค้า:</strong> ${escapeHtml(general.productType)}</td>
      <td style="width:35%;"><strong>วันที่:</strong> ${escapeHtml(general.date)}</td>
    </tr>
    <tr>
      <td><strong>ประเภทรถ:</strong> ${escapeHtml(general.truckType)}</td>
      <td><strong>เลขที่เอกสาร/invoice:</strong> ${escapeHtml(general.invoiceNo)}</td>
    </tr>
    <tr>
      <td><strong>หมายเลขตู้:</strong> <span style="font-weight:bold; font-size:11pt;">${escapeHtml(general.containerNo)}</span></td>
      <td><strong>ทะเบียนรถ:</strong> ${escapeHtml(general.licensePlate)}</td>
    </tr>
    <tr>
      <td colspan="2"><strong>Seal number:</strong> <span style="font-weight:bold; font-size:11pt;">${escapeHtml(general.sealNumber)}</span></td>
    </tr>
  </table>

  <!-- 14 Checkpoints Table -->
  <table style="width:100%; border-collapse:collapse; margin-bottom:6px; color:#000; border:1px solid #000;">
    <thead>
      <tr style="background:#f1f5f9;">
        <th style="border:1px solid #000; text-align:left; width:65%; padding:4px 6px; font-size:9.5pt;">รายการตรวจสอบ</th>
        <th style="border:1px solid #000; text-align:center; width:35%; padding:4px 6px; font-size:9.5pt;">ผลการตรวจ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">1. การตรวจสอบตู้สินค้า</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c1', 'ดี')}</span> ดี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c1', 'ไม่ดี')}</span> ไม่ดี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">2. ประตูตู้ขนส่งสินค้า (ไม่บุบงอ)</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c2', 'แน่น')}</span> แน่น &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c2', 'ไม่แน่น')}</span> ไม่แน่น</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">3. ประตูต้นขนส่งสินค้า</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c3', 'ดี')}</span> ดี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c3', 'ไม่ดี')}</span> ไม่ดี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">4. ยางขอบประตูไม่เสียหาย</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c4', 'แน่น')}</span> แน่น &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c4', 'ไม่แน่น')}</span> ไม่แน่น</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">5. เพดาน พื้นและผนัง</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c5', 'ดี')}</span> ดี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c5', 'ไม่ดี')}</span> ไม่ดี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">6. สภาพภายนอก-ใน สีและสนิม</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c6', 'ไม่มี')}</span> ไม่มี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c6', 'มี')}</span> มี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">7. พื้นตู้ขนสินค้า ฝุ่นผงและสนิม</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c7', 'ไม่มี')}</span> ไม่มี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c7', 'มี')}</span> มี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">8. น้ำเกาะผนังและเพดาน (ความชื้น)</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c8', 'ไม่มี')}</span> ไม่มี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c8', 'มี')}</span> มี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">9. แมลง หนู และร่องรอยของแมลงและหนู</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c9', 'ไม่มี')}</span> ไม่มี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c9', 'มี')}</span> มี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">10. กลิ่นภายในตู้</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c10', 'ไม่มี')}</span> ไม่มี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c10', 'มี')}</span> มี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">11. การซ่อมตู้ รอยเชื่อม ${general.weldLocation ? `(ตำแหน่ง: ${escapeHtml(general.weldLocation)})` : ''}</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c11', 'ไม่มี')}</span> ไม่มี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c11', 'มี')}</span> มี</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">12. อุณภูมิภายในตู้</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c12', 'เหมาะสม')}</span> เหมาะสม &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c12', 'ไม่เหมาะสม')}</span> ไม่เหมาะสม</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">13. สภาพพาเลท (Pallet)</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c13', 'ดี')}</span> ดี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c13', 'เสีย')}</span> เสีย</td>
      </tr>
      <tr>
        <td style="border:1px solid #000; padding:4px 6px; font-size:9.5pt;">14. สภาพสินค้า</td>
        <td style="border:1px solid #000; padding:4px 8px; text-align:right; font-size:10pt;"><span style="font-size:11pt; font-weight:bold;">${check('c14', 'ดี')}</span> ดี &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:11pt; font-weight:bold;">${check('c14', 'เสีย')}</span> เสีย</td>
      </tr>
      <tr style="background:#f8fafc; font-weight:bold;">
        <td style="border:1px solid #000; padding:5px 6px; font-size:10pt;">สรุป: ยอมรับหรือไม่</td>
        <td style="border:1px solid #000; padding:5px 8px; text-align:right; font-size:10.5pt;">
          <span style="font-size:12pt; font-weight:bold;">${state.decision === 'รับ' ? '☑' : '☐'}</span> รับ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style="font-size:12pt; font-weight:bold;">${state.decision === 'ไม่รับ' ? '☑' : '☐'}</span> ไม่รับ
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Damage Cargo Table -->
  <div style="font-weight:bold; margin-top:8px; margin-bottom:3px; font-size:10pt; color:#000;">รายละเอียดสินค้าเสียหาย</div>
  <table style="width:100%; border-collapse:collapse; margin-bottom:6px; color:#000; border:1px solid #000;">
    <thead>
      <tr style="background:#f1f5f9;">
        <th style="border:1px solid #000; width:10%; text-align:center; padding:4px; font-size:9.5pt;">ลำดับ</th>
        <th style="border:1px solid #000; width:35%; text-align:left; padding:4px; font-size:9.5pt;">รหัสสินค้า</th>
        <th style="border:1px solid #000; width:40%; text-align:left; padding:4px; font-size:9.5pt;">สาเหตุ</th>
        <th style="border:1px solid #000; width:15%; text-align:center; padding:4px; font-size:9.5pt;">จำนวน</th>
      </tr>
    </thead>
    <tbody>
      ${damageRowsHtml}
    </tbody>
  </table>

  <!-- Unloading Times -->
  <table style="width:100%; border-collapse:collapse; margin-top:6px; margin-bottom:12px; font-size:9.5pt; color:#000;">
    <tr>
      <td style="width:50%;"><strong>เวลาเริ่มลง:</strong> ${startTimeInput.value || '.................'}</td>
      <td style="width:50%;"><strong>เวลาแล้วเสร็จ:</strong> ${finishTimeInput.value || '.................'}</td>
    </tr>
  </table>

  <!-- Signatures Section -->
  <table style="width:100%; border-collapse:collapse; margin-top:10px; margin-bottom:8px; text-align:center; color:#000;">
    <tr>
      <td style="width:50%; vertical-align:top; padding:0 20px;">
        ${sig1Html}
        <div style="border-top:1px solid #333; margin-top:4px; padding-top:4px; font-weight:bold;">
          (${receiverNameInput.value.trim() || '...................................................'})
        </div>
        <div style="font-size:9pt; color:#444;">ผู้รับสินค้า</div>
      </td>
      <td style="width:50%; vertical-align:top; padding:0 20px;">
        ${sig2Html}
        <div style="border-top:1px solid #333; margin-top:4px; padding-top:4px; font-weight:bold;">
          (${supervisorNameInput.value.trim() || '...................................................'})
        </div>
        <div style="font-size:9pt; color:#444;">warehouse supervisor</div>
      </td>
    </tr>
  </table>

  <!-- Footer Note -->
  <div style="font-size:8.5pt; color:#b91c1c; font-weight:bold; border-top:1px dashed #999; padding-top:4px; margin-top:6px;">
    หมายเหตุ: สินค้าเสียหายจะต้องถ่ายสำเนาใบInvoiceแนบด้วยทุกครั้ง
  </div>

  <!-- Photos Attachment (if any) -->
  ${photosSectionHtml}
  `;
}

function generateOfficialReportHtml(forPrintWindow = false) {
  const general = {
    containerNo: containerNoInput.value.toUpperCase().trim() || '-'
  };
  const bodyContent = generateOfficialReportBody();

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานตรวจตู้สินค้า_${general.containerNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    body {
      font-family: 'Sarabun', Arial, sans-serif;
      font-size: 10pt;
      color: #000000;
      line-height: 1.35;
      margin: 0;
      padding: ${forPrintWindow ? '15mm' : '0'};
      background: #ffffff;
    }
    .print-btn-bar {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ffffff;
      padding: 6px 12px;
      border: 1px solid #ccc;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      border-radius: 6px;
      display: flex;
      gap: 8px;
      z-index: 9999;
    }
    @media print {
      .print-btn-bar { display: none !important; }
      body { padding: 0 !important; }
      @page { size: A4 portrait; margin: 10mm; }
    }
  </style>
</head>
<body>
  ${forPrintWindow ? `
  <div class="print-btn-bar">
    <button onclick="window.print()" style="background:#16a34a; color:#fff; border:none; padding:6px 14px; font-weight:bold; border-radius:4px; cursor:pointer;">
      🖨️ สั่งพิมพ์หน้านี้ / บันทึก PDF
    </button>
    <button onclick="window.close()" style="background:#64748b; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
      ปิดหน้าต่าง
    </button>
  </div>
  ` : ''}

  ${bodyContent}

</body>
</html>
  `;
}

// 1. Report Preview Modal (เปิดดูตัวอย่างบนหน้าจอได้ทันที 100%)
function openReportPreview() {
  reportPreviewBody.innerHTML = generateOfficialReportBody();
  reportPreviewModal.classList.remove('hidden');
}

// 1b. Print using the SAME formatted report as the Preview / PDF
//     (opens a clean print window built from generateOfficialReportHtml,
//      instead of relying on window.print() on the live page, which used
//      to print the raw form layout instead of the official report format)
function handlePrintOfficialReport() {
  const printWindow = window.open('', '_blank', 'width=900,height=1200');

  if (!printWindow) {
    alert('⚠️ เบราว์เซอร์บล็อกการเปิดหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้ แล้วลองอีกครั้ง');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(generateOfficialReportHtml(true));
  printWindow.document.close();

  // Wait for fonts/images/layout in the new window before triggering print
  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 350);
  } else {
    printWindow.addEventListener('load', () => setTimeout(triggerPrint, 350));
  }
}

// 2. Direct PDF Download using html2pdf
function handleDownloadPdf() {
  if (typeof html2pdf === 'undefined') {
    alert('กำลังโหลดโมดูล PDF กรุณารอสักครู่แล้วกดใหม่อีกครั้ง');
    return;
  }

  const rawContainer = containerNoInput.value.toUpperCase().trim() || 'NO-CONTAINER';
  const containerNo = rawContainer.replace(/[^A-Z0-9_-]/g, '_');
  const date = inspectDateInput.value || new Date().toISOString().split('T')[0];

  // Create temporary container with valid clean HTML
  const reportContainer = document.createElement('div');
  reportContainer.innerHTML = generateOfficialReportBody();
  reportContainer.style.width = '750px';
  reportContainer.style.padding = '16px';
  reportContainer.style.background = '#ffffff';
  reportContainer.style.color = '#000000';
  reportContainer.style.fontFamily = "'Sarabun', Arial, sans-serif";
  reportContainer.style.boxSizing = 'border-box';
  document.body.appendChild(reportContainer);

  const safeFilename = `Inspection_${containerNo}_${date}.pdf`;

  const opt = {
    margin: [6, 6, 6, 6],
    filename: safeFilename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(reportContainer).toPdf().get('pdf').then(function(pdf) {
    // 1. Save file to disk
    pdf.save();

    // 2. Open in new tab so user can VIEW directly
    try {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch(e) {
      console.log('Blob view error:', e);
    }

    document.body.removeChild(reportContainer);
    alert(`✅ บันทึกและเปิดไฟล์ PDF เรียบร้อยแล้ว!\n(ชื่อไฟล์: ${safeFilename})`);
  }).catch(function(err) {
    console.error('PDF Generation Error:', err);
    if (document.body.contains(reportContainer)) {
      document.body.removeChild(reportContainer);
    }
    alert('⚠️ ขออภัย ไม่สามารถสร้างไฟล์ PDF ได้ แนะนำให้กดปุ่ม "พิมพ์" แล้วเลือกดูรายงานบนหน้าจอแทนครับ');
  });
}

// 3. Email Features
function openEmailModal() {
  const containerNo = containerNoInput.value.toUpperCase().trim() || '-';
  const plate = licensePlateInput.value.trim() || '-';
  const seal = sealNumberInput.value.trim() || '-';
  const date = inspectDateInput.value || '-';
  const decision = state.decision || 'ยังไม่ระบุ';
  const damageCount = state.damageItems.length;

  let damageSummaryText = '';
  if (damageCount > 0) {
    damageSummaryText = `\n[รายการสินค้าเสียหาย ${damageCount} รายการ]\n` +
      state.damageItems.map((item, idx) => `  ${idx + 1}. รหัส: ${item.code || '-'} | สาเหตุ: ${item.cause || '-'} | จำนวน: ${item.qty || '-'}`).join('\n');
  } else {
    damageSummaryText = '\n[สภาพสินค้า: สมบูรณ์ ไม่พบความเสียหาย]';
  }

  const body = `เรียน ทีมงานที่เกี่ยวข้อง

ขอส่งรายงานผลการตรวจสอบตู้ขนส่งสินค้าและสภาพสินค้า:

- วันที่ตรวจรับ: ${date}
- หมายเลขตู้ (Container): ${containerNo}
- ทะเบียนรถ: ${plate}
- หมายเลขซีล (Seal Number): ${seal}
- ชนิดสินค้า: ${productTypeInput.value || '-'}
- ประเภทรถ: ${truckTypeInput.value || '-'}
- เลขที่เอกสาร / Invoice: ${invoiceNoInput.value || '-'}
- เวลาเริ่มลง - แล้วเสร็จ: ${startTimeInput.value || '-'} ถึง ${finishTimeInput.value || '-'}
---------------------------------------------
สรุปผลการพิจารณา: ${decision.toUpperCase()}
${damageSummaryText}
---------------------------------------------
- ผู้รับสินค้า: ${receiverNameInput.value.trim() || '-'}
- Warehouse Supervisor: ${supervisorNameInput.value.trim() || '-'}
- ภาพถ่ายแนบ: ${state.photos.length} รูป

(โปรดดูไฟล์รายงานฉบับเต็มและภาพถ่ายในไฟล์ PDF แนบ)`;

  emailSubject.value = `[รายงานตรวจตู้สินค้า] เลขตู้: ${containerNo} | ผล: ${decision}`;
  emailBody.value = body;
  emailModal.classList.remove('hidden');
}

function sendMailto() {
  const to = emailTo.value.trim();
  const subject = emailSubject.value.trim();
  const body = emailBody.value.trim();
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function sendGmailWeb() {
  const to = emailTo.value.trim();
  const subject = emailSubject.value.trim();
  const body = emailBody.value.trim();
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
}

// --- 9. SHARE TO LINE / CLIPBOARD ---
function shareToLine() {
  const containerNo = containerNoInput.value.trim() || '-';
  const plate = licensePlateInput.value.trim() || '-';
  const seal = sealNumberInput.value.trim() || '-';
  const date = inspectDateInput.value || '-';
  const decision = state.decision ? `${state.decision} ${state.decision === 'รับ' ? '✅' : '❌'}` : 'ยังไม่ระบุ';
  const damageCount = state.damageItems.length;

  let damageSummary = '';
  if (damageCount > 0) {
    damageSummary = `\n⚠️ สินค้าเสียหาย: ${damageCount} รายการ\n` + 
      state.damageItems.map((item, idx) => `  ${idx + 1}. รหัส ${item.code || '-'} (${item.cause || '-'}) จำนวน ${item.qty || '-'}`).join('\n');
  } else {
    damageSummary = '\n📦 สินค้าสภาพสมบูรณ์ ไม่มีความเสียหาย';
  }

  const text = `📋 รายงานตรวจรับตู้สินค้า
📅 วันที่: ${date}
🚚 ตู้: ${containerNo}
🚛 ทะเบียน: ${plate}
🔒 Seal No: ${seal}
⏱️ เวลา: ${startTimeInput.value || '-'} ถึง ${finishTimeInput.value || '-'}
-----------------
🔍 ผลการตรวจรับ: ${decision}${damageSummary}
-----------------
ผู้รับสินค้า: ${receiverNameInput.value.trim() || '-'}
Supervisor: ${supervisorNameInput.value.trim() || '-'}`;

  navigator.clipboard.writeText(text).then(() => {
    alert('📋 คัดลอกข้อความสรุปเรียบร้อยแล้ว!\nสามารถกดวาง (Paste) ส่งใน LINE ได้ทันที');
  }).catch(() => {
    alert(text);
  });
}

// --- 10. EXPORT TO CSV / EXCEL ---
function exportToCSV() {
  const records = getSavedInspections();
  if (records.length === 0) {
    alert('ไม่มีข้อมูลสำหรับ Export');
    return;
  }

  let csvContent = '\uFEFF'; // BOM for UTF-8 in Excel
  csvContent += 'ID,วันที่,หมายเลขตู้,ทะเบียนรถ,Seal Number,ชนิดสินค้า,ประเภทรถ,Invoice,ผลตรวจรับ,เวลาเริ่ม,เวลาเสร็จ,ผู้รับสินค้า,Supervisor,จำนวนสินค้าเสียหาย\n';

  records.forEach(r => {
    const row = [
      r.id,
      r.general.date,
      `"${r.general.containerNo}"`,
      `"${r.general.licensePlate}"`,
      `"${r.general.sealNumber}"`,
      `"${r.general.productType || ''}"`,
      `"${r.general.truckType || ''}"`,
      `"${r.general.invoiceNo || ''}"`,
      `"${r.decision || ''}"`,
      r.times?.start || '',
      r.times?.finish || '',
      `"${r.signatures?.receiverName || ''}"`,
      `"${r.signatures?.supervisorName || ''}"`,
      r.damageItems?.length || 0
    ];
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `container_inspections_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

function handlePrintReport() {
  openReportPreview();
}

// Expose globals for inline onclicks
window.updateDamageItem = updateDamageItem;
window.removeDamageRow = removeDamageRow;
window.removePhoto = removePhoto;
window.updatePhotoCategory = updatePhotoCategory;
window.openPhotoPreview = openPhotoPreview;
window.loadInspectionRecord = loadInspectionRecord;
window.deleteInspectionRecord = deleteInspectionRecord;
window.handlePrintReport = handlePrintReport;
window.handlePrintOfficialReport = handlePrintOfficialReport;
window.handleDownloadPdf = handleDownloadPdf;
window.openEmailModal = openEmailModal;
window.openReportPreview = openReportPreview;

// Initialize on DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}