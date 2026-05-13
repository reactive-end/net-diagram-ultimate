<?php

declare(strict_types=1);

/**
 * Session management wrapper.
 */
class Session
{
    private static bool $started = false;

    /**
     * Initialize the session with the application's session name.
     */
    public static function init(string $sessionName = 'netdiagram_ultimate'): void
    {
        if (self::$started) {
            return;
        }

        if (session_status() === PHP_SESSION_NONE) {
            // Set cookie path to current directory so sessions work
            // regardless of subdirectory vs virtual host
            $cookiePath = defined('BASE_PATH') ? (BASE_PATH ?: '/') : '/';

            session_name($sessionName);
            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => $cookiePath,
                'domain'   => '',
                'secure'   => false,
                'httponly'  => true,
                'samesite'  => 'Lax',
            ]);
            session_start();
        }

        self::$started = true;

        // Set defaults
        if (!isset($_SESSION['verifiedUser'])) {
            $_SESSION['verifiedUser'] = 0;
        }
    }

    /**
     * Check if the user is authenticated.
     */
    public static function isAuthenticated(): bool
    {
        self::ensureStarted();
        return ($_SESSION['verifiedUser'] ?? 0) === 1;
    }

    /**
     * Set the authenticated user state.
     */
    public static function setAuthenticated(bool $value): void
    {
        self::ensureStarted();
        $_SESSION['verifiedUser'] = $value ? 1 : 0;
    }

    /**
     * Get a session value.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        self::ensureStarted();
        return $_SESSION[$key] ?? $default;
    }

    /**
     * Set a session value.
     */
    public static function set(string $key, mixed $value): void
    {
        self::ensureStarted();
        $_SESSION[$key] = $value;
    }

    /**
     * Remove a session value.
     */
    public static function remove(string $key): void
    {
        self::ensureStarted();
        unset($_SESSION[$key]);
    }

    /**
     * Regenerate session ID (security best practice after login).
     */
    public static function regenerate(): void
    {
        self::ensureStarted();
        session_regenerate_id(true);
    }

    /**
     * Destroy the session completely.
     */
    public static function destroy(): void
    {
        self::ensureStarted();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        session_destroy();
        self::$started = false;
    }

    /**
     * Get the CSRF token, generating one if needed.
     */
    public static function csrfToken(): string
    {
        self::ensureStarted();
        if (empty($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf_token'];
    }

    /**
     * Validate a CSRF token.
     */
    public static function validateCsrf(string $token): bool
    {
        self::ensureStarted();
        return hash_equals($_SESSION['_csrf_token'] ?? '', $token);
    }

    private static function ensureStarted(): void
    {
        if (!self::$started) {
            self::init();
        }
    }
}
