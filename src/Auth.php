<?php

declare(strict_types=1);

/**
 * Authentication logic.
 */
class Auth
{
    /**
     * Attempt to authenticate a user with username and password.
     * Returns true on success, false on failure.
     */
    public static function attempt(string $username, string $password): bool
    {
        $db = Database::getInstance();

        $user = $db->fetchOne(
            'SELECT id, user, password FROM users WHERE user = ?',
            [$username]
        );

        if ($user === null) {
            return false;
        }

        // Check if password is hashed (starts with $2y$) or plaintext (legacy)
        if (str_starts_with($user['password'], '$2y$')) {
            $valid = password_verify($password, $user['password']);
        } else {
            // Legacy plaintext comparison — migrate to hash on success
            $valid = ($password === $user['password']);
            if ($valid) {
                self::migratePassword((int) $user['id'], $password);
            }
        }

        if ($valid) {
            Session::setAuthenticated(true);
            Session::set('userId', (int) $user['id']);
            Session::set('username', $user['user']);
            Session::regenerate();
        }

        return $valid;
    }

    /**
     * Require authentication for the current request.
     * Sends a 401 JSON response or redirects to login.
     */
    public static function require(): void
    {
        if (!Session::isAuthenticated()) {
            $request = new Request();
            if ($request->isAjax()) {
                Response::error('Unauthorized', 401);
            }
            Response::redirect('/');
        }
    }

    /**
     * Migrate a plaintext password to bcrypt hash.
     */
    private static function migratePassword(int $userId, string $password): void
    {
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        Database::getInstance()->update(
            'UPDATE users SET password = ? WHERE id = ?',
            [$hash, $userId]
        );
    }
}
