<?php

declare(strict_types=1);

/**
 * HTTP request wrapper.
 */
class Request
{
    public readonly string $method;
    public readonly string $uri;
    public readonly array $headers;
    public readonly array $query;
    public readonly array $body;
    public readonly array $files;

    public function __construct()
    {
        $this->method  = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->uri     = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $this->headers = $this->parseHeaders();
        $this->query   = $_GET;
        $this->files   = $_FILES;

        // Parse JSON body or fallback to POST
        $rawBody = file_get_contents('php://input');
        $json    = json_decode($rawBody, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
            $this->body = $json;
        } else {
            $this->body = $_POST;
        }
    }

    /**
     * Get a value from body, query, or return default.
     */
    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }

    /**
     * Get only the specified keys from body.
     */
    public function only(array $keys): array
    {
        $result = [];
        foreach ($keys as $key) {
            if (array_key_exists($key, $this->body)) {
                $result[$key] = $this->body[$key];
            }
        }
        return $result;
    }

    /**
     * Check if the request accepts JSON.
     */
    public function wantsJson(): bool
    {
        $accept = $this->headers['accept'] ?? $this->headers['Accept'] ?? '';
        return str_contains($accept, 'application/json');
    }

    /**
     * Check if the request is an AJAX/fetch request.
     */
    public function isAjax(): bool
    {
        return ($this->headers['x-requested-with'] ?? '') === 'XMLHttpRequest'
            || $this->wantsJson();
    }

    private function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = str_replace('_', '-', substr($key, 5));
                $headers[$headerName] = $value;
            }
        }
        // Content-Type and Content-Length
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['CONTENT-TYPE'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['CONTENT-LENGTH'] = $_SERVER['CONTENT_LENGTH'];
        }
        return $headers;
    }
}
