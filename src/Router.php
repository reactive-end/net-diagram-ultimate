<?php

declare(strict_types=1);

/**
 * Simple PHP router — maps URI patterns to controller actions.
 */
class Router
{
    private array $routes = [];
    private array $middlewares = [];
    private string $basePath = '';

    /**
     * Set the base path for subdirectory installations.
     * E.g., if the app is at http://localhost/net-diagram-ultimate, set basePath to '/net-diagram-ultimate'.
     */
    public function setBasePath(string $path): void
    {
        $this->basePath = rtrim($path, '/');
    }

    /**
     * Register a GET route.
     */
    public function get(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('GET', $pattern, $handler);
    }

    /**
     * Register a POST route.
     */
    public function post(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('POST', $pattern, $handler);
    }

    /**
     * Register a PUT route.
     */
    public function put(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('PUT', $pattern, $handler);
    }

    /**
     * Register a PATCH route.
     */
    public function patch(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('PATCH', $pattern, $handler);
    }

    /**
     * Register a DELETE route.
     */
    public function delete(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('DELETE', $pattern, $handler);
    }

    /**
     * Register a route for multiple methods.
     */
    public function map(array $methods, string $pattern, callable|array $handler): self
    {
        foreach ($methods as $method) {
            $this->addRoute(strtoupper($method), $pattern, $handler);
        }
        return $this;
    }

    /**
     * Add a global middleware (called before every route).
     * Middleware signature: function(Request $request): ?Response (return Response to short-circuit)
     */
    public function middleware(callable $fn): self
    {
        $this->middlewares[] = $fn;
        return $this;
    }

    /**
     * Dispatch the current request.
     */
    public function dispatch(Request $request): void
    {
        // Run global middlewares
        foreach ($this->middlewares as $middleware) {
            $result = $middleware($request);
            if ($result !== null) {
                return; // Middleware handled the request
            }
        }

        $method = $request->method;
        $uri    = rtrim($request->uri, '/') ?: '/';

        // Strip base path for subdirectory installations
        if ($this->basePath !== '' && str_starts_with($uri, $this->basePath)) {
            $uri = substr($uri, strlen($this->basePath));
            $uri = rtrim($uri, '/') ?: '/';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->matchPattern($route['pattern'], $uri);
            if ($params !== false) {
                $this->invokeHandler($route['handler'], $params, $request);
                return;
            }
        }

        // 404 — No route matched
        if ($request->isAjax()) {
            Response::error('Route not found', 404);
        }
        http_response_code(404);
        echo '<h1>404 — Page not found</h1>';
        exit;
    }

    // --- Private ---

    private function addRoute(string $method, string $pattern, callable|array $handler): self
    {
        $this->routes[] = [
            'method'  => $method,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
        return $this;
    }

    /**
     * Match a URI against a route pattern.
     * Returns array of params or false.
     *
     * Supports:
     *   /api/diagram/{id}   — named parameter
     *   /api/*              — wildcard catch-all
     */
    private function matchPattern(string $pattern, string $uri): array|false
    {
        // Convert pattern to regex
        $paramNames = [];
        $regex = preg_replace_callback('/\{(\w+)\}/', function ($matches) use (&$paramNames) {
            $paramNames[] = $matches[1];
            return '([^/]+)';
        }, $pattern);

        // Handle wildcards
        $regex = str_replace('*', '.*', $regex);
        $regex = '#^' . $regex . '$#';

        if (preg_match($regex, $uri, $matches)) {
            array_shift($matches); // Remove full match
            $params = [];
            foreach ($paramNames as $i => $name) {
                $params[$name] = $matches[$i] ?? null;
            }
            return $params;
        }

        return false;
    }

    /**
     * Invoke the matched handler.
     */
    private function invokeHandler(callable|array $handler, array $params, Request $request): void
    {
        if (is_array($handler) && count($handler) === 2) {
            [$class, $method] = $handler;
            if (is_string($class)) {
                $class = new $class();
            }
            $handler = [$class, $method];
        }

        // Call with params + request
        call_user_func($handler, $params, $request);
    }
}
