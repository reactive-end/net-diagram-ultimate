/**
 * Devices module - create and manage diagram device elements (DOM representation).
 */
const Devices = (() => {
    const H = DOMHelpers;

    /**
     * Create a device element on the canvas.
     * @param {string} type - antenna|router|switch|modem|computer
     * @param {object} props - device properties
     * @param {number} x - left position
     * @param {number} y - top position
     */
    function createDevice(type, props, x, y) {
        const canvas = H.$('canvas');
        if (!canvas) return null;

        const objectId = props.objectID || DiagramState.nextObjectId();
        const el = document.createElement('div');
        el.className = 'object object-' + type;
        el.setAttribute('draggable', 'false');
        el.style.position = 'absolute';
        el.style.left = (x || 100) + 'px';
        el.style.top = (y || 100) + 'px';
        el.dataset.type = type;
        el.dataset.id = objectId;

        // Set type-specific data attributes
        switch (type) {
            case 'antenna':
                el.dataset.name = props.name || '';
                el.dataset.ssid = props.ssid || '';
                el.dataset.ip = props.ip || '';
                el.dataset.frequency = props.frecuency || props.frequency || 0;
                el.dataset.mode = props.mode || 0;
                el.dataset.band = props.band || '';
                el.dataset.apClient = props.apClient || 0;
                break;
            case 'router':
                el.dataset.name = props.name || '';
                el.dataset.ip = props.ip || '';
                el.dataset.ports = props.ports || 0;
                break;
            case 'switch':
                el.dataset.name = props.name || '';
                el.dataset.ip = props.ip || '';
                el.dataset.ports = props.ports || 0;
                break;
            case 'modem':
                el.dataset.name = props.name || '';
                el.dataset.ip = props.ip || '';
                el.dataset.service = props.service || '';
                el.dataset.vlan = props.vlan || '';
                break;
            case 'computer':
                el.dataset.name = props.name || '';
                el.dataset.ip = props.ip || '';
                break;
        }

        // Add SVG icon — use mode-specific variants for antennas
        let svgFile = type + '.svg';
        if (type === 'antenna') {
            const mode = parseInt(props.mode) || 0;
            svgFile = (mode === 0) ? 'antenna-ap.svg' : 'antenna-station.svg';
        }
        const base = (typeof window !== 'undefined' && window.BASE_PATH) ? window.BASE_PATH : '';
        const svgPath = base + '/assets/img/devices/' + svgFile;
        fetch(svgPath)
            .then(r => r.text())
            .then(svgText => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = svgText;
                const svg = wrapper.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', '48');
                    svg.setAttribute('height', '48');
                    svg.style.pointerEvents = 'none';
                    el.insertBefore(svg, el.firstChild);
                }
            })
            .catch(() => {
                // Fallback: simple circle
                const circle = document.createElement('div');
                circle.style.cssText = 'width:48px;height:48px;border-radius:50%;border:2px solid #04277B;background:white;';
                el.insertBefore(circle, el.firstChild);
            });

        // Add info label
        const info = document.createElement('span');
        info.className = 'object-info';
        const nameText = props.name || deviceLabel(type);
        const ipText = props.ip || '';
        info.innerHTML = nameText + (ipText ? '<br><small>' + ipText + '</small>' : '');
        el.appendChild(info);

        canvas.appendChild(el);
        DiagramState.markDirty();
        return el;
    }

    /**
     * Create a note element on the canvas.
     */
    function createNote(text, x, y) {
        const canvas = H.$('canvas');
        if (!canvas) return null;

        const noteId = DiagramState.nextNoteId();
        const el = document.createElement('div');
        el.className = 'note';
        el.style.position = 'absolute';
        el.style.left = (x || 100) + 'px';
        el.style.top = (y || 100) + 'px';
        el.textContent = text || 'Nota';
        el.dataset.id = noteId;
        el.dataset.text = text || 'Nota';
        el.setAttribute('draggable', 'false');

        canvas.appendChild(el);
        DiagramState.markDirty();
        return el;
    }

    function deviceLabel(type) {
        const labels = {
            antenna: 'Antena', router: 'Router', switch: 'Switch',
            modem: 'Modem', computer: 'Computadora'
        };
        return labels[type] || type;
    }

    /**
     * Update a device element's info label.
     */
    function updateInfo(el) {
        const info = el.querySelector('.object-info');
        if (!info) return;
        const name = el.dataset.name || '';
        const ip = el.dataset.ip || '';
        info.innerHTML = name + (ip ? '<br><small>' + ip + '</small>' : '');
    }

    /**
     * Update a device element's properties from form data.
     */
    function updateDeviceProps(el, props) {
        Object.entries(props).forEach(([key, val]) => {
            if (key === 'frecuency') {
                el.dataset.frequency = val;
                el.dataset.frecuency = val;
                return;
            }
            el.dataset[key] = val;
        });
        updateInfo(el);
        DiagramState.markDirty();
    }

    return { createDevice, createNote, updateInfo, updateDeviceProps, deviceLabel };
})();
