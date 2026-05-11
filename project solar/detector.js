/**
 * SolarScan AI – Defect Detection Engine
 * Simulates a real computer vision model using canvas image analysis
 * In production, replace with TensorFlow.js or a REST API call to a real model
 */

const DEFECT_TYPES = [
    {
        id: 'hotspot',
        label: 'Hotspot',
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.15)',
        emoji: '🔥',
        severity: 'HIGH',
        description: 'Localized thermal overheating detected',
        minConf: 0.78,
        maxConf: 0.99,
    },
    {
        id: 'scratch',
        label: 'Scratch',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        emoji: '⚡',
        severity: 'MEDIUM',
        description: 'Surface abrasion affecting light absorption',
        minConf: 0.65,
        maxConf: 0.95,
    },
    {
        id: 'delamination',
        label: 'Delamination',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        emoji: '🔵',
        severity: 'HIGH',
        description: 'Layer separation between cell and coating',
        minConf: 0.71,
        maxConf: 0.93,
    },
    {
        id: 'soiling',
        label: 'Soiling',
        color: '#64748b',
        bgColor: 'rgba(100, 116, 139, 0.15)',
        emoji: '🌫️',
        severity: 'LOW',
        description: 'Dust/dirt deposits blocking irradiance',
        minConf: 0.80,
        maxConf: 0.99,
    },
    {
        id: 'microcracks',
        label: 'Micro-crack',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        emoji: '💥',
        severity: 'HIGH',
        description: 'Micro fracture in silicon wafer detected',
        minConf: 0.68,
        maxConf: 0.91,
    },
    {
        id: 'discoloration',
        label: 'Discoloration',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        emoji: '🎨',
        severity: 'MEDIUM',
        description: 'EVA browning or chemical degradation',
        minConf: 0.62,
        maxConf: 0.88,
    },
];

class SolarDefectDetector {
    constructor() {
        this.isRunning = false;
        this.frameCount = 0;
        this.detectionCount = 0;
        this.sessionDefects = [];
        this.callbacks = {};
        this.sensitivity = 7;
        this.mode = 'auto';
        this.fpsHistory = [];
        this.lastFrameTime = 0;
        this.healthScore = 100;
        this.detectInterval = null;
        this.animFrame = null;

        // Simulated defect regions that change over time to look realistic
        this._hotRegions = [];
        this._regionUpdateTimer = 0;
    }

    on(event, cb) {
        this.callbacks[event] = cb;
        return this;
    }

    _emit(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }

    setSensitivity(val) { this.sensitivity = parseInt(val); }
    setMode(mode) { this.mode = mode; }

    start(videoEl, canvasEl) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.frameCount = 0;
        this.detectionCount = 0;
        this._canvas = canvasEl;
        this._ctx = canvasEl.getContext('2d');
        this._video = videoEl;
        this._emit('started', {});
        this._updateHotRegions();
        this._loop();
        // Re-randomize regions every 3 seconds
        this.detectInterval = setInterval(() => this._updateHotRegions(), 3000);
    }

    stop() {
        this.isRunning = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        if (this.detectInterval) clearInterval(this.detectInterval);
        if (this._ctx && this._canvas) {
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        this._emit('stopped', {});
    }

    _updateHotRegions() {
        if (!this._canvas) return;
        const W = this._canvas.width || 640;
        const H = this._canvas.height || 360;
        this._hotRegions = [];
        const count = this._getDefectCount();
        const usedTypes = this._getActiveDefectTypes();

        for (let i = 0; i < count; i++) {
            const defType = usedTypes[i % usedTypes.length];
            const w = randInt(W * 0.08, W * 0.22);
            const h = randInt(H * 0.10, H * 0.28);
            const x = randInt(W * 0.05, W - w - W * 0.05);
            const y = randInt(H * 0.05, H - h - H * 0.05);
            const conf = lerp(defType.minConf, defType.maxConf, Math.random());
            this._hotRegions.push({ defType, x, y, w, h, conf, id: `D${Date.now()}_${i}` });
        }
    }

    _getDefectCount() {
        const base = Math.floor((this.sensitivity / 10) * 3);
        return Math.random() < 0.4 ? 0 : randInt(0, base + 1);
    }

    _getActiveDefectTypes() {
        if (this.mode === 'hotspot') return DEFECT_TYPES.filter(d => d.id === 'hotspot' || d.id === 'delamination');
        if (this.mode === 'surface') return DEFECT_TYPES.filter(d => d.id === 'scratch' || d.id === 'soiling' || d.id === 'discoloration');
        if (this.mode === 'full') return DEFECT_TYPES;
        // auto: pick 3-4 varied types
        const shuffled = [...DEFECT_TYPES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 4);
    }

    _loop() {
        if (!this.isRunning) return;
        const now = performance.now();
        const delta = now - this.lastFrameTime;

        if (delta >= 33) { // ~30fps
            // Calculate FPS
            this.fpsHistory.push(1000 / delta);
            if (this.fpsHistory.length > 10) this.fpsHistory.shift();
            const fps = Math.round(this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length);

            this.lastFrameTime = now;
            this.frameCount++;

            // Sync canvas size to video or image
            const w = this._video.videoWidth || this._video.naturalWidth;
            const h = this._video.videoHeight || this._video.naturalHeight;
            if (w) {
                this._canvas.width = w;
                this._canvas.height = h;
            } else {
                this._canvas.width = 640;
                this._canvas.height = 360;
            }

            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

            // Draw detection boxes for current hot regions
            const currentDetections = [];
            for (const region of this._hotRegions) {
                this._drawDetection(region);
                currentDetections.push({
                    ...region.defType,
                    x: region.x, y: region.y, w: region.w, h: region.h,
                    confidence: region.conf,
                    id: region.id,
                    timestamp: new Date().toLocaleTimeString(),
                    position: `(${Math.round(region.x)}, ${Math.round(region.y)})`,
                });
                this.detectionCount++;
            }

            // Calculate health score
            if (currentDetections.length > 0) {
                const maxConf = Math.max(...currentDetections.map(d => d.confidence));
                const highSev = currentDetections.filter(d => d.severity === 'HIGH').length;
                this.healthScore = Math.max(20, 100 - (highSev * 20) - (currentDetections.length * 8) - (maxConf * 15));
            } else {
                this.healthScore = Math.min(100, this.healthScore + 2);
            }
            this.healthScore = Math.round(Math.max(10, Math.min(100, this.healthScore)));

            this._emit('frame', {
                frameCount: this.frameCount,
                fps,
                detections: currentDetections,
                healthScore: this.healthScore,
                detectionCount: this.detectionCount,
            });

            if (currentDetections.length > 0) {
                this._emit('defects', currentDetections);
                this.sessionDefects.push(...currentDetections);
            }
        }

        this.animFrame = requestAnimationFrame(() => this._loop());
    }

    _drawDetection({ defType, x, y, w, h, conf }) {
        const ctx = this._ctx;
        const color = defType.color;

        // Animated alpha
        const alpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);

        // Box fill
        ctx.fillStyle = defType.bgColor;
        ctx.fillRect(x, y, w, h);

        // Box border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        const cs = 10;
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        // TL
        ctx.beginPath(); ctx.moveTo(x, y + cs); ctx.lineTo(x, y); ctx.lineTo(x + cs, y); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(x + w - cs, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cs); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(x, y + h - cs); ctx.lineTo(x, y + h); ctx.lineTo(x + cs, y + h); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(x + w - cs, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cs); ctx.stroke();

        // Label background
        const labelText = `${defType.label}  ${Math.round(conf * 100)}%`;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        const tw = ctx.measureText(labelText).width;
        const lx = Math.max(0, x);
        const ly = Math.max(0, y - 22);
        ctx.fillStyle = color;
        ctx.fillRect(lx, ly, tw + 12, 20);

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, lx + 6, ly + 14);

        // Pulse circle for hotspot
        if (defType.id === 'hotspot') {
            const cx = x + w / 2, cy = y + h / 2;
            const r = Math.min(w, h) * 0.2;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, `rgba(255,107,53,${0.6 * alpha})`);
            grad.addColorStop(1, 'rgba(255,107,53,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        }
    }

    analyzeSnapshot(canvas) {
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(canvas, 0, 0);

        // Simulate analysis on snapshot
        const results = [];
        const types = this._getActiveDefectTypes();
        const count = randInt(1, 4);
        for (let i = 0; i < count; i++) {
            const defType = types[Math.floor(Math.random() * types.length)];
            results.push({
                ...defType,
                confidence: lerp(defType.minConf, defType.maxConf, Math.random()),
                area: `${randInt(50, 400)} px²`,
                location: `Region ${i + 1}`,
            });
        }
        return results;
    }

    getSessionStats() {
        const counts = {};
        DEFECT_TYPES.forEach(d => counts[d.id] = 0);
        this.sessionDefects.forEach(d => {
            if (counts[d.id] !== undefined) counts[d.id]++;
        });
        return { counts, total: this.sessionDefects.length, healthScore: this.healthScore };
    }

    clearSession() {
        this.sessionDefects = [];
        this.detectionCount = 0;
        this.frameCount = 0;
    }
}

// ── Utility helpers ──────────────────────────────────────────
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function lerp(a, b, t) { return a + (b - a) * t; }

// Export as global
window.SolarDefectDetector = SolarDefectDetector;
window.DEFECT_TYPES = DEFECT_TYPES;
