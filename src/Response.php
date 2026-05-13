<?php

declare(strict_types=1);

/**
 * HTTP response helper.
 */
class Response
{
    /**
     * Send a JSON response.
     */
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    /**
     * Send a success JSON response.
     */
    public static function success(mixed $data = null, string $message = 'OK', int $status = 200): never
    {
        self::json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    /**
     * Send an error JSON response.
     */
    public static function error(string $message, int $status = 400, mixed $errors = null): never
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];
        if ($errors !== null) {
            $payload['errors'] = $errors;
        }
        self::json($payload, $status);
    }

    /**
     * Render a PHP view file.
     */
    public static function view(string $template, array $data = [], string $layout = 'base'): never
    {
        // Extract variables for the view
        extract($data, EXTR_SKIP);

        $viewPath = dirname(__DIR__) . "/views/{$template}.php";
        $layoutPath = dirname(__DIR__) . "/views/layouts/{$layout}.php";

        if (!file_exists($viewPath)) {
            http_response_code(500);
            echo "View not found: {$template}";
            exit;
        }

        // Capture the view content
        ob_start();
        require $viewPath;
        $content = ob_get_clean();

        // Wrap in layout if it exists
        if (file_exists($layoutPath)) {
            require $layoutPath;
        } else {
            echo $content;
        }
        exit;
    }

    /**
     * Redirect to another URL.
     * Relative URLs (starting with /) get BASE_PATH prepended for subdirectory installs.
     */
    public static function redirect(string $url, int $status = 302): never
    {
        // Only prepend BASE_PATH for relative app URLs (starting with /), not external URLs
        if ($url !== '' && $url[0] === '/' && !str_starts_with($url, '//')) {
            $base = defined('BASE_PATH') ? BASE_PATH : '';
            $url = $base . $url;
        }

        // Safety: ensure no double slashes (except after protocol://)
        $url = preg_replace('#(?<!:)/+#', '/', $url);

        http_response_code($status);
        header("Location: {$url}");
        exit;
    }

    /**
     * Set HTTP status code.
     */
    public static function setStatus(int $code): void
    {
        http_response_code($code);
    }
}
