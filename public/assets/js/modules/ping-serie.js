/**
 * PingSerie module — shared ping-series via Web Workers.
 * Parallel pings with status badges, ms display, and infinite-loop guard.
 *
 * Each item tracks its own state via dataset flags:
 *   pingPending — '1' while a worker is running for this item
 *   hasResult   — '1' after first ever completed result (success/fail/timeout/error)
 */
const PingSerie = (() => {
    const H = DOMHelpers;
    let pingInterval = null;
    let activeWorkers = [];       // entries: { worker, item }
    let singleRunPending = 0;    // count of unfinished workers in single-shot mode
    let infiniteMode = false;

    function init() {
        const openBtn = document.getElementById('btn-ping-serie');
        if (openBtn) openBtn.addEventListener('click', () => {
            const m = document.getElementById('modal-ping-serie');
            if (m) m.style.display = 'flex';
        });

        const addBtn = document.getElementById('btn-add-ip');
        if (addBtn) addBtn.addEventListener('click', addIp);

        const startBtn = document.getElementById('btn-start-ping-serie');
        if (startBtn) startBtn.addEventListener('click', startPinging);

        const stopBtn = document.getElementById('btn-stop-ping-serie');
        if (stopBtn) stopBtn.addEventListener('click', stopPinging);

        const list = document.getElementById('ping-serie-list');
        if (list) list.addEventListener('click', handleListItemClick);

        const editForm = document.getElementById('form-edit-ip');
        if (editForm) editForm.addEventListener('submit', handleEditSubmit);
    }

    async function addIp() {
        const hiddenIp = document.getElementById('new-ip-hidden');
        const ip = hiddenIp ? hiddenIp.value : (document.getElementById('new-ip-address')?.value || '').trim();
        const name = document.getElementById('new-ip-name').value.trim();
        const contact = document.getElementById('new-ip-contact').value.trim();
        if (!ip || ip === '0.0.0.0') { H.toast('Ingresa una dirección IP.', 'error'); return; }

        const addBtn = document.getElementById('btn-add-ip');
        if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Agregando...'; }

        try {
            const res = await API.post('/api/ip-serie', { ip, nombre_asociado: name, numero_contacto: contact });
            if (res.success) {
                addIpCard(res.data.id, ip, name, contact);
                document.querySelectorAll('.ping-serie-add .ip-octet').forEach(o => o.value = '');
                if (hiddenIp) hiddenIp.value = '';
                document.getElementById('new-ip-name').value = '';
                document.getElementById('new-ip-contact').value = '';
                H.toast('IP agregada.', 'success');
            }
        } catch (err) { H.toast('Error: ' + err.message, 'error'); }

        if (addBtn) { addBtn.disabled = false; addBtn.textContent = 'Agregar IP'; }
    }

    function addIpCard(id, ip, name, contact) {
        const list = document.getElementById('ping-serie-list');
        if (!list) return;
        const contactDisplay = (contact && contact !== '0') ? contact : 'Sin Telefono Asociado';
        const div = document.createElement('div');
        div.className = 'ping-serie-item ping-idle';
        div.dataset.id = id;
        div.innerHTML =
            '<div class="ping-ip-row">' +
                '<span class="ping-status-badge badge-idle">Sin conexión</span>' +
                '<span class="ping-ip">' + escHtml(ip) + '</span>' +
            '</div>' +
            '<span class="ping-name">' + escHtml(name) + '</span>' +
            '<span class="ping-contact">' + escHtml(contactDisplay) + '</span>' +
            '<div class="ping-actions">' +
                '<button class="btn-icon edit-ip" title="Editar">✎</button>' +
                '<button class="btn-icon delete-ip" title="Eliminar">✕</button>' +
            '</div>';
        list.appendChild(div);
    }

    function handleListItemClick(e) {
        const item = e.target.closest('.ping-serie-item');
        if (!item) return;
        if (e.target.classList.contains('delete-ip')) deleteIp(item);
        else if (e.target.classList.contains('edit-ip')) openEditModal(item);
    }

    async function deleteIp(item) {
        const id = item.dataset.id;
        try { await API.del('/api/ip-serie/' + id); item.remove(); H.toast('IP eliminada.', 'info'); }
        catch (err) { H.toast('Error: ' + err.message, 'error'); }
    }

    function openEditModal(item) {
        const id = item.dataset.id;
        const ip = item.querySelector('.ping-ip').textContent;
        const name = item.querySelector('.ping-name').textContent;
        const contactEl = item.querySelector('.ping-contact');
        let contact = contactEl ? contactEl.textContent : '';
        if (contact === 'Sin Telefono Asociado') contact = '';
        document.getElementById('edit-ip-id').value = id;
        document.getElementById('edit-ip-address').value = ip;
        document.getElementById('edit-ip-name').value = name;
        document.getElementById('edit-ip-contact').value = contact;
        document.getElementById('modal-edit-ip').style.display = 'flex';
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Guardando...'; }

        const id = document.getElementById('edit-ip-id').value;
        const ip = document.getElementById('edit-ip-address').value.trim();
        const name = document.getElementById('edit-ip-name').value.trim();
        const contact = document.getElementById('edit-ip-contact').value.trim();
        if (!ip) { H.toast('La IP es requerida.', 'error'); if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar Cambios'; } return; }
        try {
            const res = await API.put('/api/ip-serie/' + id, { ip, nombre_asociado: name, numero_contacto: contact });
            if (res.success) {
                const item = document.querySelector('.ping-serie-item[data-id="' + id + '"]');
                if (item) {
                    item.querySelector('.ping-ip').textContent = ip;
                    item.querySelector('.ping-name').textContent = name;
                    const cd = (contact && contact !== '0') ? contact : 'Sin Telefono Asociado';
                    item.querySelector('.ping-contact').textContent = cd;
                }
                document.getElementById('modal-edit-ip').style.display = 'none';
                H.toast('IP actualizada.', 'success');
            }
        } catch (err) { H.toast('Error: ' + err.message, 'error'); }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar Cambios'; }
    }

    // ---- Ping with Web Workers (truly parallel) ----
    function startPinging() {
        const infiniteChk = document.getElementById('infinite-ping');
        infiniteMode = infiniteChk && infiniteChk.checked;

        const startBtn = document.getElementById('btn-start-ping-serie');
        const stopBtn = document.getElementById('btn-stop-ping-serie');

        if (infiniteMode) {
            // Ignore duplicate starts when already running in infinite mode
            if (pingInterval !== null) return;
            startBtn.style.display = 'none';
            stopBtn.style.display = '';
            runPingSerie();
            pingInterval = setInterval(() => runPingSerie(), 10000);
        } else {
            // Single-shot mode: no Stop button shown
            startBtn.disabled = true;
            startBtn.textContent = 'Ejecutando...';
            stopBtn.style.display = 'none';
            singleRunPending = 0;
            runPingSerie(true);
        }
    }

    function stopPinging() {
        if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }

        // Terminate every active worker and clear per-item pending flags
        activeWorkers.forEach(entry => {
            try { entry.worker.terminate(); } catch (e) {}
            if (entry.item) {
                entry.item.dataset.pingPending = '0';
                entry.item.classList.remove('is-checking');
            }
        });
        activeWorkers = [];
        singleRunPending = 0;

        // Restore buttons — do NOT wipe last known results from cards
        const startBtn = document.getElementById('btn-start-ping-serie');
        const stopBtn = document.getElementById('btn-stop-ping-serie');
        if (startBtn) {
            startBtn.style.display = '';
            startBtn.disabled = false;
            startBtn.textContent = 'Iniciar Ping';
        }
        if (stopBtn) stopBtn.style.display = 'none';
    }

    /**
     * Close the modal and reset all items back to idle.
     */
    function close() {
        stopPinging();
        document.querySelectorAll('.ping-serie-item').forEach(item => {
            item.className = 'ping-serie-item ping-idle';
            item.dataset.pingPending = '0';
            delete item.dataset.hasResult;
            setBadge(item, 'idle', 'Sin conexión');
        });
        const m = document.getElementById('modal-ping-serie');
        if (m) m.style.display = 'none';
    }

    /**
     * Launch a ping worker for each non-pending item.
     *
     * @param {boolean} isSingleRun - When true, track completion count and
     *                                auto-restore the Start button when all finish.
     */
    function runPingSerie(isSingleRun = false) {
        const items = [...document.querySelectorAll('#ping-serie-list .ping-serie-item')];
        if (items.length === 0) {
            if (isSingleRun) restoreStartButton();
            return;
        }

        let launchedCount = 0;

        items.forEach(item => {
            // Skip items that already have a pending worker
            if (item.dataset.pingPending === '1') return;

            const ip = item.querySelector('.ping-ip').textContent;

            // Mark this item as having a worker in flight
            item.dataset.pingPending = '1';

            // Only show 'Verificando...' on first-ever runs (no prior result)
            if (!item.dataset.hasResult) {
                item.className = 'ping-serie-item ping-pinging';
                setBadge(item, 'pinging', 'Verificando...');
            } else {
                // Rerun: keep existing badge/state, just add a subtle checking class
                item.classList.add('is-checking');
            }

            const worker = new Worker(
                document.querySelector('script[data-worker="ping"]')?.dataset.src
                || '/assets/js/workers/ping-worker.js'
            );

            const entry = { worker, item };
            activeWorkers.push(entry);
            launchedCount++;

            worker.postMessage({ ip, base: window.BASE_PATH || '' });

            worker.addEventListener('message', (e) => {
                const { success, time_ms } = e.data;

                // Clear pending and transient checking class
                item.dataset.pingPending = '0';
                item.dataset.hasResult = '1';
                item.classList.remove('is-checking');

                if (success) {
                    item.className = 'ping-serie-item ping-success';
                    const hasTime = time_ms !== null && time_ms !== undefined;
                    setBadge(item, 'success', (hasTime ? time_ms + ' ms' : 'Conectado'));
                } else if (time_ms === null) {
                    item.className = 'ping-serie-item ping-timeout';
                    setBadge(item, 'timeout', 'Sin respuesta');
                } else {
                    item.className = 'ping-serie-item ping-fail';
                    setBadge(item, 'fail', 'Error');
                }

                worker.terminate();
                activeWorkers = activeWorkers.filter(w => w !== entry);

                if (isSingleRun) {
                    singleRunPending--;
                    if (singleRunPending <= 0) restoreStartButton();
                }
            });

            worker.addEventListener('error', () => {
                item.dataset.pingPending = '0';
                item.dataset.hasResult = '1';
                item.classList.remove('is-checking');
                item.className = 'ping-serie-item ping-fail';
                setBadge(item, 'fail', 'Error');

                worker.terminate();
                activeWorkers = activeWorkers.filter(w => w !== entry);

                if (isSingleRun) {
                    singleRunPending--;
                    if (singleRunPending <= 0) restoreStartButton();
                }
            });
        });

        if (isSingleRun) {
            singleRunPending = launchedCount;
            if (launchedCount === 0) restoreStartButton();
        }
    }

    function restoreStartButton() {
        const startBtn = document.getElementById('btn-start-ping-serie');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Iniciar Ping';
        }
    }

    function setBadge(item, state, text) {
        let badge = item.querySelector('.ping-status-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'ping-status-badge';
            item.querySelector('.ping-ip-row')?.prepend(badge);
        }
        badge.className = 'ping-status-badge badge-' + state;
        badge.textContent = text;
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    return { init, close };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PingSerie.init());
} else {
    PingSerie.init();
}
