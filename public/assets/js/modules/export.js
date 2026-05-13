/**
 * Export module - export diagram to PNG image.
 */
const ExportModule = (() => {
    const H = DOMHelpers;

    /**
     * Export the diagram canvas as a PNG image.
     * Requires html2canvas library to be loaded.
     */
    async function exportToPng() {
        const canvas = H.$('canvas');
        if (!canvas) return;

        H.toast('Generando imagen...', 'info');

        // Switch to print-friendly styles
        canvas.style.background = 'white';
        document.querySelectorAll('.object svg').forEach(svg => {
            svg.style.filter = 'none';
        });

        try {
            // Use html2canvas if available
            if (typeof html2canvas !== 'undefined') {
                const captured = await html2canvas(canvas, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    logging: false,
                });

                // Download
                const link = document.createElement('a');
                link.download = 'diagrama-' + DiagramState.getDiagramId() + '.png';
                link.href = captured.toDataURL('image/png');
                link.click();

                H.toast('Diagrama exportado como PNG.', 'success');
            } else {
                // Fallback: instruct user to use browser print
                window.print();
                H.toast('Usa Ctrl+P para guardar como PDF (html2canvas no disponible).', 'info');
            }
        } catch (err) {
            H.toast('Error al exportar: ' + err.message, 'error');
        }
    }

    return { exportToPng };
})();
