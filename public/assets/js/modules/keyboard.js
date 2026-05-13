/**
 * Keyboard module - keyboard shortcuts for the diagram editor.
 */
const KeyboardShortcuts = (() => {
    const H = DOMHelpers;

    function init() {
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // Shift+1 to Shift+5: Quick device creation
            if (e.shiftKey && !e.ctrlKey && !e.altKey) {
                const deviceMap = {
                    '1': 'antenna',
                    '2': 'router',
                    '3': 'switch',
                    '4': 'modem',
                    '5': 'computer',
                };
                const type = deviceMap[e.key];
                if (type) {
                    e.preventDefault();
                    DeviceForms.showCreateForm(type);
                    return;
                }
            }

            // Escape: Close all modals
            if (e.key === 'Escape') {
                UIModals.closeAll();
                LinkSystem.cancelLinking();
            }

            // Ctrl+S: Save diagram
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveDiagram();
            }
        });
    }

    async function saveDiagram() {
        const H = DOMHelpers;
        const saveBtn = H.$('btn-save');
        const btnText = saveBtn ? saveBtn.querySelector('.btn-text') : null;
        const btnSpinner = saveBtn ? saveBtn.querySelector('.btn-spinner') : null;

        // Show loading state on button
        if (saveBtn) saveBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline-block';

        // Show modal
        H.$('modal-save').style.display = 'flex';
        const statusEl = H.$('save-status');
        const progressEl = H.$('save-progress');

        if (statusEl) statusEl.textContent = 'Guardando diagrama...';

        const objects = DiagramState.collectAllObjects();
        if (progressEl) progressEl.textContent = objects.length + ' objetos por guardar.';

        try {
            const res = await API.post('/api/diagram/' + DiagramState.getDiagramId() + '/save', {
                objects: objects,
            });

            if (res.success) {
                DiagramState.markClean();
                if (statusEl) statusEl.textContent = '¡Guardado! ' + objects.length + ' objetos.';
                H.toast('Diagrama guardado correctamente.', 'success');
            } else {
                if (statusEl) statusEl.textContent = 'Error: ' + res.message;
                H.toast('Error al guardar: ' + res.message, 'error');
            }
        } catch (err) {
            if (statusEl) statusEl.textContent = 'Error de conexión.';
            H.toast('Error de conexión al guardar.', 'error');
        }

        // Restore button
        if (saveBtn) saveBtn.disabled = false;
        if (btnText) btnText.style.display = '';
        if (btnSpinner) btnSpinner.style.display = 'none';

        setTimeout(() => {
            H.$('modal-save').style.display = 'none';
        }, 2000);
    }

    return { init, saveDiagram };
})();
