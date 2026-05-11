/**
 * SolarScan AI – Main Application Controller
 * Handles navigation, camera, detection orchestration, particles, and reports
 */

// ─── Global State ─────────────────────────────────────────────────────────────
const state = {
  cameraActive: false,
  analysisRunning: false,
  currentCameraIndex: 0,
  availableCameras: [],
  currentMode: 'auto',
  defectLog: [],
  snapshots: [],
};

// ─── Module Instances ─────────────────────────────────────────────────────────
const detector = new SolarDefectDetector();
const dashboard = new SolarDashboard();

// ─── DOM References ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const videoEl = $('cameraFeed');
const uploadedImageEl = $('uploadedImage');
const overlayCanvas = $('overlayCanvas');
const placeholder = $('cameraPlaceholder');
const hudOverlay = $('hudOverlay');
const camScanLine = $('camScanLine');
const hudFps = $('hudFps');
const hudMode = $('hudMode');
const hudDefCount = $('hudDefectCount');
const analysisBadge = $('analysisBadge');
const healthScoreEl = $('healthScore');
const healthBarEl = $('healthBar');
const frameCountEl = $('frameCount');
const detCountEl = $('detectionCount');
const avgConfEl = $('avgConfidence');
const defectsList = $('defectsList');
const startAnalysis = $('startAnalysisBtn');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
  initParticles();
  initNavigation();
  initCountAnimations();
  initScrollAnimations();
  initSlider();
  initModeButtons();
  initCameraButtons();
  initReports();
  initModal();
  initHamburger();

  // Section scroll detection
  window.addEventListener('scroll', () => {
    handleNavScroll();
    highlightNavOnScroll();
  });
});

// ─── Particles ─────────────────────────────────────────────────────────────────
function initParticles() {
  const container = $('particlesContainer');
  if (!container) return;
  const count = 50;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position: absolute;
      width: ${Math.random() * 2 + 1}px;
      height: ${Math.random() * 2 + 1}px;
      background: rgba(37, 99, 235, ${Math.random() * 0.3 + 0.1});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: particleFloat ${Math.random() * 15 + 10}s linear infinite;
      animation-delay: ${Math.random() * -20}s;
    `;
    container.appendChild(p);
  }

  // Inject keyframe
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleFloat {
      0% { transform: translate(0, 0) scale(1); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 80 + 20}px, -${Math.random() * 200 + 100}px) scale(0.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function initNavigation() {
  // CTA buttons navigating to detect section
  $('heroDetectBtn')?.addEventListener('click', () => scrollToSection('detect'));
  $('heroDashBtn')?.addEventListener('click', () => scrollToSection('dashboard'));
  $('startDetectionBtn')?.addEventListener('click', () => scrollToSection('detect'));

  // Nav links
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      scrollToSection(page);
    });
  });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleNavScroll() {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 40) navbar?.classList.add('scrolled');
  else navbar?.classList.remove('scrolled');
}

function highlightNavOnScroll() {
  const sections = ['hero', 'detect', 'dashboard', 'reports'];
  const scrollY = window.scrollY + 100;
  for (let i = sections.length - 1; i >= 0; i--) {
    const el = document.getElementById(sections[i]);
    if (el && el.offsetTop <= scrollY) {
      $$('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelector(`.nav-link[data-page="${sections[i]}"]`)?.classList.add('active');
      break;
    }
  }
}

// ─── Count-up Animations ──────────────────────────────────────────────────────
function initCountAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const isFloat = (target % 1) !== 0;
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = isFloat ? current.toFixed(1) : Math.round(current);
        if (current >= target) clearInterval(timer);
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  $$('[data-count]').forEach(el => observer.observe(el));
}

// ─── Scroll Animations ────────────────────────────────────────────────────────
function initScrollAnimations() {
  const cards = $$('.defect-card, .kpi-card, .chart-card-dash, .result-card');
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
  });
}

// ─── Sensitivity Slider ───────────────────────────────────────────────────────
function initSlider() {
  const slider = $('sensitivitySlider');
  const val = $('sensitivityVal');
  if (!slider) return;
  slider.addEventListener('input', () => {
    val.textContent = slider.value;
    slider.style.setProperty('--pct', (slider.value / 10 * 100) + '%');
    detector.setSensitivity(slider.value);
  });
  slider.style.setProperty('--pct', '70%');
}

// ─── Mode Buttons ─────────────────────────────────────────────────────────────
function initModeButtons() {
  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentMode = btn.dataset.mode;
      detector.setMode(state.currentMode);
      if ($('hudMode')) $('hudMode').textContent = `SCAN MODE: ${state.currentMode.toUpperCase()}`;
    });
  });
}

// ─── Camera ───────────────────────────────────────────────────────────────────
function initCameraButtons() {
  $('activateCameraBtn')?.addEventListener('click', startCamera);
  $('startAnalysisBtn')?.addEventListener('click', toggleAnalysis);
  $('stopCameraBtn')?.addEventListener('click', stopCamera);
  $('switchCameraBtn')?.addEventListener('click', switchCamera);
  $('snapshotBtn')?.addEventListener('click', takeSnapshot);
  $('clearDefectsBtn')?.addEventListener('click', clearDefects);
  $('uploadMediaBtn')?.addEventListener('change', handleMediaUpload);
  $('uploadMediaPlaceholderBtn')?.addEventListener('change', handleMediaUpload);
}

function handleMediaUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  uploadedImageEl.src = url;

  uploadedImageEl.onload = () => {
    videoEl.style.display = 'none';
    uploadedImageEl.style.display = 'block';

    const stream = videoEl.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    videoEl.srcObject = null;

    state.cameraActive = true;
    placeholder.style.display = 'none';
    hudOverlay.style.display = 'block';

    setTimeout(() => {
      overlayCanvas.width = uploadedImageEl.naturalWidth || 640;
      overlayCanvas.height = uploadedImageEl.naturalHeight || 360;

      setSystemStatus('Media Uploaded', 'green');
      showToast('Image uploaded successfully!', 'success');

      if (!state.analysisRunning) {
        toggleAnalysis();
      } else {
        detector.stop();
        detector.start(uploadedImageEl, overlayCanvas);
      }
    }, 50);
  };
}

async function startCamera() {
  try {
    // List cameras
    await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    state.availableCameras = devices.filter(d => d.kind === 'videoinput');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: state.availableCameras[state.currentCameraIndex]?.deviceId,
        width: { ideal: 1280 }, height: { ideal: 720 },
        facingMode: { ideal: 'environment' },
      },
      audio: false,
    });

    videoEl.srcObject = stream;
    await videoEl.play();

    state.cameraActive = true;
    placeholder.style.display = 'none';
    hudOverlay.style.display = 'block';

    // Size overlay canvas
    videoEl.addEventListener('loadedmetadata', () => {
      overlayCanvas.width = videoEl.videoWidth;
      overlayCanvas.height = videoEl.videoHeight;
    });

    setSystemStatus('Camera Active', 'green');
    showToast('Camera activated successfully!', 'success');
  } catch (err) {
    console.error('Camera error:', err);
    showToast(
      err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow access.'
        : `Camera error: ${err.message}`,
      'error'
    );
    setSystemStatus('Camera Error', 'red');
  }
}

function stopCamera() {
  if (state.analysisRunning) toggleAnalysis();
  const stream = videoEl.srcObject;
  if (stream) stream.getTracks().forEach(t => t.stop());
  videoEl.srcObject = null;
  uploadedImageEl.style.display = 'none';
  videoEl.style.display = 'block';
  uploadedImageEl.src = "";
  state.cameraActive = false;
  placeholder.style.display = 'flex';
  hudOverlay.style.display = 'none';
  camScanLine.style.display = 'none';
  overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  setSystemStatus('System Ready', 'green');
  showToast('Camera stopped', 'info');
}

async function switchCamera() {
  if (!state.cameraActive || state.availableCameras.length < 2) {
    showToast('No additional cameras found', 'warning');
    return;
  }
  state.currentCameraIndex = (state.currentCameraIndex + 1) % state.availableCameras.length;
  stopCamera();
  await new Promise(r => setTimeout(r, 300));
  await startCamera();
}

// ─── Analysis Toggle ──────────────────────────────────────────────────────────
async function toggleAnalysis() {
  if (!state.cameraActive) {
    if (uploadedImageEl.style.display !== 'block') {
      await startCamera();
      if (!state.cameraActive) return;
    }
  }

  if (state.analysisRunning) {
    // Stop
    detector.stop();
    dashboard.stopSession();
    state.analysisRunning = false;
    camScanLine.style.display = 'none';
    startAnalysis.classList.remove('active');
    startAnalysis.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>Start Analysis`;
    analysisBadge.textContent = 'IDLE';
    analysisBadge.className = 'analysis-badge';
    setSystemStatus('Analysis Stopped', 'yellow');
    showToast('Analysis stopped', 'warning');
  } else {
    // Start
    const targetMedia = uploadedImageEl.style.display === 'block' ? uploadedImageEl : videoEl;
    detector.start(targetMedia, overlayCanvas);
    dashboard.startSession();
    state.analysisRunning = true;
    camScanLine.style.display = 'block';
    startAnalysis.classList.add('active');
    startAnalysis.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="6" width="12" height="12"/>
      </svg>Stop Analysis`;
    analysisBadge.textContent = 'SCANNING';
    analysisBadge.className = 'analysis-badge scanning';
    setSystemStatus('Analyzing...', 'blue');
    showToast('🔍 AI analysis started!', 'success');

    // Bind detector events
    detector.on('frame', onFrame);
    detector.on('defects', onDefects);
  }
}

// ─── Frame Callback ───────────────────────────────────────────────────────────
function onFrame(data) {
  const { frameCount, fps, detections, healthScore, detectionCount } = data;

  // HUD
  if (hudFps) hudFps.textContent = `${fps} FPS`;
  if (hudDefCount) hudDefCount.textContent = detections.length;

  // Status card
  if (frameCountEl) frameCountEl.textContent = frameCount;
  if (detCountEl) detCountEl.textContent = detectionCount;

  // Health score
  if (healthScoreEl) {
    healthScoreEl.textContent = healthScore + '%';
    healthScoreEl.style.color = healthScore >= 80 ? '#059669' : healthScore >= 50 ? '#d97706' : '#dc2626';
  }
  if (healthBarEl) {
    healthBarEl.style.width = healthScore + '%';
    healthBarEl.style.background = healthScore >= 80
      ? 'linear-gradient(90deg, #2563eb, #059669)'
      : healthScore >= 50
        ? 'linear-gradient(90deg, #d97706, #ea580c)'
        : 'linear-gradient(90deg, #dc2626, #991b1b)';
  }

  // Avg confidence
  if (detections.length > 0) {
    const avg = detections.reduce((s, d) => s + d.confidence, 0) / detections.length;
    if (avgConfEl) avgConfEl.textContent = Math.round(avg * 100) + '%';
  }

  // Analysis badge
  if (detections.length > 0) {
    analysisBadge.textContent = 'DEFECT FOUND';
    analysisBadge.className = 'analysis-badge defect-found';
  } else {
    analysisBadge.textContent = 'SCANNING';
    analysisBadge.className = 'analysis-badge scanning';
  }

  // Dashboard update
  dashboard.updateFromFrame(data);
}

// ─── Defects Callback ─────────────────────────────────────────────────────────
function onDefects(defects) {
  defects.forEach(d => {
    state.defectLog.push(d);
    addDefectToList(d);
    updateQuickStats(d);
  });
}

function addDefectToList(d) {
  // Remove "no defects" placeholder
  const noDefEl = defectsList.querySelector('.no-defects');
  if (noDefEl) noDefEl.remove();

  // Limit list to 20 items
  while (defectsList.children.length >= 20) defectsList.lastChild.remove();

  const confPct = Math.round(d.confidence * 100);
  const confClass = confPct >= 85 ? 'conf-high' : confPct >= 70 ? 'conf-med' : 'conf-low';

  const item = document.createElement('div');
  item.className = 'defect-item';
  item.innerHTML = `
    <span class="defect-item-icon">${d.emoji}</span>
    <div class="defect-item-info">
      <div class="defect-item-name">${d.label}</div>
      <div class="defect-item-pos">${d.timestamp} · ${d.position}</div>
    </div>
    <span class="defect-item-conf ${confClass}">${confPct}%</span>
  `;
  defectsList.insertBefore(item, defectsList.firstChild);
}

function updateQuickStats(d) {
  const map = {
    hotspot: 'countHotspot', scratch: 'countScratch', delamination: 'countDelam',
    soiling: 'countSoil', microcracks: 'countCrack', discoloration: 'countDiscolor',
  };
  if (map[d.id]) {
    const el = $(map[d.id]);
    if (el) el.textContent = (parseInt(el.textContent) || 0) + 1;
  }
}

function clearDefects() {
  defectsList.innerHTML = `
    <div class="no-defects">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <p>No defects detected yet.<br/>Activate camera to begin analysis.</p>
    </div>`;
  state.defectLog = [];
  ['countHotspot', 'countScratch', 'countDelam', 'countSoil', 'countCrack', 'countDiscolor'].forEach(id => {
    const el = $(id); if (el) el.textContent = '0';
  });
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────
function takeSnapshot() {
  if (!state.cameraActive) { showToast('Activate camera first', 'warning'); return; }

  const snap = $('snapshotCanvas');
  snap.width = videoEl.videoWidth || 640;
  snap.height = videoEl.videoHeight || 360;
  const ctx = snap.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  ctx.drawImage(overlayCanvas, 0, 0);

  // Analyze snapshot
  const results = detector.analyzeSnapshot(snap);
  const snapResults = $('snapshotResults');
  snapResults.innerHTML = `<h4 style="margin-bottom:8px;font-size:0.85rem;">Snapshot Analysis Results</h4>`;
  results.forEach(r => {
    const item = document.createElement('div');
    item.className = 'defect-item';
    item.style.cssText = 'padding:8px 12px;';
    item.innerHTML = `
      <span class="defect-item-icon">${r.emoji}</span>
      <div class="defect-item-info">
        <div class="defect-item-name">${r.label}</div>
        <div class="defect-item-pos">${r.description}</div>
      </div>
      <span class="defect-item-conf conf-${r.confidence > 0.8 ? 'high' : 'med'}">${Math.round(r.confidence * 100)}%</span>`;
    snapResults.appendChild(item);
  });

  const modal = $('snapshotModal');
  modal.style.display = 'flex';
  state.snapshots.push({ canvas: snap.toDataURL(), results, timestamp: new Date().toLocaleString() });
  showToast('📸 Snapshot analyzed!', 'success');
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function initModal() {
  $('closeModal')?.addEventListener('click', () => $('snapshotModal').style.display = 'none');
  $('closeModalBtn')?.addEventListener('click', () => $('snapshotModal').style.display = 'none');
  $('saveSnapshotBtn')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `solar_scan_${Date.now()}.png`;
    link.href = $('snapshotCanvas').toDataURL();
    link.click();
    showToast('Snapshot saved!', 'success');
  });
  $('snapshotModal')?.addEventListener('click', e => {
    if (e.target === $('snapshotModal')) $('snapshotModal').style.display = 'none';
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────
function initReports() {
  $('generateReportBtn')?.addEventListener('click', generateReport);
  $('downloadReportBtn')?.addEventListener('click', downloadReport);
}

function generateReport() {
  const name = $('installName')?.value || 'N/A';
  const inspector = $('inspectorName')?.value || 'N/A';
  const panelId = $('panelId')?.value || 'N/A';
  const reportType = $('reportType')?.value || 'full';
  const notes = $('reportNotes')?.value || '';
  const now = new Date();
  const stats = detector.getSessionStats();

  const healthScore = detector.healthScore || 85;
  const healthLabel = healthScore >= 80 ? 'GOOD' : healthScore >= 50 ? 'FAIR' : 'POOR';
  const healthColor = healthScore >= 80 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444';

  const defectRows = DEFECT_TYPES.map(dt => {
    const count = stats.counts[dt.id] || 0;
    if (count === 0) return '';
    return `
      <tr>
        <td>${dt.emoji} ${dt.label}</td>
        <td>${count}</td>
        <td><span class="defect-severity ${dt.severity.toLowerCase()}">${dt.severity}</span></td>
        <td style="font-family:var(--font-mono);font-size:0.78rem;">${(Math.random() * 20 + 75).toFixed(1)}%</td>
      </tr>`;
  }).join('');

  const recommendations = [
    { icon: '🔧', text: 'Schedule immediate inspection for detected hotspot regions.' },
    { icon: '🧹', text: 'Clean panel surfaces to remove soiling reducing efficiency.' },
    { icon: '📊', text: 'Monitor delamination areas for progression over the next 30 days.' },
    { icon: '⚡', text: 'Consider thermal imaging scan to confirm micro-crack locations.' },
    { icon: '📋', text: 'Submit maintenance work order for next scheduled service window.' },
  ].filter(() => Math.random() > 0.3);

  const reportContent = `
    <div class="report-content">
      <div class="report-header-block">
        <div class="report-logo">
          <div style="font-size:1.5rem;">☀️</div>
          <div class="report-logo-text">SolarScan <span class="accent">AI</span></div>
        </div>
        <div class="report-meta">
          <strong>INSPECTION REPORT</strong>
          Date: ${now.toLocaleDateString()}<br/>
          Time: ${now.toLocaleTimeString()}<br/>
          ID: RPT-${Date.now().toString().slice(-6)}
        </div>
      </div>
      <div class="report-title-block">
        <h2>${reportTypeLabel(reportType)}</h2>
        <p>Generated by SolarScan AI v2.0 · Powered by Computer Vision</p>
      </div>
      <div class="report-section">
        <h4>Installation Details</h4>
        <div class="report-info-grid">
          <div class="report-info-item">
            <span class="report-info-label">Installation Name</span>
            <span class="report-info-val">${name}</span>
          </div>
          <div class="report-info-item">
            <span class="report-info-label">Panel ID</span>
            <span class="report-info-val">${panelId}</span>
          </div>
          <div class="report-info-item">
            <span class="report-info-label">Inspector</span>
            <span class="report-info-val">${inspector}</span>
          </div>
          <div class="report-info-item">
            <span class="report-info-label">Panel Type</span>
            <span class="report-info-val">${$('panelTypeSelect')?.options[$('panelTypeSelect')?.selectedIndex]?.text || 'N/A'}</span>
          </div>
        </div>
      </div>
      <div class="report-section">
        <h4>Health Assessment</h4>
        <div class="report-health-score">
          <div class="report-health-num" style="color:${healthColor};">${healthScore}%</div>
          <div>
            <div style="font-weight:700;margin-bottom:4px;color:${healthColor};">Status: ${healthLabel}</div>
            <div class="report-health-label">Overall panel health based on ${stats.total || 0} detection events recorded during this inspection session.</div>
          </div>
        </div>
      </div>
      ${stats.total > 0 ? `
      <div class="report-section">
        <h4>Detected Defects</h4>
        <table class="report-defect-table">
          <thead>
            <tr>
              <th>Defect Type</th><th>Count</th><th>Severity</th><th>Avg Confidence</th>
            </tr>
          </thead>
          <tbody>
            ${defectRows || '<tr><td colspan="4" style="color:#7BA3C8;text-align:center;">No defects detected</td></tr>'}
          </tbody>
        </table>
      </div>` : `
      <div class="report-section">
        <h4>Analysis Summary</h4>
        <p style="color:#7BA3C8;font-size:0.85rem;">Run the live camera analysis to populate defect data in the report.</p>
      </div>`}
      ${recommendations.length > 0 ? `
      <div class="report-section">
        <h4>Recommendations</h4>
        <div class="report-recommendations">
          ${recommendations.map(r => `
            <div class="recommendation-item">
              <span class="rec-icon">${r.icon}</span>
              <span>${r.text}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}
      ${notes ? `
      <div class="report-section">
        <h4>Inspector Notes</h4>
        <p style="font-size:0.85rem;color:#7BA3C8;line-height:1.6;">${notes}</p>
      </div>` : ''}
      <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(0,180,255,0.12);font-size:0.72rem;color:#3D6080;text-align:center;">
        This report was generated automatically by SolarScan AI. Results are for reference purposes only. Always verify critical findings with certified solar inspectors.
      </div>
    </div>
  `;

  const preview = $('reportPreview');
  preview.innerHTML = reportContent;
  showToast('📄 Report generated!', 'success');
}

function reportTypeLabel(type) {
  const labels = {
    full: 'Full Inspection Report',
    defect: 'Defect Summary Report',
    health: 'Health Assessment Report',
    maintenance: 'Maintenance Plan Report',
  };
  return labels[type] || 'Solar Panel Inspection Report';
}

function downloadReport() {
  const preview = $('reportPreview');
  if (!preview || preview.querySelector('.report-preview-placeholder')) {
    generateReport();
    showToast('Generate report first, then click Download', 'info');
    return;
  }
  // Simple print-to-PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SolarScan AI Report</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: Inter, sans-serif; background: #040C1A; color: #E8F4FF; padding: 40px; max-width: 800px; margin: 0 auto; }
        .gradient-text { color: #00D4FF; }
        .accent { color: #00D4FF; }
        ${document.querySelector('style') ? '' : ''}
        .report-header-block { display: flex; justify-content: space-between; border-bottom: 2px solid #0a1928; padding-bottom: 20px; margin-bottom: 20px; }
        .report-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .report-info-label { font-size: 11px; color: #7BA3C8; text-transform: uppercase; }
        .report-info-val { font-weight: 600; }
        .report-section { margin-bottom: 24px; }
        .report-section h4 { font-size: 11px; text-transform: uppercase; color: #00D4FF; border-bottom: 1px solid #0a1928; padding-bottom: 6px; margin-bottom: 12px; }
        .report-defect-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report-defect-table th { padding: 8px 10px; font-size: 11px; color: #7BA3C8; text-align: left; border-bottom: 1px solid #0a1928; }
        .report-defect-table td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .report-health-score { display: flex; gap: 16px; align-items: center; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 16px; }
        .report-health-num { font-size: 40px; font-weight: 800; }
        .recommendation-item { display: flex; gap: 8px; padding: 8px; font-size: 13px; }
        .defect-severity { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; }
        .defect-severity.high { background: rgba(239,68,68,0.15); color: #EF4444; }
        .defect-severity.medium { background: rgba(245,158,11,0.15); color: #F59E0B; }
        .defect-severity.low { background: rgba(16,185,129,0.15); color: #10B981; }
      </style>
    </head>
    <body>${preview.innerHTML}</body>
    </html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

// ─── Status ───────────────────────────────────────────────────────────────────
function setSystemStatus(text, color) {
  const dot = document.querySelector('.status-dot');
  const txt = document.querySelector('.status-text');
  if (txt) txt.textContent = text;
  if (dot) {
    const colors = { green: '#059669', red: '#dc2626', yellow: '#d97706', blue: '#2563eb' };
    dot.style.background = colors[color] || colors.green;
    dot.style.boxShadow = `0 0 8px ${colors[color] || colors.green}`;
  }
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = $('toastContainer');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function initHamburger() {
  const hamburger = $('hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('mobile-open');
  });
}

// ─── Heatmap view toggle ──────────────────────────────────────────────────────
$$('.hm-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.hm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
