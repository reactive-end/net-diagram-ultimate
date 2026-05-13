<?php

declare(strict_types=1);

/**
 * Application configuration.
 * Loads database credentials from environment or falls back to defaults.
 */
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
}

return [
    'db' => [
        'host'     => $env['DB_HOST']     ?? 'localhost',
        'port'     => $env['DB_PORT']     ?? 3306,
        'name'     => $env['DB_NAME']     ?? 'netdiagram',
        'user'     => $env['DB_USER']     ?? 'root',
        'password' => $env['DB_PASSWORD'] ?? '',
        'charset'  => 'utf8',
    ],
    'app' => [
        'name'        => 'Net Diagram Ultimate',
        'session_name' => 'netdiagram_ultimate',
        'base_url'     => $env['APP_URL'] ?? '/',
        'debug'        => filter_var($env['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    ],
];
