/**
 * Editor module - main diagram editor controller.
 * Initializes all subsystems and wires up UI interactions.
 */
const Editor = (() => {
    const H = DOMHelpers;
    const APP_BASE = (typeof window !== 'undefined' && typeof window.BASE_PATH === 'string') ? window.BASE_PATH : '';

    function init() {
        // Initialize state from page data
        const page = H.$('diagram-page');
        if (!page) return;

        const diagramId = parseInt(page.dataset.diagramId);
        const canvas = H.$('canvas');
        const canvasWidth = parseInt(canvas.dataset.width) || 1200;
        const canvasHeight = parseInt(canvas.dataset.height) || 800;

        DiagramState.init(diagramId, canvasWidth, canvasHeight);

        // Initialize subsystems
        DragSystem.init();
        LinkSystem.init();
        BoxSystem.init();
        ContextMenu.init();
        KeyboardShortcuts.init();

        // Wire up context menus for existing elements
        wireContextMenus();

        // Wire up taskbar buttons
        wireTaskbar();

        // Wire up modal buttons
        wireModals();

        // Back button
        const backBtn = H.$('btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (DiagramState.isDirty()) {
                    if (confirm('Tienes cambios sin guardar. Deseas salir de todas formas?')) {
                        window.location.href = APP_BASE + '/mainmenu';
                    }
                } else {
                    window.location.href = APP_BASE + '/mainmenu';
                }
            });
        }

        // Save button
        const saveBtn = H.$('btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                KeyboardShortcuts.saveDiagram();
            });
        }

        // Canvas click — handle link completion, box creation, and tap-to-context (mobile)
        canvas.addEventListener('click', (e) => {
            // Box creation takes priority
            if (BoxSystem.isCreating()) {
                BoxSystem.handleClick(e);
                return;
            }

            // Link completion
            if (LinkSystem.isLinking()) {
                const target = e.target.closest('.object');
                if (target && target !== LinkSystem.getSourceElement()) {
                    LinkSystem.handleLinkClick(target);
                }
                return;
            }

            // Tap on object or line → context menu (mobile + desktop convenience)
            const object = e.target.closest('.object');
            const line = e.target.closest('.line');

            if (object) {
                ContextMenu.showObjectMenu(e, object);
                return;
            }
            if (line) {
                ContextMenu.showLineMenu(e, line);
                return;
            }
        });
    }

    function wireContextMenus() {
        const canvas = H.$('canvas');
        if (!canvas) return;

        // Object right-click
        canvas.addEventListener('contextmenu', (e) => {
            const object = e.target.closest('.object');
            const line = e.target.closest('.line');

            if (object) {
                ContextMenu.showObjectMenu(e, object);
            } else if (line) {
                ContextMenu.showLineMenu(e, line);
            }
        });

        // Info panel close
        const infoClose = H.$('btn-info-close');
        if (infoClose) {
            infoClose.addEventListener('click', () => {
                H.$('info-panel').style.display = 'none';
            });
        }
    }

    function wireTaskbar() {
        const taskbarClose = H.$('btn-taskbar-close');
        const taskbarOpen = H.$('btn-taskbar-open');

        if (taskbarClose) {
            taskbarClose.addEventListener('click', () => UIModals.toggleTaskbar());
        }
        if (taskbarOpen) {
            taskbarOpen.addEventListener('click', () => UIModals.toggleTaskbar());
        }

        // Taskbar action buttons
        document.querySelectorAll('.taskbar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;

                switch (action) {
                    case 'add-object':
                        // Show device selector
                        H.$('modal-select-device').style.display = 'flex';
                        break;

                    case 'add-box':
                        BoxSystem.start();
                        break;

                    case 'add-note':
                        H.$('modal-note').style.display = 'flex';
                        break;

                    case 'config-canvas':
                        H.$('modal-canvas-config').style.display = 'flex';
                        break;

                    case 'ping-serie':
                        H.$('modal-ping-serie').style.display = 'flex';
                        break;

                    case 'ping-trace':
                        PingTrace.openModal();
                        break;

                    case 'print':
                        ExportModule.exportToPng();
                        break;

                    case 'exit':
                        if (DiagramState.isDirty()) {
                            if (confirm('Tienes cambios sin guardar. Deseas salir?')) {
                                window.location.href = APP_BASE + '/mainmenu';
                            }
                        } else {
                            window.location.href = APP_BASE + '/mainmenu';
                        }
                        break;
                }
            });
        });
    }

    function wireModals() {
        // Device type selector
        const selectForm = H.$('form-select-device');
        if (selectForm) {
            selectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const type = DeviceForms.getSelectedType();
                if (type) {
                    H.$('modal-select-device').style.display = 'none';
                    DeviceForms.showCreateForm(type);
                }
            });
        }

        // Device type select change (instant open)
        const deviceSelect = H.$('device-type');
        if (deviceSelect) {
            deviceSelect.addEventListener('change', () => {
                const type = deviceSelect.value;
                if (type) {
                    H.$('modal-select-device').style.display = 'none';
                    DeviceForms.showCreateForm(type);
                }
            });
        }

        // Add note
        const addNoteBtn = H.$('btn-add-note');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => {
                const text = H.$('note-text').value.trim();
                if (!text) return;

                const viewport = H.$('canvas-viewport');
                const x = viewport ? viewport.scrollLeft + 200 : 200;
                const y = viewport ? viewport.scrollTop + 200 : 200;

                Devices.createNote(text, x, y);
                H.$('modal-note').style.display = 'none';
                H.$('note-text').value = '';
                H.toast('Nota agregada.', 'success');
            });
        }

        // Canvas config
        const updateCanvasBtn = H.$('btn-update-canvas');
        if (updateCanvasBtn) {
            updateCanvasBtn.addEventListener('click', async () => {
                const width = parseInt(H.$('canvas-width').value) || 1200;
                const height = parseInt(H.$('canvas-height').value) || 800;

                if (width < 200 || height < 200) {
                    H.toast('Dimensiones minimas: 200x200.', 'error');
                    return;
                }

                try {
                    await API.put('/api/canvas/' + DiagramState.getDiagramId(), { width, height });
                    DiagramState.setCanvasSize(width, height);
                    const canvas = H.$('canvas');
                    canvas.style.width = width + 'px';
                    canvas.style.height = height + 'px';
                    canvas.dataset.width = width;
                    canvas.dataset.height = height;
                    H.$('modal-canvas-config').style.display = 'none';
                    H.toast('Canvas actualizado a ' + width + 'x' + height + '.', 'success');
                } catch (err) {
                    H.toast('Error al actualizar canvas.', 'error');
                }
            });
        }
    }

    return { init };
})();

// --- Auto-init ---
document.addEventListener('DOMContentLoaded', () => {
    Editor.init();
});

// Warn on page leave with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (DiagramState.isDirty()) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar.';
        return e.returnValue;
    }
});
