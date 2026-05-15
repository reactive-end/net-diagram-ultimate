<?php

declare(strict_types=1);

/**
 * Device controller — manages device/line/note/box persistence within a diagram.
 */
class DeviceController
{
    private Device $model;

    public function __construct()
    {
        $this->model = new Device();
    }

    /**
     * POST /api/diagram/{id}/device — Create a device in the diagram.
     *
     * Body: { type: "antenna"|"router"|"switch"|"modem"|"computer", objectID, ...props }
     */
    public function create(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $type      = $request->input('type');

        if (!in_array($type, Device::types(), true)) {
            Response::error('Tipo de dispositivo no válido.', 422);
        }

        $data = $request->body;
        unset($data['type']);
        $data = $this->normalizeDeviceData($type, $data);

        $this->model->insert($type, $diagramId, $data);
        Response::success(null, 'Dispositivo guardado.');
    }

    /**
     * POST /api/diagram/{id}/line — Create a connection line.
     */
    public function createLine(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);

        $validator = new Validator();
        if (!$validator->validate($request->body, [
            'lineID'        => 'required|integer',
            'brotherLine'   => 'required|integer',
            'linkedObject'  => 'required|integer',
            'parentElement' => 'required|integer',
        ])) {
            Response::error($validator->firstError() ?? 'Datos inválidos.', 422);
        }

        $this->model->insertLine($diagramId, $request->body);
        Response::success(null, 'Línea guardada.');
    }

    /**
     * POST /api/diagram/{id}/note — Create a note.
     */
    public function createNote(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $this->model->insertNote($diagramId, $request->body);
        Response::success(null, 'Nota guardada.');
    }

    /**
     * POST /api/diagram/{id}/box — Create a box.
     */
    public function createBox(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $this->model->insertBox($diagramId, $request->body);
        Response::success(null, 'Caja guardada.');
    }

    /**
     * POST /api/diagram/{id}/save — Save all objects at once (batch).
     *
     * Body: { objects: [{ type, ...props }, ...] }
     * This replaces the entire diagram content transactionally.
     */
    public function saveBatch(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $objects   = $request->input('objects', []);

        if (!is_array($objects)) {
            Response::error('Formato inválido: objects debe ser un array.', 422);
        }

        $diagram = new Diagram();
        $db = Database::getInstance();

        $db->beginTransaction();
        try {
            // Clear existing objects
            $diagram->clear($diagramId);

            // Insert each object
            foreach ($objects as $obj) {
                $type = $obj['type'] ?? null;
                if ($type === null) continue;

                switch ($type) {
                    case 'line':
                        $this->model->insertLine($diagramId, $obj);
                        break;
                    case 'note':
                        $this->model->insertNote($diagramId, $obj);
                        break;
                    case 'box':
                        $this->model->insertBox($diagramId, $obj);
                        break;
                    default:
                        if (in_array($type, Device::types(), true)) {
                            unset($obj['type']);
                            $obj = $this->normalizeDeviceData($type, $obj);
                            $this->model->insert($type, $diagramId, $obj);
                        }
                        break;
                }
            }

            $db->commit();
            Response::success([
                'count' => count($objects),
            ], 'Diagrama guardado correctamente.');
        } catch (Throwable $e) {
            $db->rollback();
            $status = $e instanceof InvalidArgumentException ? 422 : 500;
            $message = $e instanceof InvalidArgumentException
                ? $e->getMessage()
                : 'Error al guardar: ' . $e->getMessage();
            Response::error($message, $status);
        }
    }

    /**
     * GET /api/diagram/{id}/objects — Get all objects for a diagram.
     */
    public function getObjects(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $diagram   = new Diagram();
        $objects   = $diagram->loadAllObjects($diagramId);

        Response::success($objects);
    }

    private function normalizeDeviceData(string $type, array $data): array
    {
        if ($type !== 'antenna') {
            return $data;
        }

        $frequency = trim((string) ($data['frecuency'] ?? ''));
        if ($frequency === '') {
            $data['frecuency'] = 0;
            return $data;
        }

        if (!ctype_digit($frequency)) {
            throw new InvalidArgumentException('La frecuencia debe contener solo números.');
        }

        $data['frecuency'] = (int) $frequency;
        if ($data['frecuency'] !== 0 && ($data['frecuency'] < 1 || $data['frecuency'] > 999999)) {
            throw new InvalidArgumentException('La frecuencia debe estar entre 1 y 999999.');
        }

        return $data;
    }
}
