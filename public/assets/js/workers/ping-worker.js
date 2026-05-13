/**
 * Ping Worker — runs a single ping via fetch in a Web Worker.
 * Receives { ip } via postMessage.
 * Posts back { ip, success, time_ms, raw }.
 */
self.addEventListener('message', async (e) => {
    const { ip } = e.data;
    try {
        const res = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip }),
        });
        const data = await res.json();
        self.postMessage({
            ip,
            success: data?.data?.success ?? false,
            time_ms: data?.data?.time_ms ?? null,
            raw: data?.data?.raw ?? '',
        });
    } catch (err) {
        self.postMessage({
            ip,
            success: false,
            time_ms: null,
            raw: err.message || 'error',
        });
    }
});
