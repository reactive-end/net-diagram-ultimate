<?php

declare(strict_types=1);

/**
 * Canvas controller — manages diagram canvas dimensions.
 */
class CanvasController
{
    private Diagram $model;

    public function __construct()
    {
        $this->model = new Diagram();
    }

    /**
     * GET /api/canvas/{id} — Get canvas dimensions for a diagram.
     */
    public function getSize(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $diagram   = $this->model->getById($diagramId);

        if ($diagram === null) {
            Response::error('Diagrama no encontrado.', 404);
        }

        Response::success([
            'width'  => (int) $diagram['width'],
            'height' => (int) $diagram['height'],
        ]);
    }

    /**
     * PUT /api/canvas/{id} — Update canvas dimensions.
     */
    public function setSize(array $params, Request $request): void
    {
        Auth::require();

        $diagramId = (int) ($params['id'] ?? 0);
        $width     = (int) $request->input('width', 600);
        $height    = (int) $request->input('height', 400);

        if ($width < 200 || $width > 10000 || $height < 200 || $height > 10000) {
            Response::error('Dimensiones fuera de rango (200-10000).', 422);
        }

        $this->model->update($diagramId, [
            'width'  => $width,
            'height' => $height,
        ]);

        Response::success([
            'width'  => $width,
            'height' => $height,
        ], 'Dimensiones actualizadas.');
    }
}
