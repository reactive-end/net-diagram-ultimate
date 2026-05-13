/**
 * Links module - create and manage connection lines between devices.
 */
const LinkSystem = (() => {
    const H = DOMHelpers;
    let linking = false;
    let sourceElement = null;
    let tempLine = null;

    function init() {
        // Global mouse tracking for link creation mode
        document.addEventListener('mousemove', onLinkMouseMove);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cancelLinking();
        });
    }

    /** Start linking mode from a source element */
    function startLinking(el) {
        if (linking) cancelLinking();

        linking = true;
        sourceElement = el;
        document.body.style.cursor = 'crosshair';

        H.toast('Haz clic en un dispositivo para crear el enlace. ESC para cancelar.', 'info');

        // Create temporary line
        tempLine = H.create('div', { className: 'line' });
        tempLine.style.position = 'absolute';
        tempLine.style.height = '2px';
        tempLine.style.background = '#3b82f6';
        tempLine.style.zIndex = '999';
        tempLine.style.pointerEvents = 'none';
        tempLine.style.opacity = '0.7';
        H.$('canvas').appendChild(tempLine);
    }

    function cancelLinking() {
        linking = false;
        sourceElement = null;
        document.body.style.cursor = '';
        if (tempLine) {
            tempLine.remove();
            tempLine = null;
        }
    }

    function onLinkMouseMove(e) {
        if (!linking || !tempLine || !sourceElement) return;

        const from = H.getCenter(sourceElement);
        const pos = H.mouseToCanvas(e);

        const dx = pos.x - from.x;
        const dy = pos.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        tempLine.style.left = from.x + 'px';
        tempLine.style.top = from.y + 'px';
        tempLine.style.width = length + 'px';
        tempLine.style.transform = 'rotate(' + angle + 'deg)';
    }

    /** Complete the link when clicking a target element */
    function completeLink(targetEl) {
        if (!linking || !sourceElement || !targetEl) return;
        if (sourceElement === targetEl) return; // Can't link to self

        // Create two lines (bidirectional pair)
        const lineId1 = DiagramState.nextLineId();
        const lineId2 = DiagramState.nextLineId();

        const sourceId = parseInt(sourceElement.dataset.id);
        const targetId = parseInt(targetEl.dataset.id);

        // Line from source to target
        createLineElement(lineId1, lineId2, sourceId, targetId);

        // Line from target to source (brother)
        createLineElement(lineId2, lineId1, targetId, sourceId);

        cancelLinking();
        DiagramState.markDirty();
        H.toast('Enlace creado.', 'success');
    }

    /** Create a single line DOM element */
    function createLineElement(lineId, brotherId, parentId, linkedId) {
        const canvas = H.$('canvas');
        const sourceEl = findObjectById(parentId);
        const targetEl = findObjectById(linkedId);

        if (!sourceEl || !targetEl) return null;

        const from = H.getCenter(sourceEl);
        const to = H.getCenter(targetEl);

        const line = document.createElement('div');
        line.className = 'line';
        line.style.position = 'absolute';
        line.dataset.id = lineId;
        line.dataset.brother = brotherId;
        line.dataset.parent = parentId;
        line.dataset.linked = linkedId;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        line.style.left = from.x + 'px';
        line.style.top = from.y + 'px';
        line.style.width = length + 'px';
        line.style.transform = 'rotate(' + angle + 'deg)';

        canvas.appendChild(line);
        return line;
    }

    /** Check if the click target is an object during linking mode */
    function handleLinkClick(targetEl) {
        if (!linking) return false;
        if (targetEl && targetEl.classList.contains('object')) {
            completeLink(targetEl);
            return true;
        }
        return false;
    }

    function isLinking() { return linking; }
    function getSourceElement() { return sourceElement; }

    function findObjectById(id) {
        const canvas = H.$('canvas');
        return canvas ? canvas.querySelector('.object[data-id="' + id + '"]') : null;
    }

    /** Find a brother line: tries CSS selector first, then manual iteration fallback */
    function findLineByDataId(canvas, targetId) {
        // First attempt: CSS attribute selector
        let el = canvas.querySelector('.line[data-id="' + targetId + '"]');
        if (el) return el;

        // Fallback: iterate all .line elements and compare getAttribute directly
        const all = canvas.querySelectorAll('.line');
        for (let i = 0; i < all.length; i++) {
            if (all[i].getAttribute('data-id') === targetId) {
                return all[i];
            }
        }
        return null;
    }

    /** Delete a line pair — removes the clicked line AND its brother identified by data-brother */
    function deleteLinePair(lineEl) {
        // Read brotherId from the DOM attribute directly (dataset fallback)
        const brotherId = lineEl.getAttribute('data-brother') || lineEl.dataset.brother;
        const canvas = H.$('canvas');
        let brother = null;

        if (brotherId && canvas) {
            brother = findLineByDataId(canvas, brotherId);
        }

        // Remove brother first, then the selected line
        if (brother && brother !== lineEl) {
            brother.remove();
        }
        lineEl.remove();

        DiagramState.markDirty();
        H.toast('Enlace eliminado.', 'info');
    }

    /** Delete all lines connected to an object */
    function deleteLinesForObject(objectId) {
        const canvas = H.$('canvas');
        if (!canvas) return;

        const lines = canvas.querySelectorAll('.line');
        lines.forEach(line => {
            const parentId = parseInt(line.dataset.parent);
            const linkedId = parseInt(line.dataset.linked);
            if (parentId === objectId || linkedId === objectId) {
                const brotherId = line.dataset.brother;
                const brother = brotherId ? canvas.querySelector('.line[data-id="' + brotherId + '"]') : null;
                if (brother) brother.remove();
                line.remove();
            }
        });
    }

    return {
        init, startLinking, cancelLinking, handleLinkClick,
        isLinking, getSourceElement, deleteLinePair, deleteLinesForObject,
    };
})();
