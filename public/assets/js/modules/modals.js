/**
 * UIModals module - manage modal dialogs, taskbar, and general UI interactions.
 */
const UIModals = (() => {
    const H = DOMHelpers;

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

    return { closeAll, close, open, toggleTaskbar };
})();

