<?php

declare(strict_types=1);

/**
 * Ping controller — executes ping tests and manages IP series.
 */
class PingController
{
    /**
     * POST /api/ping — Execute a single ping to an IP address.
     *
     * Body: { ip: "192.168.1.1" }
     */
    public function ping(array $params, Request $request): void
    {
        Auth::require();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }

        $ip = $request->input('ip', '');

        // Validate IP strictly to prevent command injection
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            Response::error('Dirección IP no válida.', 422);
        }

        // Safe: $ip is guaranteed to be a valid IP address format
        $cmd = sprintf('ping -n 1 -l 1 -w 1000 %s', escapeshellarg($ip));
        $output = [];
        $returnCode = 0;
        exec($cmd, $output, $returnCode);

        // Parse the response
        $result = [
            'ip'      => $ip,
            'success' => $returnCode === 0,
            'raw'     => implode("\n", $output),
        ];

        // Extract response time if available
        // Supports: "tiempo<1m", "tiempo=2ms", "time<1ms", "time=5ms", "time=10 ms"
        foreach ($output as $line) {
            if (preg_match('/tiempo([<=])\s*(\d+)\s*m/i', $line, $m)
                || preg_match('/time([<=])\s*(\d+)\s*m/i', $line, $m)) {
                $result['time_ms'] = ($m[1] === '<') ? 0 : (int) $m[2];
                break;
            }
        }

        Response::success($result);
    }

    /**
     * GET /api/ip-serie — List all IP entries in the series.
     */
    public function listSerie(array $params, Request $request): void
    {
        Auth::require();
        $serieIp = new SerieIp();
        Response::success($serieIp->getAll());
    }

    /**
     * POST /api/ip-serie — Add a new IP to the series.
     */
    public function createSerie(array $params, Request $request): void
    {
        Auth::require();

        $validator = new Validator();
        if (!$validator->validate($request->body, [
            'ip' => 'required|ip',
        ])) {
            Response::error($validator->firstError() ?? 'Datos inválidos.', 422);
        }

        $ip              = $request->input('ip');
        $nombreAsociado  = $request->input('nombre_asociado', '');
        $numeroContacto  = $request->input('numero_contacto', '');

        $serieIp = new SerieIp();
        $id = $serieIp->create($ip, $nombreAsociado, $numeroContacto);

        Response::success(['id' => $id], 'IP agregada a la serie.');
    }

    /**
     * PUT /api/ip-serie/{id} — Update an IP entry.
     */
    public function updateSerie(array $params, Request $request): void
    {
        Auth::require();

        $entryId = (int) ($params['id'] ?? 0);
        $serieIp = new SerieIp();

        $existing = $serieIp->getById($entryId);
        if ($existing === null) {
            Response::error('Entrada no encontrada.', 404);
        }

        $validator = new Validator();
        if (!$validator->validate($request->body, [
            'ip' => 'required|ip',
        ])) {
            Response::error($validator->firstError() ?? 'Datos inválidos.', 422);
        }

        $serieIp->update(
            $entryId,
            $request->input('ip', $existing['ip']),
            $request->input('nombre_asociado', $existing['nombre_asociado']),
            $request->input('numero_contacto', $existing['numero_contacto'])
        );

        Response::success(null, 'IP actualizada.');
    }

    /**
     * DELETE /api/ip-serie/{id} — Delete an IP entry.
     */
    public function deleteSerie(array $params, Request $request): void
    {
        Auth::require();

        $entryId = (int) ($params['id'] ?? 0);
        $serieIp = new SerieIp();
        $serieIp->delete($entryId);

        Response::success(null, 'IP eliminada.');
    }

    /**
     * GET /api/ip-serie/lookup — Look up an IP entry by address.
     */
    public function lookupIp(array $params, Request $request): void
    {
        Auth::require();

        $ip = $request->input('ip', '');
        $serieIp = new SerieIp();
        $entry = $serieIp->getByIp($ip);

        if ($entry === null) {
            Response::error('IP no encontrada en la serie.', 404);
        }

        Response::success($entry);
    }
}
