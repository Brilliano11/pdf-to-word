/* =============================================
   app.js — PDF2Word Frontend Logic (Sync Mode)
   ============================================= */

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadCard = document.getElementById('uploadCard');
const fileSelected = document.getElementById('fileSelected');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeBtn = document.getElementById('removeBtn');
const convertBtn = document.getElementById('convertBtn');
const progressCard = document.getElementById('progressCard');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressMsg = document.getElementById('progressMsg');
const resultCard = document.getElementById('resultCard');
const resultFileName = document.getElementById('resultFileName');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const errorCard = document.getElementById('errorCard');
const errorMsg = document.getElementById('errorMsg');
const retryBtn = document.getElementById('retryBtn');

let currentFile = null;
let lastBlobUrl = null;
let lastFileName = 'converted.docx';

// ===== Background Particles =====
(function initParticles() {
  const container = document.getElementById('bgParticles');
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#22c55e'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 180 + 60;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 15;
    const duration = Math.random() * 20 + 18;
    const left = Math.random() * 100;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${left}%;
      background: radial-gradient(circle, ${color}, transparent 70%);
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    `;
    container.appendChild(p);
  }
})();

// ===== File Utilities =====
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isValidPDF(file) {
  return file && file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
}

// ===== UI State Management =====
function showUploadZone() {
  dropZone.style.display = 'flex';
  dropZone.style.flexDirection = 'column';
  dropZone.style.alignItems = 'center';
  fileSelected.style.display = 'none';
  progressCard.style.display = 'none';
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';
  uploadCard.style.display = 'block';
}

function showFileSelected(file) {
  dropZone.style.display = 'none';
  fileSelected.style.display = 'block';
  progressCard.style.display = 'none';
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';
  uploadCard.style.display = 'block';
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
}

function showProgress() {
  uploadCard.style.display = 'none';
  progressCard.style.display = 'block';
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';
  updateProgress(5, 'Mengupload file PDF...');
}

function showResult(originalName) {
  progressCard.style.display = 'none';
  resultCard.style.display = 'block';
  resultFileName.textContent = `${originalName}.docx telah diunduh`;
}

function showError(message) {
  progressCard.style.display = 'none';
  uploadCard.style.display = 'none';
  errorCard.style.display = 'block';
  errorMsg.textContent = message || 'Terjadi kesalahan saat memproses file.';
}

function updateProgress(percent, message) {
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${Math.round(percent)}%`;
  if (message) progressMsg.textContent = message;
}

// ===== File Handling =====
function handleFile(file) {
  if (!isValidPDF(file)) {
    showToast('Hanya file PDF yang diizinkan!', 'error');
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    showToast('Ukuran file maksimal 50MB!', 'error');
    return;
  }
  currentFile = file;
  showFileSelected(file);
}

// ===== Drag & Drop =====
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

dropZone.addEventListener('click', (e) => {
  if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
    fileInput.click();
  }
});

browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
  fileInput.value = '';
});

removeBtn.addEventListener('click', () => {
  currentFile = null;
  showUploadZone();
});

// ===== Conversion (Synchronous) =====
const progressMessages = [
  [0,  'Mengupload file PDF...'],
  [15, 'Menganalisis struktur halaman...'],
  [30, 'Mengekstrak teks dan format...'],
  [50, 'Memproses tabel dan gambar...'],
  [70, 'Menyesuaikan layout dokumen...'],
  [85, 'Menyimpan file Word...'],
  [95, 'Hampir selesai...'],
];

convertBtn.addEventListener('click', async () => {
  if (!currentFile) return;

  showProgress();

  const originalName = currentFile.name.replace(/\.pdf$/i, '');

  // Animate progress while waiting for server response
  let pct = 5;
  const progressInterval = setInterval(() => {
    pct = Math.min(pct + (Math.random() * 4 + 1), 93);
    const msg = progressMessages.reduce((acc, [t, m]) => pct >= t ? m : acc, progressMessages[0][1]);
    updateProgress(pct, msg);
  }, 1800);

  try {
    const formData = new FormData();
    formData.append('file', currentFile);

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      let errMsg = 'Konversi gagal';
      try {
        const errData = await response.json();
        errMsg = errData.error || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }

    updateProgress(100, 'Konversi selesai!');

    // Get the docx blob from response
    const blob = await response.blob();

    // Revoke previous blob URL if any
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);

    lastBlobUrl = URL.createObjectURL(blob);
    lastFileName = `${originalName}.docx`;

    // Auto-trigger download
    triggerDownload(lastBlobUrl, lastFileName);

    setTimeout(() => showResult(originalName), 600);

  } catch (err) {
    clearInterval(progressInterval);
    showError(err.message);
  }
});

// ===== Download Helper =====
function triggerDownload(blobUrl, filename) {
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ===== Download Again Button =====
downloadBtn.addEventListener('click', () => {
  if (!lastBlobUrl) return;
  triggerDownload(lastBlobUrl, lastFileName);
  showToast(`Mengunduh ulang "${lastFileName}"...`, 'success');
});

// ===== Reset =====
resetBtn.addEventListener('click', () => {
  currentFile = null;
  showUploadZone();
});

retryBtn.addEventListener('click', () => {
  currentFile = null;
  showUploadZone();
});

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: ${type === 'error' ? 'rgba(239,68,68,0.95)' : type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(99,102,241,0.95)'};
    color: white;
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0;
    max-width: 90vw;
    text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ===== Intersection Observer for animations =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .step').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  showUploadZone();
});
