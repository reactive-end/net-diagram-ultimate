/**
 * Ping module - execute ping tests on devices and manage ping series.
 */
const PingModule = (() => {
    const H = DOMHelpers;

    /**
     * Run a single ping test (6 attempts).
     * @param {string} ip - IP address to ping
     * @param {string} label - display label
     * @param {HTMLElement} resultsEl - container for results
     */
    async function runSinglePing(ip, label, resultsEl) {
        if (!resultsEl) return;

        resultsEl.innerHTML = '';
        resultsEl.innerHTML += '<div class="ping-result">Pingeando ' + label + ' (' + ip + ')...</div>';

        for (let i = 0; i < 6; i++) {
            try {
                const res = await API.post('/api/ping', { ip });
                const status = res.data.success ? 'ping-success' : 'ping-fail';
                const time = res.data.time_ms ? res.data.time_ms + 'ms' : 'timeout';
                resultsEl.innerHTML += '<div class="ping-result ' + status + '">#' + (i + 1) + ': ' + time + '</div>';
            } catch (err) {
                resultsEl.innerHTML += '<div class="ping-result ping-fail">#' + (i + 1) + ': error de conexion</div>';
            }
        }
    }

    /**
     * Open the ping test modal for a device element.
     */
    async function openPingModal(el) {
        const ip = el.dataset.ip;
        const name = el.dataset.name || 'Dispositivo';

        if (!ip) {
            H.toast('Este dispositivo no tiene IP configurada.', 'error');
            return;
        }

        // Validate IP
        if (!isValidIp(ip)) {
            H.toast('La IP del dispositivo no es valida.', 'error');
            return;
        }

        const targetEl = H.$('ping-target-name');
        if (targetEl) targetEl.textContent = name + ' (' + ip + ')';

        H.$('modal-ping').style.display = 'flex';

        const resultsEl = H.$('ping-results');
        const startBtn = H.$('btn-start-ping');

        // Remove old listeners
        const newBtn = startBtn.cloneNode(true);
        startBtn.parentNode.replaceChild(newBtn, startBtn);

        newBtn.addEventListener('click', () => {
            runSinglePing(ip, name, resultsEl);
        });
    }

    /**
     * Batch ping all IPs in the IP series.
     */
    async function runBatchPing(ips, resultsEl) {
        if (!resultsEl) return;
        resultsEl.innerHTML = '';

        for (const item of ips) {
            const ip = item.ip || item.querySelector('.ping-ip').textContent;
            const name = item.name || '';

            try {
                const res = await API.post('/api/ping', { ip });
                const status = res.data.success ? 'ping-success' : 'ping-fail';
                const time = res.data.success ? (res.data.time_ms || '?') + 'ms' : 'timeout';
                resultsEl.innerHTML += '<div class="ping-result ' + status + '"><strong>' + ip + '</strong> — ' + time + '</div>';
            } catch (err) {
                resultsEl.innerHTML += '<div class="ping-result ping-fail"><strong>' + ip + '</strong> — error</div>';
            }
        }
    }

    /**
     * Open a device's IP in the browser.
     */
    function openDeviceInterface(el) {
        const ip = el.dataset.ip;
        if (!ip) {
            H.toast('Este dispositivo no tiene IP configurada.', 'error');
            return;
        }
        if (!isValidIp(ip)) {
            H.toast('IP no valida.', 'error');
            return;
        }
        window.open('http://' + ip, '_blank');
    }

    function isValidIp(ip) {
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        return parts.every(p => {
            const n = parseInt(p, 10);
            return !isNaN(n) && n >= 0 && n <= 255;
        });
    }

    return { runSinglePing, openPingModal, runBatchPing, openDeviceInterface, isValidIp };
})();
