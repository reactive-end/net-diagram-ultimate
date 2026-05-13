<?php

declare(strict_types=1);

class BackupController
{
    public function export(array $params, Request $request): void
    {
        Auth::require();

        $db = Database::getInstance();
        $conn = $db->getConnection();
        $dbName = '';

        // Get database name from config
        $result = $conn->query('SELECT DATABASE()');
        if ($result) {
            $row = $result->fetch_row();
            $dbName = $row[0] ?? 'netdiagram';
            $result->free();
        }

        // Start building SQL dump
        $sql = "-- Net Diagram Ultimate — Database Backup\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- Database: " . $dbName . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

        // Get all tables
        $tables = $db->fetchAll('SHOW TABLES');
        foreach ($tables as $tableRow) {
            $tableName = reset($tableRow);
            
            // DROP TABLE IF EXISTS
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";

            // CREATE TABLE
            $createResult = $conn->query("SHOW CREATE TABLE `{$tableName}`");
            if ($createResult) {
                $createRow = $createResult->fetch_row();
                $sql .= $createRow[1] . ";\n\n";
                $createResult->free();
            }

            // INSERT data
            $rows = $db->fetchAll("SELECT * FROM `{$tableName}`");
            if (!empty($rows)) {
                foreach ($rows as $row) {
                    $values = [];
                    foreach ($row as $val) {
                        if ($val === null) {
                            $values[] = 'NULL';
                        } else {
                            $values[] = "'" . $conn->real_escape_string((string)$val) . "'";
                        }
                    }
                    $sql .= "INSERT INTO `{$tableName}` VALUES (" . implode(', ', $values) . ");\n";
                }
                $sql .= "\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

        // Return as downloadable file
        $filename = 'netdiagram_backup_' . date('Y-m-d_His') . '.sql';
        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($sql));
        header('Cache-Control: no-cache, must-revalidate');
        echo $sql;
        exit;
    }
}
