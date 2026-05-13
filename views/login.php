<div class="auth-container">
    <div class="auth-card">
        <div class="auth-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#04277B"/>
                <circle cx="24" cy="16" r="4" stroke="#60a5fa" stroke-width="2.5" fill="none"/>
                <circle cx="16" cy="30" r="4" stroke="#60a5fa" stroke-width="2.5" fill="none"/>
                <circle cx="32" cy="30" r="4" stroke="#60a5fa" stroke-width="2.5" fill="none"/>
                <line x1="21" y1="19" x2="17" y2="27" stroke="#94a3b8" stroke-width="2"/>
                <line x1="27" y1="19" x2="31" y2="27" stroke="#94a3b8" stroke-width="2"/>
                <line x1="20" y1="30" x2="28" y2="30" stroke="#94a3b8" stroke-width="2"/>
            </svg>
        </div>
        <h1 class="auth-title">Net Diagram Ultimate</h1>
        <p class="auth-subtitle">Inicia sesión para continuar</p>

        <form id="login-form" class="auth-form" method="POST" novalidate>
            <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrf ?? '') ?>">

            <div class="form-group">
                <label for="username">Usuario</label>
                <div class="input-wrapper">
                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input type="text" id="username" name="username" class="form-input" placeholder="Nombre de usuario" autocomplete="username" required autofocus>
                </div>
            </div>

            <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="input-wrapper">
                    <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <input type="password" id="password" name="password" class="form-input" placeholder="Contraseña" autocomplete="current-password" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="login-btn">
                <span class="btn-text">Iniciar Sesión</span>
                <span class="btn-spinner" style="display:none;"></span>
            </button>
        </form>

        <div id="login-error" class="alert alert-error" style="display:none;"></div>
    </div>
</div>

<script>
const BASE = '<?= BASE_PATH ?>';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');
    const btnText = btn.querySelector('.btn-text');
    const btnSpinner = btn.querySelector('.btn-spinner');

    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    btn.disabled = true;
    errorEl.style.display = 'none';

    try {
        const res = await fetch(BASE + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('username').value.trim(),
                password: document.getElementById('password').value,
            }),
        });

        const data = await res.json();

        if (data.success) {
            window.location.href = data.data.redirect;
        } else {
            errorEl.textContent = data.message;
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
        errorEl.style.display = 'block';
    } finally {
        btnText.style.display = '';
        btnSpinner.style.display = 'none';
        btn.disabled = false;
    }
});
</script>
