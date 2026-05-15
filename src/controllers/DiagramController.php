<?php

declare(strict_types=1);

/**
 * Diagram controller — manages diagram CRUD operations.
 */
class DiagramController
{
    private Diagram $model;

    public function __construct()
    {
        $this->model = new Diagram();
    }

    /**
     * GET /mainmenu — Main menu page listing all diagrams.
     */
    public function index(array $params, Request $request): void
    {
        Auth::require();

        $diagrams = $this->model->getAll();
        $serieIp  = (new SerieIp())->getAll();

        Response::view('main-menu', [
            'title'    => 'Net Diagram Ultimate — Diagramas',
            'diagrams' => $diagrams,
            'serieIps' => $serieIp,
            'csrf'     => Session::csrfToken(),
        ]);
    }

    /**
     * GET /diagram/{id} — Diagram editor page.
     */
    public function editor(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $diagram   = $this->model->getById($diagramId);

        if ($diagram === null) {
            Response::redirect('/mainmenu');
        }

        // Store current diagram in session
        Session::set('currentDiagramId', $diagramId);

        $objects = $this->model->loadAllObjects($diagramId);
        $serieIp = (new SerieIp())->getAll();

        Response::view('diagram-editor', [
            'title'     => 'Net Diagram Ultimate — ' . htmlspecialchars($diagram['name']),
            'diagram'   => $diagram,
            'objects'   => $objects,
            'serieIps'  => $serieIp,
            'csrf'      => Session::csrfToken(),
        ]);
    }

    /**
     * GET /api/diagrams — List all diagrams (JSON).
     */
    public function list(array $params, Request $request): void
    {
        Auth::require();
        Response::success($this->model->getAll());
    }

    /**
     * GET /api/diagram/{id} — Get a single diagram with all objects.
     */
    public function show(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $diagram   = $this->model->getById($diagramId);

        if ($diagram === null) {
            Response::error('Diagrama no encontrado.', 404);
        }

        $objects = $this->model->loadAllObjects($diagramId);
        Response::success([
            'diagram' => $diagram,
            'objects' => $objects,
        ]);
    }

    /**
     * POST /api/diagram — Create a new diagram.
     */
    public function create(array $params, Request $request): void
    {
        Auth::require();

        $validator = new Validator();
        if (!$validator->validate($request->body, [
            'name' => 'required|min:1|max:255',
        ])) {
            Response::error($validator->firstError() ?? 'Datos inválidos.', 422);
        }

        $name   = $request->input('name');
        $width  = (int) ($request->input('width', 1200));
        $height = (int) ($request->input('height', 800));

        $id = $this->model->create($name, $width, $height);
        Response::success(['id' => $id, 'redirect' => BASE_PATH . '/diagram/' . $id], 'Diagrama creado.');
    }

    /**
     * PUT /api/diagram/{id} — Update diagram metadata.
     */
    public function update(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $diagram   = $this->model->getById($diagramId);

        if ($diagram === null) {
            Response::error('Diagrama no encontrado.', 404);
        }

        $this->model->update($diagramId, $request->only(['name', 'width', 'height']));
        Response::success(null, 'Diagrama actualizado.');
    }

    /**
     * DELETE /api/diagram/{id} — Delete a diagram.
     */
    public function delete(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $this->model->delete($diagramId);

        if (Session::get('currentDiagramId') === $diagramId) {
            Session::remove('currentDiagramId');
        }

        Response::success(['redirect' => BASE_PATH . '/mainmenu'], 'Diagrama eliminado.');
    }

    /**
     * POST /api/diagram/{id}/clone — Clone a diagram.
     */
    public function clone(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $newName   = $request->input('name', 'Copia del diagrama');

        try {
            $newId = $this->model->clone($diagramId, $newName);
            Response::success(['id' => $newId, 'redirect' => BASE_PATH . '/diagram/' . $newId], 'Diagrama clonado.');
        } catch (Throwable $e) {
            Response::error('Error al clonar el diagrama: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/diagram/{id}/clear — Clear all objects from a diagram.
     */
    public function clear(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $db = Database::getInstance();
        $db->beginTransaction();
        try {
            $this->model->clear($diagramId);
            $db->commit();
            Response::success(null, 'Diagrama limpiado.');
        } catch (Throwable $e) {
            $db->rollback();
            Response::error('Error al limpiar el diagrama: ' . $e->getMessage(), 500);
        }
    }
}
