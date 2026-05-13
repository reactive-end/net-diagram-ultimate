<?php

declare(strict_types=1);

/**
 * Net Diagram Ultimate — Front Controller
 *
 * All requests are routed through this single entry point.
 * Apache/.htaccess rewrites everything to index.php.
 */

// --- Bootstrap ---
define('APP_ROOT', dirname(__DIR__));

// Detect base path EARLY (before session, before DB)
// Auto-detect if the app is in a subdirectory (e.g. /net-diagram-ultimate)
$scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '/');
$basePath = ($scriptDir === '/' || $scriptDir === '\\') ? '' : $scriptDir;
define('BASE_PATH', $basePath);

// Health-check endpoint — bypasses everything
if (($_SERVER['REQUEST_URI'] ?? '') === $basePath . '/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status'  => 'ok',
        'base'    => BASE_PATH,
        'php'     => PHP_VERSION,
        'time'    => date('c'),
    ]);
    exit;
}

// Autoload classes (simple PSR-4-like manual loader)
spl_autoload_register(function (string $class) {
    $paths = [
        APP_ROOT . '/src/' . $class . '.php',
        APP_ROOT . '/src/controllers/' . $class . '.php',
        APP_ROOT . '/src/models/' . $class . '.php',
    ];
    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

// Load configuration
$config = require APP_ROOT . '/src/config.php';

// Initialize core services
Database::init($config['db']);
Session::init($config['app']['session_name']);

// Error handling
if ($config['app']['debug'] ?? false) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

// Global error handler for uncaught exceptions
set_exception_handler(function (Throwable $e) use ($config) {
    $message = $config['app']['debug'] ? $e->getMessage() : 'Internal server error.';
    if (class_exists('Response')) {
        Response::error($message, 500);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
});

// --- Router Setup ---
$router = new Router();
$router->setBasePath(BASE_PATH);

// =====================
//  PAGE ROUTES (HTML views)
// =====================

// Login
$router->get('/',                       [AuthController::class, 'loginPage']);

// Main menu
$router->get('/mainmenu',               [DiagramController::class, 'index']);

// Diagram editor
$router->get('/diagram/{id}',           [DiagramController::class, 'editor']);

// =====================
//  API ROUTES (JSON)
// =====================

// Authentication
$router->post('/api/login',             [AuthController::class, 'login']);
$router->post('/api/logout',            [AuthController::class, 'logout']);

// Diagrams
$router->get('/api/diagrams',           [DiagramController::class, 'list']);
$router->get('/api/diagram/{id}',       [DiagramController::class, 'show']);
$router->post('/api/diagram',           [DiagramController::class, 'create']);
$router->map(['PUT', 'PATCH'], '/api/diagram/{id}', [DiagramController::class, 'update']);
$router->delete('/api/diagram/{id}',    [DiagramController::class, 'delete']);
$router->post('/api/diagram/{id}/clone',[DiagramController::class, 'clone']);
$router->post('/api/diagram/{id}/clear',[DiagramController::class, 'clear']);

// Devices (within a diagram)
$router->post('/api/diagram/{id}/device',  [DeviceController::class, 'create']);
$router->post('/api/diagram/{id}/line',    [DeviceController::class, 'createLine']);
$router->post('/api/diagram/{id}/note',    [DeviceController::class, 'createNote']);
$router->post('/api/diagram/{id}/box',     [DeviceController::class, 'createBox']);
$router->post('/api/diagram/{id}/save',    [DeviceController::class, 'saveBatch']);
$router->get('/api/diagram/{id}/objects',  [DeviceController::class, 'getObjects']);

// Ping
$router->post('/api/ping',              [PingController::class, 'ping']);

// IP Series
$router->get('/api/ip-serie',           [PingController::class, 'listSerie']);
$router->post('/api/ip-serie',          [PingController::class, 'createSerie']);
$router->put('/api/ip-serie/{id}',      [PingController::class, 'updateSerie']);
$router->delete('/api/ip-serie/{id}',   [PingController::class, 'deleteSerie']);
$router->get('/api/ip-serie/lookup',    [PingController::class, 'lookupIp']);

// Canvas
$router->get('/api/canvas/{id}',        [CanvasController::class, 'getSize']);
$router->put('/api/canvas/{id}',        [CanvasController::class, 'setSize']);

// Backup
$router->get('/api/backup',              [BackupController::class, 'export']);

// --- Dispatch ---
$request = new Request();
$router->dispatch($request);
