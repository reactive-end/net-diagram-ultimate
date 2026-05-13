/**
 * ContextMenu module - right-click context menus for objects and lines.
 */
const ContextMenu = (() => {
    const H = DOMHelpers;
    let currentTarget = null;

    function init() {
        // Hide context menus on any click outside
        document.addEventListener('click', hideAllMenus);

        // Object context menu actions
        document.querySelectorAll('#context-menu-object .context-item').forEach(item => {
            item.addEventListener('click', () => {
                handleAction(item.dataset.action, currentTarget);
                hideAllMenus();
            });
        });

        // Line context menu actions
        document.querySelectorAll('#context-menu-line .context-item').forEach(item => {
            item.addEventListener('click', () => {
                handleLineAction(item.dataset.action, currentTarget);
                hideAllMenus();
            });
        });
    }

    function showObjectMenu(e, el) {
        e.preventDefault();
        hideAllMenus();
        currentTarget = el;

        const menu = H.$('context-menu-object');
        positionMenu(menu, e.clientX, e.clientY);
    }

    function showLineMenu(e, el) {
        e.preventDefault();
        hideAllMenus();
        currentTarget = el;

        const menu = H.$('context-menu-line');
        positionMenu(menu, e.clientX, e.clientY);
    }

    function positionMenu(menu, x, y) {
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // Keep menu within viewport
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
    }

    function hideAllMenus() {
        const menus = document.querySelectorAll('.context-menu');
        menus.forEach(m => { m.style.display = 'none'; });
    }

    function handleAction(action, el) {
        if (!el) return;

        switch (action) {
            case 'info':
                showInfoPanel(el);
                break;
            case 'ping':
                PingModule.openPingModal(el);
                break;
            case 'link':
                LinkSystem.startLinking(el);
                break;
            case 'open-ip':
                PingModule.openDeviceInterface(el);
                break;
            case 'edit':
                DeviceForms.showEditForm(el);
                break;
            case 'clone':
                cloneDevice(el);
                break;
            case 'delete-object':
                deleteObject(el);
                break;
        }
    }

    function handleLineAction(action, el) {
        if (!el) return;
        if (!el.classList.contains('line')) return;
        if (action === 'delete-line') {
            UIModals.confirm({
                title: 'Confirmar eliminación',
                message: '¿Seguro que deseas eliminar este enlace? Esta acción es irreversible.',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                onConfirm: () => LinkSystem.deleteLinePair(el)
            });
        }
    }

    function showInfoPanel(el) {
        const body = H.$('info-panel-body');
        const panel = H.$('info-panel');
        if (!body || !panel) return;

        const type = el.dataset.type || '';
        let html = '';
        html += '<div class="info-row"><span class="info-label">Tipo</span><span class="info-value">' + Devices.deviceLabel(type) + '</span></div>';
        html += '<div class="info-row"><span class="info-label">ID</span><span class="info-value">#' + el.dataset.id + '</span></div>';
        html += '<div class="info-row"><span class="info-label">Nombre</span><span class="info-value">' + (el.dataset.name || '-') + '</span></div>';
        html += '<div class="info-row"><span class="info-label">IP</span><span class="info-value">' + (el.dataset.ip || '-') + '</span></div>';

        if (type === 'antenna') {
            html += '<div class="info-row"><span class="info-label">SSID</span><span class="info-value">' + (el.dataset.ssid || '-') + '</span></div>';
            html += '<div class="info-row"><span class="info-label">Frecuencia</span><span class="info-value">' + (el.dataset.frequency || '-') + ' MHz</span></div>';
            html += '<div class="info-row"><span class="info-label">Modo</span><span class="info-value">' + (el.dataset.mode === '1' ? 'Station' : 'AP') + '</span></div>';
            html += '<div class="info-row"><span class="info-label">Banda</span><span class="info-value">' + (el.dataset.band || '-') + '</span></div>';
        } else if (type === 'router' || type === 'switch') {
            html += '<div class="info-row"><span class="info-label">Puertos</span><span class="info-value">' + (el.dataset.ports || '-') + '</span></div>';
        } else if (type === 'modem') {
            html += '<div class="info-row"><span class="info-label">Servicio</span><span class="info-value">' + (el.dataset.service || '-') + '</span></div>';
            html += '<div class="info-row"><span class="info-label">VLAN</span><span class="info-value">' + (el.dataset.vlan || '-') + '</span></div>';
        }

        body.innerHTML = html;
        panel.style.display = 'block';
    }

    function cloneDevice(el) {
        const type = el.dataset.type;
        const props = {};
        // Copy all data attributes
        Object.keys(el.dataset).forEach(key => {
            if (key !== 'id') props[key] = el.dataset[key];
        });
        props.objectID = DiagramState.nextObjectId();

        const x = (parseInt(el.style.left) || 0) + 40;
        const y = (parseInt(el.style.top) || 0) + 40;

        Devices.createDevice(type, props, x, y);
        H.toast(Devices.deviceLabel(type) + ' clonado.', 'success');
    }

    function deleteObject(el) {
        UIModals.confirm({
            title: 'Confirmar eliminación',
            message: '¿Seguro que deseas eliminar este dispositivo? Esta acción es irreversible.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onConfirm: () => {
                const objectId = parseInt(el.dataset.id);
                LinkSystem.deleteLinesForObject(objectId);
                el.remove();
                DiagramState.markDirty();
                H.toast('Dispositivo eliminado.', 'info');
            }
        });
    }

    return { init, showObjectMenu, showLineMenu };
})();
