/**
 * Boxes module - create and manage rectangular box areas on the canvas.
 */
const BoxSystem = (() => {
    const H = DOMHelpers;
    let creating = false;
    let firstPoint = null;

    function init() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && creating) cancelBox();
        });
    }

    /** Start box creation mode */
    function start() {
        if (creating) return;
        creating = true;
        firstPoint = null;

        // Show crosshair overlays
        const overlay = H.$('box-creation-overlay');
        if (overlay) overlay.style.display = 'block';

        document.body.style.cursor = 'crosshair';
        H.toast('Haz clic para definir la primera esquina de la caja.', 'info');
    }

    /** Handle click during box creation */
    function handleClick(e) {
        if (!creating) return false;

        const pos = H.mouseToCanvas(e);

        if (!firstPoint) {
            // Set first corner
            firstPoint = pos;
            const c1 = H.$('crosshair-1');
            if (c1) {
                c1.style.display = 'block';
                c1.style.left = e.clientX + 'px';
                c1.style.top = e.clientY + 'px';
            }
            H.toast('Ahora haz clic en la esquina opuesta.', 'info');
            return true;
        } else {
            // Set second corner and finalize
            finishBox(firstPoint, pos);
            return true;
        }
    }

    function finishBox(p1, p2) {
        // Calculate rectangle from two points
        const left = Math.min(p1.x, p2.x);
        const top = Math.min(p1.y, p2.y);
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);

        // Clean up creation state
        cleanup();
        creating = false;
        document.body.style.cursor = '';

        // Show color picker
        showColorPicker(left, top, width, height);
    }

    function showColorPicker(left, top, width, height) {
        H.$('modal-color-picker').style.display = 'flex';

        const confirmBtn = H.$('btn-confirm-box');
        const newHandler = () => {
            const color = H.$('box-color').value || '#e2e8f0';
            const borderColor = H.$('box-border-color').value || '#94a3b8';
            createBox(left, top, width, height, color, borderColor);
            H.$('modal-color-picker').style.display = 'none';
            confirmBtn.removeEventListener('click', newHandler);
        };
        confirmBtn.addEventListener('click', newHandler);
    }

    function createBox(left, top, width, height, bgColor, borderColor) {
        const canvas = H.$('canvas');
        if (!canvas) return;

        const box = document.createElement('div');
        box.className = 'node-box';
        box.style.position = 'absolute';
        box.style.left = left + 'px';
        box.style.top = top + 'px';
        box.style.width = width + 'px';
        box.style.height = height + 'px';
        box.style.background = bgColor;
        box.style.border = '2px solid ' + borderColor;

        canvas.appendChild(box);
        DiagramState.markDirty();
        H.toast('Caja creada.', 'success');
    }

    function cancelBox() {
        cleanup();
        creating = false;
        firstPoint = null;
        document.body.style.cursor = '';
        H.toast('Creacion de caja cancelada.', 'info');
    }

    function cleanup() {
        const overlay = H.$('box-creation-overlay');
        if (overlay) overlay.style.display = 'none';
        const c1 = H.$('crosshair-1');
        const c2 = H.$('crosshair-2');
        if (c1) c1.style.display = 'none';
        if (c2) c2.style.display = 'none';
    }

    function isCreating() { return creating; }

    return { init, start, handleClick, isCreating };
})();
