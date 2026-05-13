/**
 * UIModals module - manage modal dialogs, taskbar, and general UI interactions.
 */
const UIModals = (() => {
    const H = DOMHelpers;
    let confirmHandler = null;

    /** Close all open modals */
    function closeAll() {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.style.display = 'none';
        });
        document.querySelectorAll('.context-menu').forEach(m => {
            m.style.display = 'none';
        });
    }

    /** Close a specific modal */
    function close(id) {
        const el = H.$(id);
        if (el) el.style.display = 'none';
    }

    /** Open a modal */
    function open(id) {
        const el = H.$(id);
        if (el) el.style.display = 'flex';
    }

    /** Toggle taskbar visibility */
    function toggleTaskbar() {
        const taskbar = H.$('taskbar');
        const toggleBtn = H.$('btn-taskbar-open');
        if (!taskbar) return;

        if (taskbar.classList.contains('closed')) {
            taskbar.classList.remove('closed');
            toggleBtn.style.display = 'none';
        } else {
            taskbar.classList.add('closed');
            toggleBtn.style.display = 'flex';
        }
    }

    /**
     * Show a reusable confirmation modal.
     * @param {Object} opts
     * @param {string} [opts.title='Confirm deletion']
     * @param {string} [opts.message='This action cannot be undone.']
     * @param {string} [opts.confirmText='Delete']
     * @param {string} [opts.cancelText='Cancel']
     * @param {string} [opts.confirmClass='btn-danger']
     * @param {Function} opts.onConfirm - Called once when user clicks confirm.
     */
    function confirm(opts) {
        const overlay = H.$('modal-confirm-generic');
        if (!overlay) return;

        const titleEl     = H.$('confirm-modal-title');
        const msgEl       = H.$('confirm-modal-message');
        const cancelBtn   = H.$('confirm-modal-cancel');
        const acceptBtn   = H.$('confirm-modal-accept');

        if (!titleEl || !msgEl || !cancelBtn || !acceptBtn) return;

        // Set texts
        titleEl.textContent   = opts.title   || 'Confirm deletion';
        msgEl.textContent     = opts.message || 'This action cannot be undone.';
        cancelBtn.textContent = opts.cancelText || 'Cancel';
        acceptBtn.textContent = opts.confirmText || 'Delete';

        // Reset accept button classes, keep base
        acceptBtn.className = 'btn';
        if (opts.confirmClass) {
            acceptBtn.classList.add(...opts.confirmClass.split(' '));
        } else {
            acceptBtn.classList.add('btn-danger');
        }

        // Store the handler (one-shot)
        confirmHandler = opts.onConfirm || null;

        overlay.style.display = 'flex';
    }

    /** Wire up confirmation modal events — called once at module init */
    function initConfirmModal() {
        const overlay = H.$('modal-confirm-generic');
        if (!overlay) return;

        const closeModal = () => {
            overlay.style.display = 'none';
            confirmHandler = null;
        };

        // Cancel button
        const cancelBtn = H.$('confirm-modal-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        // X button
        const closeX = H.$('confirm-modal-close');
        if (closeX) closeX.addEventListener('click', closeModal);

        // Overlay background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Accept button — one-shot via confirmHandler
        const acceptBtn = H.$('confirm-modal-accept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                if (typeof confirmHandler === 'function') {
                    const handler = confirmHandler;
                    // Clear before calling so re-entrant calls work
                    confirmHandler = null;
                    handler();
                }
                overlay.style.display = 'none';
            });
        }
    }

    // Auto-init on DOMContentLoaded if not already late
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConfirmModal);
    } else {
        initConfirmModal();
    }

    return { closeAll, close, open, toggleTaskbar, confirm };
})();

