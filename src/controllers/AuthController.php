<?php

declare(strict_types=1);

/**
 * Authentication controller.
 */
class AuthController
{
    /**
     * GET / — Login page.
     */
    public function loginPage(array $params, Request $request): void
    {
        if (Session::isAuthenticated()) {
            Response::redirect('/mainmenu');
        }
        Response::view('login', [
            'title' => 'Net Diagram Ultimate — Login',
            'csrf'  => Session::csrfToken(),
        ], 'auth');
    }

    /**
     * POST /api/login — Authenticate user.
     */
    public function login(array $params, Request $request): void
    {
        $validator = new Validator();
        if (!$validator->validate($request->body, [
            'username' => 'required|min:2|max:64',
            'password' => 'required|min:1',
        ])) {
            Response::error($validator->firstError() ?? 'Datos inválidos.', 422, $validator->errors());
        }

        $username = $request->input('username');
        $password = $request->input('password');

        if (Auth::attempt($username, $password)) {
            Response::success([
                'redirect' => BASE_PATH . '/mainmenu',
            ], 'Inicio de sesión exitoso.');
        }

        Response::error('Usuario o contraseña incorrectos.', 401);
    }

    /**
     * POST /api/logout — End session.
     */
    public function logout(array $params, Request $request): void
    {
        Session::destroy();
        Response::success(['redirect' => BASE_PATH . '/'], 'Sesión cerrada.');
    }
}
