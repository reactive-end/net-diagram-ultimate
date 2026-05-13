<?php

declare(strict_types=1);

/**
 * Device model — handles CRUD for all device types.
 * Schema v2: uses pos_x/pos_y instead of opaque style column.
 */
class Device
{
    private Database $db;

    // Map device types to table names
    private const TABLE_MAP = [
        'antenna'  => 'diagrams_anthenas',
        'router'   => 'diagrams_routers',
        'switch'   => 'diagrams_switchs',
        'modem'    => 'diagrams_modems',
        'computer' => 'diagrams_computers',
    ];

    // Columns per table (excluding id_diagrama and pos_x/pos_y which are universal)
    private const COLUMNS = [
        'diagrams_anthenas'  => ['objectID', 'name', 'ssid', 'ip', 'frecuency', 'mode', 'band', 'apClient'],
        'diagrams_routers'   => ['objectID', 'ip', 'name', 'ports'],
        'diagrams_switchs'   => ['objectID', 'ip', 'name', 'ports'],
        'diagrams_modems'    => ['objectID', 'name', 'ip', 'service', 'vlan'],
        'diagrams_computers' => ['objectID', 'name', 'ip'],
    ];

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Insert a device. pos_x and pos_y are extracted from the data array.
     */
    public function insert(string $type, int $diagramId, array $data): int
    {
        $table = self::TABLE_MAP[$type] ?? null;
        if ($table === null) {
            throw new InvalidArgumentException("Unknown device type: {$type}");
        }

        $columns = ['id_diagrama'];
        $placeholders = ['?'];
        $params = [$diagramId];

        $dbColumns = self::COLUMNS[$table] ?? [];

        foreach ($dbColumns as $col) {
            $columns[] = $col;
            $placeholders[] = '?';
            $params[] = $data[$col] ?? '';
        }

        // pos_x, pos_y
        $columns[] = 'pos_x';
        $columns[] = 'pos_y';
        $placeholders[] = '?';
        $placeholders[] = '?';
        $params[] = (int) ($data['pos_x'] ?? 0);
        $params[] = (int) ($data['pos_y'] ?? 0);

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        return $this->db->insert($sql, $params);
    }

    /**
     * Insert a line connection.
     */
    public function insertLine(int $diagramId, array $data): int
    {
        return $this->db->insert(
            'INSERT INTO diagrams_lines (id_diagrama, lineID, brotherLine, linkedObject, parentElement, pos_x, pos_y, line_width, line_angle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $diagramId,
                (int) ($data['lineID'] ?? 0),
                (int) ($data['brotherLine'] ?? 0),
                (int) ($data['linkedObject'] ?? 0),
                (int) ($data['parentElement'] ?? 0),
                (int) ($data['pos_x'] ?? 0),
                (int) ($data['pos_y'] ?? 0),
                (float) ($data['line_width'] ?? 0),
                (float) ($data['line_angle'] ?? 0),
            ]
        );
    }

    /**
     * Insert a note.
     */
    public function insertNote(int $diagramId, array $data): int
    {
        return $this->db->insert(
            'INSERT INTO diagrams_notes (id_diagrama, noteID, text, pos_x, pos_y) VALUES (?, ?, ?, ?, ?)',
            [
                $diagramId,
                (int) ($data['noteID'] ?? 0),
                $data['text'] ?? '',
                (int) ($data['pos_x'] ?? 0),
                (int) ($data['pos_y'] ?? 0),
            ]
        );
    }

    /**
     * Insert a box.
     */
    public function insertBox(int $diagramId, array $data): int
    {
        return $this->db->insert(
            'INSERT INTO diagrams_box (id_diagrama, pos_x, pos_y, box_width, box_height, color, border_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $diagramId,
                (int) ($data['pos_x'] ?? 0),
                (int) ($data['pos_y'] ?? 0),
                (int) ($data['box_width'] ?? 100),
                (int) ($data['box_height'] ?? 100),
                $data['color'] ?? '#e2e8f0',
                $data['border_color'] ?? '#94a3b8',
            ]
        );
    }

    public static function tableFor(string $type): ?string
    {
        return self::TABLE_MAP[$type] ?? null;
    }

    public static function types(): array
    {
        return array_keys(self::TABLE_MAP);
    }

    public static function columnsFor(string $table): array
    {
        return self::COLUMNS[$table] ?? [];
    }
}
