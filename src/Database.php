<?php

declare(strict_types=1);

/**
 * Database abstraction layer using mysqli with prepared statements.
 * Singleton pattern — one connection per request.
 */
class Database
{
    private static ?Database $instance = null;
    private mysqli $connection;

    private function __construct(array $config)
    {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $this->connection = new mysqli(
            $config['host'],
            $config['user'],
            $config['password'],
            $config['name'],
            (int) $config['port']
        );

        $this->connection->set_charset($config['charset']);
    }

    public static function init(array $config): void
    {
        if (self::$instance === null) {
            self::$instance = new self($config);
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            throw new RuntimeException('Database not initialized. Call Database::init() first.');
        }
        return self::$instance;
    }

    /**
     * Execute a prepared statement and return the mysqli_result for SELECT queries.
     *
     * @param string $sql    SQL with ? placeholders
     * @param array  $params Parameter values in order
     * @return mysqli_result|bool
     */
    public function execute(string $sql, array $params = []): mysqli_result|bool
    {
        $stmt = $this->connection->prepare($sql);
        if ($stmt === false) {
            throw new RuntimeException('Prepare failed: ' . $this->connection->error);
        }

        if (!empty($params)) {
            $types = '';
            foreach ($params as $param) {
                $types .= $this->getParamType($param);
            }
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        // Return result for SELECT, true/false for others
        if ($result !== false) {
            return $result;
        }

        return $stmt->affected_rows >= 0;
    }

    /**
     * Fetch all rows as associative array.
     */
    public function fetchAll(string $sql, array $params = []): array
    {
        $result = $this->execute($sql, $params);
        if ($result instanceof mysqli_result) {
            $rows = $result->fetch_all(MYSQLI_ASSOC);
            $result->free();
            return $rows;
        }
        return [];
    }

    /**
     * Fetch a single row as associative array, or null if no match.
     */
    public function fetchOne(string $sql, array $params = []): ?array
    {
        $rows = $this->fetchAll($sql, $params);
        return $rows[0] ?? null;
    }

    /**
     * Insert a row and return the auto-increment ID.
     */
    public function insert(string $sql, array $params = []): int
    {
        $this->execute($sql, $params);
        return (int) $this->connection->insert_id;
    }

    /**
     * Execute an update/delete and return affected row count.
     */
    public function update(string $sql, array $params = []): int
    {
        $this->execute($sql, $params);
        return $this->connection->affected_rows;
    }

    /**
     * Begin a transaction.
     */
    public function beginTransaction(): void
    {
        $this->connection->begin_transaction(MYSQLI_TRANS_START_READ_WRITE);
    }

    /**
     * Commit the active transaction.
     */
    public function commit(): void
    {
        $this->connection->commit();
    }

    /**
     * Rollback the active transaction.
     */
    public function rollback(): void
    {
        $this->connection->rollback();
    }

    /**
     * Escape a string for use in LIKE patterns (manual escaping for edge cases).
     */
    public function escape(string $value): string
    {
        return $this->connection->real_escape_string($value);
    }

    /**
     * Get the raw mysqli connection (for rare cases like exec).
     */
    public function getConnection(): mysqli
    {
        return $this->connection;
    }

    private function getParamType(mixed $value): string
    {
        return match (true) {
            is_int($value)  => 'i',
            is_float($value) => 'd',
            is_string($value) => 's',
            default          => 's',
        };
    }

    // Prevent cloning/unserialization (true singleton)
    private function __clone() {}
    public function __wakeup()
    {
        throw new RuntimeException('Cannot unserialize singleton');
    }
}
