/**
 * DOM Helpers - utility functions for DOM manipulation.
 */
const DOMHelpers = (() => {

    /** Get element by ID shorthand */
    function $(id) { return document.getElementById(id); }

    /** Query selector within an element */
    function qs(el, selector) { return (el || document).querySelector(selector); }

    /** Query all within an element */
    function qsa(el, selector) { return (el || document).querySelectorAll(selector); }

    /** Create an element with attributes */
    function create(tag, attrs) {
        attrs = attrs || {};
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, val]) => {
            if (key === 'className') el.className = val;
            else if (key === 'textContent') el.textContent = val;
            else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
            else el.setAttribute(key, val);
        });
        return el;
    }

    /** Calculate distance between two points */
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }

    /** Calculate angle between two points in degrees */
    function angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    }

    /** Get center position of an element's ICON relative to its offset parent */
    function getCenter(el) {
        const left = parseInt(el.style.left) || 0;
        const top = parseInt(el.style.top) || 0;
        // Icon is 48px centered in 80px-wide .object container.
        // Center X = left + 40 (half of 80), Center Y = top + 24 (half of 48px icon)
        return { x: left + 40, y: top + 24 };
    }

    /** Show a toast notification */
    function toast(message, type) {
        type = type || 'info';
        const container = $('toast-container');
        if (!container) return;
        const toastEl = create('div', { className: 'toast toast-' + type, textContent: message });
        container.appendChild(toastEl);
        setTimeout(() => {
            toastEl.style.opacity = '0';
            toastEl.style.transition = 'opacity 300ms';
            setTimeout(() => toastEl.remove(), 300);
        }, 3500);
    }

    /** Get position of mouse relative to the canvas */
    function mouseToCanvas(e) {
        const canvas = $('canvas');
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    /** Initialize IP input components: auto-jump on 3 chars or dot key */
    function initIpInputs() {
        document.querySelectorAll('.ip-input-container:not(.ip-initialized)').forEach(container => {
            const octets = container.querySelectorAll('.ip-octet');
            const hidden = container.querySelector('.ip-hidden')
                || container.nextElementSibling
                || container.parentElement?.querySelector('.ip-hidden');
            if (!octets.length || !hidden) return;
            container.classList.add('ip-initialized');

            function updateHidden() {
                const parts = [];
                octets.forEach(o => {
                    const v = o.value.replace(/[^0-9]/g, '');
                    if (v !== o.value) o.value = v;
                    parts.push(v || '0');
                });
                hidden.value = parts.join('.');
            }

            function jumpNext(currentIdx) {
                if (currentIdx < octets.length - 1) {
                    const next = octets[currentIdx + 1];
                    next.focus();
                    next.select();
                }
            }

            function jumpPrev(currentIdx) {
                if (currentIdx > 0) {
                    const prev = octets[currentIdx - 1];
                    prev.focus();
                    prev.select();
                }
            }

            octets.forEach((input, i) => {
                // On each keystroke, auto-jump after 3 digits
                input.addEventListener('input', () => {
                    // Strip non-digits
                    const cleaned = input.value.replace(/[^0-9]/g, '');
                    if (cleaned !== input.value) {
                        input.value = cleaned;
                    }
                    // Clamp to 255
                    const val = parseInt(cleaned) || 0;
                    if (val > 255) {
                        input.value = '255';
                    }
                    // Jump to next after 3 chars typed
                    if (input.value.length >= 3) {
                        jumpNext(i);
                    }
                    updateHidden();
                });

                // Handle dot key and backspace
                input.addEventListener('keydown', (e) => {
                    if (e.key === '.' || e.key === 'Decimal') {
                        e.preventDefault();
                        updateHidden();
                        jumpNext(i);
                        return;
                    }
                    if (e.key === 'NumpadDecimal') {
                        e.preventDefault();
                        updateHidden();
                        jumpNext(i);
                        return;
                    }
                    if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
                        jumpNext(i);
                        return;
                    }
                    if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
                        jumpPrev(i);
                        return;
                    }
                    // Backspace on empty field → go to previous
                    if (e.key === 'Backspace' && input.value === '' && i > 0) {
                        e.preventDefault();
                        jumpPrev(i);
                    }
                });

                // Paste full IP
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const paste = (e.clipboardData || window.clipboardData).getData('text').trim();
                    const parts = paste.split('.');
                    // If it looks like an IP, fill all octets
                    if (parts.length >= 4) {
                        parts.slice(0, 4).forEach((part, j) => {
                            if (octets[j]) {
                                octets[j].value = part.replace(/[^0-9]/g, '').slice(0, 3);
                            }
                        });
                    } else {
                        input.value = paste.replace(/[^0-9]/g, '').slice(0, 3);
                        jumpNext(i);
                    }
                    updateHidden();
                });

                // Select all on focus for easy replacement
                input.addEventListener('focus', () => {
                    input.select();
                });
            });

            updateHidden();
        });
    }

    /** Initialize inputs that only accept digits. */
    function initDigitsOnlyInputs() {
        document.querySelectorAll('input.digits-only:not(.digits-only-initialized)').forEach(input => {
            input.classList.add('digits-only-initialized');

            input.addEventListener('input', () => {
                const cleaned = input.value.replace(/[^0-9]/g, '');
                if (cleaned !== input.value) {
                    input.value = cleaned;
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                input.value = paste.replace(/[^0-9]/g, '');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    }

    // Auto-init IP inputs on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initIpInputs();
            initDigitsOnlyInputs();
        });
    } else {
        initIpInputs();
        initDigitsOnlyInputs();
    }

    return { $: $, qs: qs, qsa: qsa, create: create, distance: distance, angle: angle, getCenter: getCenter, toast: toast, mouseToCanvas: mouseToCanvas, initIpInputs: initIpInputs, initDigitsOnlyInputs: initDigitsOnlyInputs };
})();
