/**
 * SolarScan AI – Dashboard & Charts Module
 * Manages all Chart.js visualizations
 */

class SolarDashboard {
    constructor() {
        this.charts = {};
        this.defectCounts = { hotspot: 0, scratch: 0, delamination: 0, soiling: 0, microcracks: 0, discoloration: 0 };
        this.timelineData = { labels: [], defects: [], health: [] };
        this.totalDetections = 0;
        this.healthHistory = [];
        this.sessionStart = null;
        this.durationTimer = null;

        this._chartColors = {
            hotspot: { border: '#FF6B35', bg: 'rgba(255,107,53,0.7)' },
            scratch: { border: '#F59E0B', bg: 'rgba(245,158,11,0.7)' },
            delamination: { border: '#8B5CF6', bg: 'rgba(139,92,246,0.7)' },
            soiling: { border: '#9CA3AF', bg: 'rgba(156,163,175,0.7)' },
            microcracks: { border: '#EF4444', bg: 'rgba(239,68,68,0.7)' },
            discoloration: { border: '#10B981', bg: 'rgba(16,185,129,0.7)' },
        };
    }

    init() {
        this._initDoughnut();
        this._initTimeline();
        this._initSeverity();
        this._drawHeatmap();
        this._initLiveChart();
    }

    startSession() {
        this.sessionStart = Date.now();
        this.durationTimer = setInterval(() => this._updateDuration(), 1000);
    }

    stopSession() {
        if (this.durationTimer) clearInterval(this.durationTimer);
    }

    _updateDuration() {
        if (!this.sessionStart) return;
        const elapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        const el = document.getElementById('analysisDuration');
        if (el) el.textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

    // ─── Chart Defaults ────────────────────────────────────────────
    _chartDefaults() {
        return {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1,
                    titleColor: '#0F172A', bodyColor: '#475569',
                    padding: 10, cornerRadius: 8,
                },
            },
            animation: { duration: 400 },
        };
    }

    // ─── Doughnut Chart ───────────────────────────────────────────
    _initDoughnut() {
        const ctx = document.getElementById('defectDoughnut');
        if (!ctx) return;
        this.charts.doughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hotspot', 'Scratch', 'Delamination', 'Soiling', 'Micro-crack', 'Discoloration'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: Object.values(this._chartColors).map(c => c.bg),
                    borderColor: Object.values(this._chartColors).map(c => c.border),
                    borderWidth: 2,
                    hoverOffset: 6,
                }],
            },
            options: {
                ...this._chartDefaults(),
                cutout: '70%',
                plugins: {
                    ...this._chartDefaults().plugins,
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { color: '#475569', padding: 8, font: { size: 10 }, boxWidth: 10 }
                    },
                },
            },
        });
    }

    // ─── Timeline Chart ───────────────────────────────────────────
    _initTimeline() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Defects Detected',
                        data: [],
                        borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.1)',
                        borderWidth: 2, tension: 0.4, fill: true, pointRadius: 2,
                    },
                    {
                        label: 'Health Score',
                        data: [],
                        borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.05)',
                        borderWidth: 2, tension: 0.4, fill: false, pointRadius: 2,
                        yAxisID: 'yHealth',
                    },
                ],
            },
            options: {
                ...this._chartDefaults(),
                scales: {
                    x: { display: false },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#475569', font: { size: 10 } },
                        grid: { color: 'rgba(0,0,0,0.03)' },
                    },
                    yHealth: {
                        position: 'right', min: 0, max: 100,
                        ticks: { color: '#38BDF8', font: { size: 10 } },
                        grid: { display: false },
                    },
                },
                plugins: {
                    ...this._chartDefaults().plugins,
                    legend: {
                        display: true,
                        labels: { color: '#475569', padding: 8, font: { size: 10 }, boxWidth: 10 }
                    },
                },
            },
        });
    }

    // ─── Severity Bar Chart ───────────────────────────────────────
    _initSeverity() {
        const ctx = document.getElementById('severityChart');
        if (!ctx) return;
        this.charts.severity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)'],
                    borderColor: ['#EF4444', '#F59E0B', '#10B981'],
                    borderWidth: 1, borderRadius: 6,
                }],
            },
            options: {
                ...this._chartDefaults(),
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#475569', font: { size: 10 } },
                        grid: { color: 'rgba(0,0,0,0.03)' },
                    },
                    x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
                },
            },
        });
    }

    // ─── Live detection mini chart ─────────────────────────────────
    _initLiveChart() {
        const ctx = document.getElementById('liveChart');
        if (!ctx) return;
        this.charts.live = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        data: [],
                        borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.15)',
                        borderWidth: 1.5, tension: 0.4, fill: true, pointRadius: 0,
                    },
                    {
                        data: [],
                        borderColor: '#00D4FF', backgroundColor: 'transparent',
                        borderWidth: 1.5, tension: 0.4, fill: false, pointRadius: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 0 },
                scales: {
                    x: { display: false },
                    y: {
                        display: false,
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    // ─── Update charts with new detection data ─────────────────────
    updateFromFrame(frameData) {
        const { frameCount, detections, healthScore } = frameData;
        this.healthHistory.push(healthScore);
        if (this.healthHistory.length > 50) this.healthHistory.shift();

        const avgHealth = Math.round(this.healthHistory.reduce((a, b) => a + b) / this.healthHistory.length);
        const el = document.getElementById('avgHealth');
        if (el) el.textContent = avgHealth + '%';

        // Update totals
        this.totalDetections += detections.length;
        const criticals = detections.filter(d => d.severity === 'HIGH').length;

        // Update KPIs
        const tdEl = document.getElementById('totalDetections');
        if (tdEl) tdEl.textContent = this.totalDetections;
        const caEl = document.getElementById('criticalAlerts');
        if (caEl) caEl.textContent = criticals;

        const dtEl = document.getElementById('detectionTrend');
        if (dtEl) {
            dtEl.textContent = `+${detections.length} this frame`;
            dtEl.className = 'kpi-trend ' + (detections.length > 0 ? 'down' : 'up');
        }
        const htEl = document.getElementById('healthTrend');
        if (htEl) {
            htEl.textContent = healthScore >= 80 ? '✓ Good condition' : healthScore >= 50 ? '⚠ Fair condition' : '✗ Poor condition';
            htEl.className = 'kpi-trend ' + (healthScore >= 80 ? 'up' : healthScore >= 50 ? 'neutral' : 'down');
        }
        const atEl = document.getElementById('alertTrend');
        if (atEl) {
            atEl.textContent = criticals > 0 ? `${criticals} critical now` : 'No alerts';
            atEl.className = 'kpi-trend ' + (criticals > 0 ? 'down' : 'neutral');
        }

        // Update defect counts
        detections.forEach(d => {
            if (this.defectCounts[d.id] !== undefined) this.defectCounts[d.id]++;
        });

        // Update doughnut
        if (this.charts.doughnut) {
            this.charts.doughnut.data.datasets[0].data = Object.values(this.defectCounts);
            this.charts.doughnut.update('none');
            const tot = Object.values(this.defectCounts).reduce((a, b) => a + b, 0);
            const dtEl2 = document.getElementById('doughnutTotal');
            if (dtEl2) dtEl2.textContent = tot;
        }

        // Update severity
        if (this.charts.severity) {
            const high = (this.defectCounts.hotspot + this.defectCounts.delamination + this.defectCounts.microcracks);
            const med = (this.defectCounts.scratch + this.defectCounts.discoloration);
            const low = this.defectCounts.soiling;
            this.charts.severity.data.datasets[0].data = [high, med, low];
            this.charts.severity.update('none');
        }

        // Update timeline (every 5 frames)
        if (frameCount % 5 === 0) {
            const label = frameCount.toString();
            this.timelineData.labels.push(label);
            this.timelineData.defects.push(detections.length);
            this.timelineData.health.push(healthScore);
            if (this.timelineData.labels.length > 30) {
                this.timelineData.labels.shift();
                this.timelineData.defects.shift();
                this.timelineData.health.shift();
            }
            if (this.charts.timeline) {
                this.charts.timeline.data.labels = this.timelineData.labels;
                this.charts.timeline.data.datasets[0].data = this.timelineData.defects;
                this.charts.timeline.data.datasets[1].data = this.timelineData.health;
                this.charts.timeline.update('none');
            }
        }

        // Update live mini chart
        if (this.charts.live) {
            this.charts.live.data.labels.push(frameCount);
            this.charts.live.data.datasets[0].data.push(detections.length);
            this.charts.live.data.datasets[1].data.push(healthScore / 20); // scale ~0-5
            if (this.charts.live.data.labels.length > 60) {
                this.charts.live.data.labels.shift();
                this.charts.live.data.datasets[0].data.shift();
                this.charts.live.data.datasets[1].data.shift();
            }
            this.charts.live.update('none');
        }

        // Redraw heatmap occasionally
        if (frameCount % 15 === 0) this._drawHeatmap(detections);
    }

    // ─── Heatmap canvas ───────────────────────────────────────────
    _drawHeatmap(detections = []) {
        const canvas = document.getElementById('heatmapCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        // Draw panel cells
        const cols = 10, rows = 4;
        const cw = W / cols, ch = H / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const health = 0.75 + Math.random() * 0.25;
                const hue = health * 120; // green to red
                ctx.fillStyle = `hsla(${hue},80%,40%,0.5)`;
                ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
                ctx.strokeStyle = 'rgba(37,99,235,0.08)';
                ctx.lineWidth = 1;
                ctx.strokeRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
            }
        }

        // Apply detection "heat" overlays
        if (detections && detections.length > 0) {
            detections.forEach(d => {
                const scaleX = W / (this._detCanvas?.width || 640);
                const scaleY = H / (this._detCanvas?.height || 360);
                const hx = (d.x || 0) * scaleX;
                const hy = (d.y || 0) * scaleY;
                const hw = (d.w || 80) * scaleX;
                const hh = (d.h || 60) * scaleY;
                const grad = ctx.createRadialGradient(hx + hw / 2, hy + hh / 2, 0, hx + hw / 2, hy + hh / 2, Math.max(hw, hh));
                const col = d.color || '#FF6B35';
                grad.addColorStop(0, col.replace(')', ',0.6)').replace('rgb', 'rgba'));
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(hx, hy, hw, hh);
            });
        }

        // Grid panel labels
        ctx.fillStyle = 'rgba(15,23,42,0.5)';
        ctx.font = '9px JetBrains Mono, monospace';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                ctx.fillText(`P${r * cols + c + 1}`, c * cw + 6, r * ch + 16);
            }
        }
    }

    reset() {
        Object.keys(this.defectCounts).forEach(k => this.defectCounts[k] = 0);
        this.totalDetections = 0;
        this.healthHistory = [];
        this.timelineData = { labels: [], defects: [], health: [] };

        if (this.charts.doughnut) {
            this.charts.doughnut.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
            this.charts.doughnut.update();
        }
        if (this.charts.timeline) {
            this.charts.timeline.data.labels = [];
            this.charts.timeline.data.datasets.forEach(ds => ds.data = []);
            this.charts.timeline.update();
        }
        if (this.charts.severity) {
            this.charts.severity.data.datasets[0].data = [0, 0, 0];
            this.charts.severity.update();
        }
        if (this.charts.live) {
            this.charts.live.data.labels = [];
            this.charts.live.data.datasets.forEach(ds => ds.data = []);
            this.charts.live.update();
        }
        this._drawHeatmap();

        const kpiIds = ['totalDetections', 'avgHealth', 'analysisDuration', 'criticalAlerts', 'doughnutTotal'];
        kpiIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = id === 'avgHealth' ? '--' : '0';
        });
    }
}

// Export as global
window.SolarDashboard = SolarDashboard;
