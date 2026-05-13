<?php

declare(strict_types=1);

/**
 * SerieIp model — manages the IP address book for ping series.
 */
class SerieIp
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get all IP entries.
     */
    public function getAll(): array
    {
        return $this->db->fetchAll('SELECT * FROM serie_ip ORDER BY id_ip ASC');
    }

    /**
     * Get a single IP entry by ID.
     */
    public function getById(int $id): ?array
    {
        return $this->db->fetchOne('SELECT * FROM serie_ip WHERE id_ip = ?', [$id]);
    }

    /**
     * Get an IP entry by IP address.
     */
    public function getByIp(string $ip): ?array
    {
        return $this->db->fetchOne('SELECT * FROM serie_ip WHERE ip = ?', [$ip]);
    }

    /**
     * Get object ID by IP address (for linking).
     */
    public function getIdByIp(string $ip): ?int
    {
        $row = $this->db->fetchOne('SELECT id_ip FROM serie_ip WHERE ip = ?', [$ip]);
        return $row ? (int) $row['id_ip'] : null;
    }

    /**
     * Create a new IP entry.
     */
    public function create(string $ip, string $nombreAsociado = '', string $numeroContacto = ''): int
    {
        return $this->db->insert(
            'INSERT INTO serie_ip (ip, nombre_asociado, numero_contacto) VALUES (?, ?, ?)',
            [$ip, $nombreAsociado, $numeroContacto]
        );
    }

    /**
     * Update an IP entry.
     */
    public function update(int $id, string $ip, string $nombreAsociado = '', string $numeroContacto = ''): int
    {
        return $this->db->update(
            'UPDATE serie_ip SET ip = ?, nombre_asociado = ?, numero_contacto = ? WHERE id_ip = ?',
            [$ip, $nombreAsociado, $numeroContacto, $id]
        );
    }

    /**
     * Delete an IP entry.
     */
    public function delete(int $id): int
    {
        return $this->db->update('DELETE FROM serie_ip WHERE id_ip = ?', [$id]);
    }
}
