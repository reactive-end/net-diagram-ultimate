/**
 * PingSerie module — shared ping-series via Web Workers.
 * Parallel pings with status badges, ms display, and infinite-loop guard.
 */
const PingSerie = (() => {
    const H = DOMHelpers;
    let pingInterval = null;
    let activeWorkers = [];

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
        document.getElementById('btn-start-ping-serie').style.display = 'none';
        document.getElementById('btn-stop-ping-serie').style.display = '';
        runPingSerie();
        if (document.getElementById('infinite-ping').checked) {
            pingInterval = setInterval(runPingSerie, 10000);
        }
    }

    function stopPinging() {
        if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
        terminateAllWorkers();
        document.getElementById('btn-start-ping-serie').style.display = '';
        document.getElementById('btn-stop-ping-serie').style.display = 'none';
    }

    function close() {
        stopPinging();
        document.querySelectorAll('.ping-serie-item').forEach(item => {
            item.className = 'ping-serie-item ping-idle';
            setBadge(item, 'idle', 'Sin conexión');
        });
        const m = document.getElementById('modal-ping-serie');
        if (m) m.style.display = 'none';
    }

    function terminateAllWorkers() {
        activeWorkers.forEach(w => { try { w.terminate(); } catch(e) {} });
        activeWorkers = [];
    }

    function runPingSerie() {
        // Terminate any still-running workers from previous cycle
        terminateAllWorkers();

        const items = [...document.querySelectorAll('#ping-serie-list .ping-serie-item')];
        if (items.length === 0) return;

        items.forEach(item => {
            // Skip if already in verifying/pinging state (infinite loop guard)
            if (item.classList.contains('ping-pinging')) return;

            const ip = item.querySelector('.ping-ip').textContent;
            item.className = 'ping-serie-item ping-pinging';
            setBadge(item, 'pinging', 'Verificando...');

            const worker = new Worker(document.querySelector('script[data-worker="ping"]')?.dataset.src || '/assets/js/workers/ping-worker.js');
            activeWorkers.push(worker);

            worker.postMessage({ ip });
            worker.addEventListener('message', (e) => {
                const { success, time_ms } = e.data;
                if (success) {
                    item.className = 'ping-serie-item ping-success';
                    setBadge(item, 'success', (time_ms ? time_ms + ' ms' : 'Conectado'));
                } else if (time_ms === null) {
                    item.className = 'ping-serie-item ping-timeout';
                    setBadge(item, 'timeout', 'Sin respuesta');
                } else {
                    item.className = 'ping-serie-item ping-fail';
                    setBadge(item, 'fail', 'Error');
                }
                worker.terminate();
                activeWorkers = activeWorkers.filter(w => w !== worker);
            });

            worker.addEventListener('error', () => {
                item.className = 'ping-serie-item ping-fail';
                setBadge(item, 'fail', 'Error');
                worker.terminate();
                activeWorkers = activeWorkers.filter(w => w !== worker);
            });
        });
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
