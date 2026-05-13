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

        // Note context menu actions
        document.querySelectorAll('#context-menu-note .context-item').forEach(item => {
            item.addEventListener('click', () => {
                handleNoteAction(item.dataset.action, currentTarget);
                hideAllMenus();
            });
        });

        // Box context menu actions
        document.querySelectorAll('#context-menu-box .context-item').forEach(item => {
            item.addEventListener('click', () => {
                handleBoxAction(item.dataset.action, currentTarget);
                hideAllMenus();
            });
        });

        // Note modal close — clear any edit state
        const noteModal = H.$('modal-note');
        if (noteModal) {
            const closeBtns = noteModal.querySelectorAll('.modal-close');
            closeBtns.forEach(btn => {
                btn.addEventListener('click', clearNoteEditState);
            });
            // Also clear on overlay click
            noteModal.addEventListener('click', (e) => {
                if (e.target === noteModal) clearNoteEditState();
            });
        }

        // Color picker modal close — reset title
        const colorModal = H.$('modal-color-picker');
        if (colorModal) {
            const closeBtns = colorModal.querySelectorAll('.modal-close');
            closeBtns.forEach(btn => {
                btn.addEventListener('click', resetColorPickerState);
            });
            colorModal.addEventListener('click', (e) => {
                if (e.target === colorModal) resetColorPickerState();
            });
        }
    }

    function clearNoteEditState() {
        window._editingNoteElement = null;
        const title = H.$('note-modal-title');
        if (title) title.textContent = 'Agregar Nota';
    }

    function resetColorPickerState() {
        const title = H.$('modal-color-picker').querySelector('h2');
        if (title) title.textContent = 'Color de Caja';
    }

    function showObjectMenu(e, el) {
        e.preventDefault();
        hideAllMenus();
        currentTarget = el;

        const menu = H.$('context-menu-object');
        positionMenu(menu, e.clientX, e.clientY);
    }

    function showNoteMenu(e, el) {
        e.preventDefault();
        hideAllMenus();
        currentTarget = el;

        const menu = H.$('context-menu-note');
        positionMenu(menu, e.clientX, e.clientY);
    }

    function showBoxMenu(e, el) {
        e.preventDefault();
        hideAllMenus();
        currentTarget = el;

        const menu = H.$('context-menu-box');
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

    function handleNoteAction(action, el) {
        if (!el) return;

        switch (action) {
            case 'edit-note':
                editNote(el);
                break;
            case 'delete-note':
                deleteNote(el);
                break;
        }
    }

    function handleBoxAction(action, el) {
        if (!el) return;

        switch (action) {
            case 'edit-box':
                editBox(el);
                break;
            case 'delete-box':
                deleteBox(el);
                break;
        }
    }

    function editNote(el) {
        // Pre-fill the note modal with existing text
        H.$('note-text').value = el.dataset.text || el.textContent || '';
        H.$('note-modal-title').textContent = 'Editar Nota';
        H.$('modal-note').style.display = 'flex';
        window._editingNoteElement = el;
    }

    function deleteNote(el) {
        UIModals.confirm({
            title: 'Confirmar eliminación',
            message: '¿Seguro que deseas eliminar esta nota? Esta acción es irreversible.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onConfirm: () => {
                el.remove();
                DiagramState.markDirty();
                H.toast('Nota eliminada.', 'info');
            }
        });
    }

    function editBox(el) {
        // Get current colors from inline style
        const bg = el.style.background || '#e2e8f0';
        const borderColor = el.style.borderColor || '#94a3b8';

        // Pre-fill the color picker modal
        H.$('box-color').value = bg;
        H.$('box-border-color').value = borderColor;
        H.$('modal-color-picker').querySelector('h2').textContent = 'Editar Caja';

        H.$('modal-color-picker').style.display = 'flex';

        const confirmBtn = H.$('btn-confirm-box');
        const editHandler = () => {
            const newColor = H.$('box-color').value || '#e2e8f0';
            const newBorder = H.$('box-border-color').value || '#94a3b8';
            el.style.background = newColor;
            el.style.border = '2px dashed ' + newBorder;
            H.$('modal-color-picker').style.display = 'none';
            H.$('modal-color-picker').querySelector('h2').textContent = 'Color de Caja';
            confirmBtn.removeEventListener('click', editHandler);
            DiagramState.markDirty();
            H.toast('Caja actualizada.', 'success');
        };
        confirmBtn.addEventListener('click', editHandler);
    }

    function deleteBox(el) {
        UIModals.confirm({
            title: 'Confirmar eliminación',
            message: '¿Seguro que deseas eliminar esta caja? Esta acción es irreversible.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onConfirm: () => {
                el.remove();
                DiagramState.markDirty();
                H.toast('Caja eliminada.', 'info');
            }
        });
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

    return { init, showObjectMenu, showLineMenu, showNoteMenu, showBoxMenu };
})();
