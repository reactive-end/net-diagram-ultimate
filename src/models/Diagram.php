<?php

declare(strict_types=1);

/**
 * Diagram model — handles CRUD for diagrams table.
 */
class Diagram
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get all diagrams ordered by ID.
     */
    public function getAll(): array
    {
        return $this->db->fetchAll(
            'SELECT id, name, width, height FROM diagrams ORDER BY id ASC'
        );
    }

    /**
     * Get a single diagram by ID.
     */
    public function getById(int $id): ?array
    {
        return $this->db->fetchOne(
            'SELECT id, name, width, height FROM diagrams WHERE id = ?',
            [$id]
        );
    }

    /**
     * Create a new diagram.
     */
    public function create(string $name, int $width = 1200, int $height = 800): int
    {
        return $this->db->insert(
            'INSERT INTO diagrams (name, width, height) VALUES (?, ?, ?)',
            [$name, $width, $height]
        );
    }

    /**
     * Update diagram properties.
     */
    public function update(int $id, array $data): int
    {
        $fields = [];
        $params = [];

        foreach (['name', 'width', 'height'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return 0;
        }

        $params[] = $id;
        $sql = 'UPDATE diagrams SET ' . implode(', ', $fields) . ' WHERE id = ?';
        return $this->db->update($sql, $params);
    }

    /**
     * Delete a diagram and all its child objects (CASCADE handles this in DB).
     */
    public function delete(int $id): int
    {
        return $this->db->update('DELETE FROM diagrams WHERE id = ?', [$id]);
    }

    /**
     * Clone a diagram with all its devices, lines, notes, and boxes.
     */
    public function clone(int $sourceId, string $newName): int
    {
        $source = $this->getById($sourceId);
        if ($source === null) {
            throw new RuntimeException('Source diagram not found.');
        }

        $this->db->beginTransaction();
        try {
            // Create new diagram
            $newId = $this->create($newName, (int) $source['width'], (int) $source['height']);

            // Clone all child tables
            $tables = [
                'diagrams_anthenas',
                'diagrams_routers',
                'diagrams_switchs',
                'diagrams_modems',
                'diagrams_computers',
                'diagrams_notes',
                'diagrams_lines',
                'diagrams_box',
            ];

            foreach ($tables as $table) {
                $columns = $this->getTableColumns($table);
                // Remove id_diagrama from column list (we'll replace it)
                $insertCols = array_filter($columns, fn($c) => $c !== 'id_diagrama');
                $colList = implode(', ', array_merge(['id_diagrama'], $insertCols));
                $placeholders = implode(', ', array_fill(0, count($insertCols) + 1, '?'));

                $rows = $this->db->fetchAll(
                    "SELECT * FROM {$table} WHERE id_diagrama = ?",
                    [$sourceId]
                );

                foreach ($rows as $row) {
                    $params = [$newId];
                    foreach ($insertCols as $col) {
                        $params[] = $row[$col];
                    }
                    $this->db->execute(
                        "INSERT INTO {$table} ({$colList}) VALUES ({$placeholders})",
                        $params
                    );
                }
            }

            $this->db->commit();
            return $newId;
        } catch (Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Clear all child objects from a diagram (keep the diagram record).
     */
    public function clear(int $diagramId): void
    {
        $this->db->beginTransaction();
        try {
            $tables = [
                'diagrams_anthenas',
                'diagrams_routers',
                'diagrams_switchs',
                'diagrams_modems',
                'diagrams_computers',
                'diagrams_notes',
                'diagrams_lines',
                'diagrams_box',
            ];

            foreach ($tables as $table) {
                $this->db->execute(
                    "DELETE FROM {$table} WHERE id_diagrama = ?",
                    [$diagramId]
                );
            }

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Load all objects for a diagram.
     */
    public function loadAllObjects(int $diagramId): array
    {
        return [
            'antennas'  => $this->db->fetchAll('SELECT * FROM diagrams_anthenas WHERE id_diagrama = ?', [$diagramId]),
            'routers'   => $this->db->fetchAll('SELECT * FROM diagrams_routers WHERE id_diagrama = ?', [$diagramId]),
            'switches'  => $this->db->fetchAll('SELECT * FROM diagrams_switchs WHERE id_diagrama = ?', [$diagramId]),
            'modems'    => $this->db->fetchAll('SELECT * FROM diagrams_modems WHERE id_diagrama = ?', [$diagramId]),
            'computers' => $this->db->fetchAll('SELECT * FROM diagrams_computers WHERE id_diagrama = ?', [$diagramId]),
            'notes'     => $this->db->fetchAll('SELECT * FROM diagrams_notes WHERE id_diagrama = ?', [$diagramId]),
            'lines'     => $this->db->fetchAll('SELECT * FROM diagrams_lines WHERE id_diagrama = ?', [$diagramId]),
            'boxes'     => $this->db->fetchAll('SELECT * FROM diagrams_box WHERE id_diagrama = ?', [$diagramId]),
        ];
    }

    /**
     * Get table column names (excluding auto-increment PK).
     */
    private function getTableColumns(string $table): array
    {
        $rows = $this->db->fetchAll("SHOW COLUMNS FROM {$table}");
        return array_column($rows, 'Field');
    }
}
