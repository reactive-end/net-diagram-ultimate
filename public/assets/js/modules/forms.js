/**
 * Forms module - dynamic device creation and edit form generation.
 */
const DeviceForms = (() => {
    const H = DOMHelpers;

    /** Get the form HTML for a device type */
    function getCreateForm(type) {
        const forms = {
            antenna: `
                <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" required placeholder="Nombre de la antena"></div>
                <div class="form-group"><label>SSID</label><input type="text" class="form-input" name="ssid" placeholder="SSID"></div>
                <div class="form-group"><label>Dirección IP</label><div class="ip-input-container"><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="0" placeholder="192"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="1" placeholder="168"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="2" placeholder="1"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="3" placeholder="1"></div><input type="hidden" name="ip" class="ip-hidden"></div>
                <div class="form-group"><label>Frecuencia</label><select class="form-input" name="frecuency"><option value="2400">2.4 GHz</option><option value="5000">5 GHz</option><option value="5200">5.2 GHz</option><option value="5800">5.8 GHz</option></select></div>
                <div class="form-group"><label>Modo</label><select class="form-input" name="mode"><option value="0">AP</option><option value="1">Station</option></select></div>
                <div class="form-group"><label>Banda</label><select class="form-input" name="band"><option value="20">20 MHz</option><option value="40">40 MHz</option><option value="80">80 MHz</option><option value="160">160 MHz</option></select></div>
                <button type="submit" class="btn btn-primary btn-full">Crear Antena</button>
            `,
            router: `
                <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" required placeholder="Nombre del router"></div>
                <div class="form-group"><label>Dirección IP</label><div class="ip-input-container"><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="0" placeholder="192"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="1" placeholder="168"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="2" placeholder="1"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="3" placeholder="1"></div><input type="hidden" name="ip" class="ip-hidden"></div>
                <div class="form-group"><label>Puertos</label><input type="number" class="form-input" name="ports" value="4" min="0"></div>
                <button type="submit" class="btn btn-primary btn-full">Crear Router</button>
            `,
            switch: `
                <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" required placeholder="Nombre del switch"></div>
                <div class="form-group"><label>Dirección IP</label><div class="ip-input-container"><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="0" placeholder="192"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="1" placeholder="168"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="2" placeholder="1"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="3" placeholder="1"></div><input type="hidden" name="ip" class="ip-hidden"></div>
                <div class="form-group"><label>Puertos</label><input type="number" class="form-input" name="ports" value="8" min="0"></div>
                <button type="submit" class="btn btn-primary btn-full">Crear Switch</button>
            `,
            modem: `
                <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" required placeholder="Nombre del modem"></div>
                <div class="form-group"><label>Dirección IP</label><div class="ip-input-container"><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="0" placeholder="192"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="1" placeholder="168"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="2" placeholder="1"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="3" placeholder="1"></div><input type="hidden" name="ip" class="ip-hidden"></div>
                <div class="form-group"><label>Servicio</label><input type="text" class="form-input" name="service" placeholder="Ej: Internet Fibra"></div>
                <div class="form-group"><label>VLAN</label><input type="text" class="form-input" name="vlan" placeholder="VLAN ID"></div>
                <button type="submit" class="btn btn-primary btn-full">Crear Modem</button>
            `,
            computer: `
                <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" required placeholder="Nombre de la computadora"></div>
                <div class="form-group"><label>Dirección IP</label><div class="ip-input-container"><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="0" placeholder="192"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="1" placeholder="168"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="2" placeholder="1"><span class="ip-dot">.</span><input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="3" placeholder="1"></div><input type="hidden" name="ip" class="ip-hidden"></div>
                <button type="submit" class="btn btn-primary btn-full">Crear Computadora</button>
            `,
        };
        return forms[type] || '<p>Tipo no soportado.</p>';
    }

    /** Show the create device form for a type */
    function showCreateForm(type) {
        const title = document.getElementById('device-form-title');
        const body = document.getElementById('device-form-body');

        if (title) title.textContent = 'Crear ' + Devices.deviceLabel(type);
        if (body) {
            body.innerHTML = '<form id="form-create-device">' + getCreateForm(type) + '</form>';
            // Re-init IP inputs for dynamic content (defer to allow DOM parse)
            setTimeout(() => { if (typeof DOMHelpers !== 'undefined') DOMHelpers.initIpInputs(); }, 10);
            const form = document.getElementById('form-create-device');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    handleCreateSubmit(type, form);
                });
            }
        }
        H.$('modal-device-form').style.display = 'flex';
    }

    /** Handle create device form submission */
    function handleCreateSubmit(type, form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creando...'; }

        const formData = new FormData(form);
        const props = {};
        formData.forEach((val, key) => { props[key] = val; });

        // Set position at center of visible canvas area
        const viewport = H.$('canvas-viewport');
        const x = viewport ? viewport.scrollLeft + 150 : 150;
        const y = viewport ? viewport.scrollTop + 150 : 150;

        Devices.createDevice(type, props, x, y);
        H.$('modal-device-form').style.display = 'none';

        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Crear ' + Devices.deviceLabel(type); }
        H.toast(Devices.deviceLabel(type) + ' creado correctamente.', 'success');
    }

    /** Get and populate the edit form for a device */
    function showEditForm(el) {
        const type = el.dataset.type;
        const body = document.getElementById('edit-device-body');
        if (!body) return;

        let formHtml = '';

        if (type === 'antenna') {
            formHtml = `
                <form id="form-edit-device">
                    <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" value="${esc(el.dataset.name)}"></div>
                    <div class="form-group"><label>SSID</label><input type="text" class="form-input" name="ssid" value="${esc(el.dataset.ssid)}"></div>
                    <div class="form-group"><label>IP</label><input type="text" class="form-input" name="ip" value="${esc(el.dataset.ip)}"></div>
                    <div class="form-group"><label>Frecuencia</label><select class="form-input" name="frecuency"><option value="2400" ${el.dataset.frequency === '2400' ? 'selected' : ''}>2.4 GHz</option><option value="5000" ${el.dataset.frequency === '5000' ? 'selected' : ''}>5 GHz</option><option value="5200" ${el.dataset.frequency === '5200' ? 'selected' : ''}>5.2 GHz</option><option value="5800" ${el.dataset.frequency === '5800' ? 'selected' : ''}>5.8 GHz</option></select></div>
                    <div class="form-group"><label>Modo</label><select class="form-input" name="mode"><option value="0" ${el.dataset.mode === '0' ? 'selected' : ''}>AP</option><option value="1" ${el.dataset.mode === '1' ? 'selected' : ''}>Station</option></select></div>
                    <div class="form-group"><label>Banda</label><select class="form-input" name="band"><option value="20" ${el.dataset.band === '20' ? 'selected' : ''}>20 MHz</option><option value="40" ${el.dataset.band === '40' ? 'selected' : ''}>40 MHz</option><option value="80" ${el.dataset.band === '80' ? 'selected' : ''}>80 MHz</option><option value="160" ${el.dataset.band === '160' ? 'selected' : ''}>160 MHz</option></select></div>
                    <button type="submit" class="btn btn-primary btn-full">Guardar Cambios</button>
                </form>
            `;
        } else if (type === 'router') {
            formHtml = `
                <form id="form-edit-device">
                    <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" value="${esc(el.dataset.name)}"></div>
                    <div class="form-group"><label>IP</label><input type="text" class="form-input" name="ip" value="${esc(el.dataset.ip)}"></div>
                    <div class="form-group"><label>Puertos</label><input type="number" class="form-input" name="ports" value="${esc(el.dataset.ports)}"></div>
                    <button type="submit" class="btn btn-primary btn-full">Guardar Cambios</button>
                </form>
            `;
        } else if (type === 'switch') {
            formHtml = `
                <form id="form-edit-device">
                    <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" value="${esc(el.dataset.name)}"></div>
                    <div class="form-group"><label>IP</label><input type="text" class="form-input" name="ip" value="${esc(el.dataset.ip)}"></div>
                    <div class="form-group"><label>Puertos</label><input type="number" class="form-input" name="ports" value="${esc(el.dataset.ports)}"></div>
                    <button type="submit" class="btn btn-primary btn-full">Guardar Cambios</button>
                </form>
            `;
        } else if (type === 'modem') {
            formHtml = `
                <form id="form-edit-device">
                    <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" value="${esc(el.dataset.name)}"></div>
                    <div class="form-group"><label>IP</label><input type="text" class="form-input" name="ip" value="${esc(el.dataset.ip)}"></div>
                    <div class="form-group"><label>Servicio</label><input type="text" class="form-input" name="service" value="${esc(el.dataset.service)}"></div>
                    <div class="form-group"><label>VLAN</label><input type="text" class="form-input" name="vlan" value="${esc(el.dataset.vlan)}"></div>
                    <button type="submit" class="btn btn-primary btn-full">Guardar Cambios</button>
                </form>
            `;
        } else if (type === 'computer') {
            formHtml = `
                <form id="form-edit-device">
                    <div class="form-group"><label>Nombre</label><input type="text" class="form-input" name="name" value="${esc(el.dataset.name)}"></div>
                    <div class="form-group"><label>IP</label><input type="text" class="form-input" name="ip" value="${esc(el.dataset.ip)}"></div>
                    <button type="submit" class="btn btn-primary btn-full">Guardar Cambios</button>
                </form>
            `;
        }

        body.innerHTML = formHtml;

        const form = document.getElementById('form-edit-device');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Guardando...'; }

                const fd = new FormData(form);
                const props = {};
                fd.forEach((val, key) => { props[key] = val; });
                Devices.updateDeviceProps(el, props);
                H.$('modal-edit-device').style.display = 'none';

                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar Cambios'; }
                H.toast('Dispositivo actualizado.', 'success');
            });
        }

        H.$('modal-edit-device').style.display = 'flex';
    }

    /** Get the selected device type from the selector */
    function getSelectedType() {
        const select = H.$('device-type');
        return select ? select.value : '';
    }

    // Helper: escape HTML
    function esc(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return { showCreateForm, showEditForm, getSelectedType };
})();
