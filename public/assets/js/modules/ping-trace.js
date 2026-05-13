/**
 * PingTrace module — Trazado de Ping.
 * Searchable device selection from modal, auto-scroll visual tracking during trace.
 */
const PingTrace = (() => {
    const H = DOMHelpers;
    const APP_BASE = (typeof window !== 'undefined' && typeof window.BASE_PATH === 'string') ? window.BASE_PATH : '';

    let state = {
        active: false,
        sourceEl: null,
        targetEl: null,
        running: false,
        viewport: null,
    };

    /* ---- Init ---- */
    function init() {
        const btn = document.getElementById('btn-ping-trace');
        if (btn) btn.addEventListener('click', openModal);

        const startBtn = document.getElementById('btn-start-trace');
        if (startBtn) startBtn.addEventListener('click', startTrace);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.active) cancel();
        });
    }

    /* ---- Modal ---- */
    function openModal() {
        const modal = document.getElementById('modal-ping-trace');
        if (!modal) return;
        modal.style.display = 'flex';
        resetState();

        populateDeviceList();

        const srcInput = document.getElementById('trace-source-input');
        const tgtInput = document.getElementById('trace-target-input');

        // Format display: when user selects an ID, show name+IP and store ID in dataset
        [srcInput, tgtInput].forEach(inp => {
            if (!inp) return;
            inp.value = '';
            delete inp.dataset.selectedId;
            // Use a named function so we can remove old listeners
            const handler = function onTraceInput() {
                const val = inp.value;
                const device = findDeviceById(val);
                if (device) {
                    const name = device.dataset.name || 'Sin nombre';
                    const ip = device.dataset.ip || '';
                    inp.value = name + (ip ? ' — ' + ip : '');
                    inp.dataset.selectedId = val;
                } else {
                    delete inp.dataset.selectedId;
                }
                checkReady();
            };
            inp.removeEventListener('input', inp._traceHandler);
            inp._traceHandler = handler;
            inp.addEventListener('input', handler);
        });

        const btn = document.getElementById('btn-start-trace');
        if (btn) btn.disabled = true;

        const results = document.getElementById('trace-results');
        if (results) { results.style.display = 'none'; results.innerHTML = ''; }

        clearHighlight();
        state.active = true;
    }

    /** Fill the shared datalist with device options from the canvas */
    function populateDeviceList() {
        const canvas = document.getElementById('canvas');
        const list = document.getElementById('trace-devices-list');
        if (!canvas || !list) return;

        const objects = canvas.querySelectorAll('.object');
        let html = '';
        objects.forEach(obj => {
            const id = obj.dataset.id;
            const name = obj.dataset.name || 'Sin nombre';
            const ip = obj.dataset.ip || '';
            const label = name + (ip ? ' — ' + ip : '') + ' (ID:' + id + ')';
            html += '<option value="' + id + '">' + escHtmlAttr(label) + '</option>';
        });
        list.innerHTML = html;
    }

    /** When input changes, check if both source and target are valid */
    function checkReady() {
        const srcInput = document.getElementById('trace-source-input');
        const tgtInput = document.getElementById('trace-target-input');
        const srcId = srcInput?.dataset?.selectedId;
        const tgtId = tgtInput?.dataset?.selectedId;
        const btn = document.getElementById('btn-start-trace');
        if (!btn) return;

        const srcEl = findDeviceById(srcId);
        const tgtEl = findDeviceById(tgtId);

        const ready = srcEl && tgtEl && srcId !== tgtId && srcEl.dataset.ip && tgtEl.dataset.ip;
        btn.disabled = !ready;
    }

    function findDeviceById(id) {
        if (!id) return null;
        return document.getElementById('canvas')?.querySelector('.object[data-id="' + id + '"]');
    }

    /* ---- Start Trace ---- */
    async function startTrace() {
        const srcId = document.getElementById('trace-source-input')?.dataset?.selectedId;
        const tgtId = document.getElementById('trace-target-input')?.dataset?.selectedId;
        state.sourceEl = findDeviceById(srcId);
        state.targetEl = findDeviceById(tgtId);
        if (!state.sourceEl || !state.targetEl || state.running) return;

        state.running = true;

        // Hide modal
        const modal = document.getElementById('modal-ping-trace');
        if (modal) modal.style.display = 'none';

        // Lock scroll on viewport
        state.viewport = document.getElementById('canvas-viewport') || document.getElementById('canvas')?.parentElement;
        if (state.viewport) state.viewport.style.overflow = 'hidden';

        // Show floating progress bar
        showProgress();
        updateProgress(0, 0, null);

        // BFS path
        const sourceId = parseInt(state.sourceEl.dataset.id);
        const targetId = parseInt(state.targetEl.dataset.id);
        const path = bfs(sourceId, targetId);

        if (!path || path.length < 2) {
            finishTrace(false);
            return;
        }

        // Highlight and ping sequentially
        clearHighlight();
        highlightPath(path);

        const canvas = document.getElementById('canvas');
        let hopNum = 0;

        for (const deviceId of path) {
            hopNum++;
            const deviceEl = canvas?.querySelector('.object[data-id="' + deviceId + '"]');

            // Auto-scroll to center this device
            if (deviceEl && state.viewport) centerOnElement(deviceEl);

            // Update progress bar
            updateProgress(hopNum, path.length, deviceEl);

            // Ping the device
            const info = getDeviceInfo(deviceEl);
            if (info && info.ip) {
                try {
                    const res = await fetch(APP_BASE + '/api/ping', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ip: info.ip }),
                    });
                    const json = await res.json();
                    const pingData = json.data || {};
                    addHopCard(hopNum, info.name, info.ip, !!pingData.success, pingData.time_ms || null);
                } catch (err) {
                    addHopCard(hopNum, info.name, info.ip, false, null);
                }
            } else {
                addHopCard(hopNum, info?.name || 'Desconocido', 'Sin IP', false, null);
            }

            // Mark the line from the previous device to this one as verified (blue)
            if (hopNum > 1) {
                verifyHopLine(path, hopNum);
            }

            if (hopNum < path.length) await delay(1200);
        }

        finishTrace(true);
    }

    function finishTrace(hadPath) {
        hideProgress();
        if (state.viewport) state.viewport.style.overflow = '';

        // Reopen modal to show results
        const modal = document.getElementById('modal-ping-trace');
        if (modal) modal.style.display = 'flex';

        const results = document.getElementById('trace-results');
        if (results) {
            results.style.display = 'block';
            if (!hadPath) {
                results.innerHTML = '<div class="trace-hint" style="color:var(--red);">No se encontró una ruta entre los dispositivos seleccionados.</div>';
            }
        }

        state.running = false;
    }

    /* ---- Viewport centering ---- */
    function centerOnElement(el) {
        if (!state.viewport) return;
        const elLeft = parseInt(el.style.left) || 0;
        const elTop = parseInt(el.style.top) || 0;
        const vpW = state.viewport.clientWidth;
        const vpH = state.viewport.clientHeight;
        state.viewport.scrollTo({
            left: Math.max(0, elLeft - vpW / 2 + 40),
            top: Math.max(0, elTop - vpH / 2 + 24),
            behavior: 'smooth',
        });
    }

    /* ---- Floating progress bar ---- */
    function showProgress() {
        let bar = document.getElementById('trace-progress');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'trace-progress';
            bar.className = 'trace-progress-bar';
            document.body.appendChild(bar);
        }
        bar.style.display = 'flex';
    }

    function updateProgress(hop, total, deviceEl) {
        const bar = document.getElementById('trace-progress');
        if (!bar) return;
        const name = deviceEl?.dataset?.name || '';
        const ip = deviceEl?.dataset?.ip || '';
        const label = name + (ip ? ' (' + ip + ')' : '');
        bar.innerHTML =
            '<div class="trace-progress-content">' +
                (hop > 0 ? '<span class="trace-progress-num">Salto ' + hop + ' de ' + total + '</span>' : '<span class="trace-progress-num">Buscando ruta...</span>') +
                (label ? '<span class="trace-progress-label">' + escHtml(label) + '</span>' : '') +
                '<span class="trace-progress-spinner"></span>' +
            '</div>';
    }

    function hideProgress() {
        const bar = document.getElementById('trace-progress');
        if (bar) bar.style.display = 'none';
    }

    /* ---- Cancel ---- */
    function cancel() {
        clearHighlight();
        if (state.viewport) state.viewport.style.overflow = '';
        hideProgress();
        const modal = document.getElementById('modal-ping-trace');
        if (modal) modal.style.display = 'none';
        state.active = false;
        resetState();
    }

    /* ---- Graph / BFS (unchanged) ---- */
    function buildGraph() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return new Map();
        const graph = new Map();
        canvas.querySelectorAll('.line').forEach(line => {
            const parentId = parseInt(line.getAttribute('data-parent'), 10);
            const linkedId = parseInt(line.getAttribute('data-linked'), 10);
            if (parentId && linkedId) {
                addEdge(graph, parentId, linkedId);
                addEdge(graph, linkedId, parentId);
            }
        });
        return graph;
    }

    function addEdge(graph, from, to) {
        if (!graph.has(from)) graph.set(from, new Set());
        graph.get(from).add(to);
    }

    function bfs(sourceId, targetId) {
        const graph = buildGraph();
        if (!graph.has(sourceId) || !graph.has(targetId)) return null;
        if (sourceId === targetId) return [sourceId];
        const visited = new Set([sourceId]);
        const queue = [[sourceId]];
        while (queue.length > 0) {
            const path = queue.shift();
            const node = path[path.length - 1];
            if (node === targetId) return path;
            const neighbors = graph.get(node);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push([...path, neighbor]);
                    }
                }
            }
        }
        return null;
    }

    /* ---- Highlighting ---- */
    function highlightPath(path) {
        const canvas = document.getElementById('canvas');
        if (!canvas || !path || path.length < 2) return;
        const pairs = new Set();
        for (let i = 0; i < path.length - 1; i++) {
            pairs.add(path[i] + '-' + path[i + 1]);
            pairs.add(path[i + 1] + '-' + path[i]);
        }
        canvas.querySelectorAll('.line').forEach(line => {
            const p = parseInt(line.getAttribute('data-parent'), 10);
            const l = parseInt(line.getAttribute('data-linked'), 10);
            if (pairs.has(p + '-' + l)) line.classList.add('trace-highlight');
        });
    }

    function clearHighlight() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        canvas.querySelectorAll('.line.trace-highlight, .line.trace-verified').forEach(l => {
            l.classList.remove('trace-highlight', 'trace-verified');
        });
    }

    /**
     * Mark the line between the previous device and the current one as verified.
     * @param {number[]} path - full device ID path
     * @param {number} hopNum - current hop number (1-based, >= 2)
     */
    function verifyHopLine(path, hopNum) {
        if (hopNum < 2 || hopNum > path.length) return;
        const fromId = path[hopNum - 2];
        const toId = path[hopNum - 1];
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        canvas.querySelectorAll('.line.trace-highlight').forEach(line => {
            const p = parseInt(line.getAttribute('data-parent'), 10);
            const l = parseInt(line.getAttribute('data-linked'), 10);
            if ((p === fromId && l === toId) || (p === toId && l === fromId)) {
                line.classList.remove('trace-highlight');
                line.classList.add('trace-verified');
            }
        });
    }

    /* ---- Results card ---- */
    function addHopCard(hopNum, name, ip, success, timeMs) {
        const container = document.getElementById('trace-results');
        if (!container) return;

        let badgeClass, badgeText;
        if (success) {
            badgeClass = 'success';
            badgeText = timeMs ? timeMs + ' ms' : 'Éxito';
        } else if (timeMs === null) {
            badgeClass = 'timeout';
            badgeText = 'Sin respuesta';
        } else {
            badgeClass = 'fail';
            badgeText = 'Error';
        }
        const timeDisplay = success && timeMs ? timeMs + ' ms' : '';

        const card = document.createElement('div');
        card.className = 'trace-hop-card';
        card.innerHTML =
            '<div class="trace-hop-num">' + hopNum + '</div>' +
            '<div class="trace-hop-info">' +
                '<div class="trace-hop-name">' + escHtml(name) + '</div>' +
                '<div class="trace-hop-ip">' + escHtml(ip) + '</div>' +
            '</div>' +
            '<div class="trace-hop-status">' +
                '<span class="trace-hop-badge ' + badgeClass + '">' + badgeText + '</span>' +
                (timeDisplay ? '<span class="trace-hop-time">' + timeDisplay + '</span>' : '') +
            '</div>';
        container.appendChild(card);
        container.scrollTop = container.scrollHeight;
    }

    function getDeviceInfo(el) {
        if (!el || !el.dataset) return null;
        return {
            id: parseInt(el.dataset.id, 10),
            name: el.dataset.name || 'Sin nombre',
            ip: el.dataset.ip || '',
        };
    }

    /* ---- Helpers ---- */
    function resetState() {
        state.sourceEl = null;
        state.targetEl = null;
        state.running = false;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escHtmlAttr(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return { init, openModal, cancel };
})();

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PingTrace.init());
} else {
    PingTrace.init();
}
