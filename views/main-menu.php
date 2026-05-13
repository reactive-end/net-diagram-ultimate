<div class="main-menu-page">
    <!-- Header -->
    <header class="topbar">
        <div class="topbar-brand">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="white" fill-opacity="0.1"/>
                <circle cx="24" cy="16" r="4" stroke="#60a5fa" stroke-width="2.5" fill="none"/>
                <circle cx="16" cy="30" r="4" stroke="#60a5fa" stroke-width="2.5" fill="none"/>
                <circle cx="32" cy="30" r="4" stroke="#60a5fa" stroke-width="2.5" fill="none"/>
                <line x1="21" y1="19" x2="17" y2="27" stroke="#94a3b8" stroke-width="2"/>
                <line x1="27" y1="19" x2="31" y2="27" stroke="#94a3b8" stroke-width="2"/>
                <line x1="20" y1="30" x2="28" y2="30" stroke="#94a3b8" stroke-width="2"/>
            </svg>
            <span class="topbar-title">Net Diagram Ultimate</span>
        </div>
        <div class="topbar-actions">
            <button class="btn btn-outline" onclick="logout()">Cerrar Sesión</button>
        </div>
    </header>

    <div class="main-menu-content">
        <!-- Toolbar -->
        <div class="menu-toolbar">
            <button class="btn btn-primary" id="btn-new-diagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo Diagrama
            </button>
            <button class="btn btn-secondary" id="btn-ping-serie">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Ping en Serie
            </button>
        </div>

        <!-- Diagram Grid -->
        <div class="diagram-grid" id="diagram-grid">
            <?php if (empty($diagrams)): ?>
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>No hay diagramas aún.</p>
                <p class="text-muted">Crea tu primer diagrama para comenzar.</p>
            </div>
            <?php else: ?>
                <?php foreach ($diagrams as $d): ?>
                <div class="diagram-card"
                     data-id="<?= (int) $d['id'] ?>"
                     data-name="<?= htmlspecialchars($d['name']) ?>">
                    <div class="diagram-card-preview">
                        <svg width="100%" height="120" viewBox="0 0 200 120" fill="none">
                            <rect width="200" height="120" rx="8" fill="#f1f5f9"/>
                            <circle cx="60" cy="40" r="12" stroke="#04277B" stroke-width="2" fill="white"/>
                            <circle cx="140" cy="40" r="12" stroke="#04277B" stroke-width="2" fill="white"/>
                            <circle cx="100" cy="80" r="12" stroke="#04277B" stroke-width="2" fill="white"/>
                            <line x1="72" y1="40" x2="128" y2="40" stroke="#94a3b8" stroke-width="2"/>
                            <line x1="60" y1="52" x2="90" y2="72" stroke="#94a3b8" stroke-width="2"/>
                            <line x1="140" y1="52" x2="110" y2="72" stroke="#94a3b8" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="diagram-card-body">
                        <h3 class="diagram-card-name"><?= htmlspecialchars($d['name']) ?></h3>
                        <span class="diagram-card-meta"><?= (int) $d['width'] ?> × <?= (int) $d['height'] ?></span>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- Context Menu -->
    <div class="context-menu" id="context-menu" style="display:none;">
        <button class="context-item" data-action="open">Abrir Diagrama</button>
        <button class="context-item" data-action="clone">Clonar Diagrama</button>
        <button class="context-item context-item-danger" data-action="delete">Eliminar Diagrama</button>
    </div>

    <!-- Modals -->
    <div class="modal-overlay" id="modal-new-diagram" style="display:none;">
        <div class="modal">
            <div class="modal-header">
                <h2>Nuevo Diagrama</h2>
                <button class="modal-close" onclick="closeModal('modal-new-diagram')">&times;</button>
            </div>
            <form id="form-new-diagram" class="modal-body">
                <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrf ?? '') ?>">
                <div class="form-group">
                    <label for="diagram-name">Nombre del diagrama</label>
                    <input type="text" id="diagram-name" name="name" class="form-input" required placeholder="Mi diagrama">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="diagram-width">Ancho (px)</label>
                        <input type="number" id="diagram-width" name="width" class="form-input" value="1200" min="200" max="10000">
                    </div>
                    <div class="form-group">
                        <label for="diagram-height">Alto (px)</label>
                        <input type="number" id="diagram-height" name="height" class="form-input" value="800" min="200" max="10000">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Crear Diagrama</button>
            </form>
        </div>
    </div>

    <div class="modal-overlay" id="modal-clone-diagram" style="display:none;">
        <div class="modal">
            <div class="modal-header">
                <h2>Clonar Diagrama</h2>
                <button class="modal-close" onclick="closeModal('modal-clone-diagram')">&times;</button>
            </div>
            <form id="form-clone-diagram" class="modal-body">
                <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrf ?? '') ?>">
                <input type="hidden" id="clone-diagram-id" name="id">
                <div class="form-group">
                    <label for="clone-name">Nombre de la copia</label>
                    <input type="text" id="clone-name" name="name" class="form-input" required placeholder="Copia del diagrama">
                </div>
                <button type="submit" class="btn btn-primary btn-full">Clonar</button>
            </form>
        </div>
    </div>

    <div class="modal-overlay" id="modal-delete-diagram" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2>Eliminar Diagrama</h2>
                <button class="modal-close" onclick="closeModal('modal-delete-diagram')">&times;</button>
            </div>
            <div class="modal-body">
                <p>¿Estás seguro? Esta acción es irreversible y eliminará todos los objetos del diagrama.</p>
                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="closeModal('modal-delete-diagram')">Cancelar</button>
                    <button class="btn btn-danger" id="btn-confirm-delete">Eliminar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Ping Serie Modal -->
    <div class="modal-overlay" id="modal-ping-serie" style="display:none;">
        <div class="modal modal-xl">
            <div class="modal-header">
                <h2>Ping en Serie</h2>
                <button class="modal-close" onclick="PingSerie.close()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="ping-serie-toolbar">
                    <button class="btn btn-primary btn-sm" id="btn-start-ping-serie">Iniciar Ping</button>
                    <label class="checkbox-label">
                        <input type="checkbox" id="infinite-ping"> Ping Infinito
                    </label>
                    <button class="btn btn-outline btn-sm" id="btn-stop-ping-serie" style="display:none;">Detener</button>
                </div>
                <!-- Ping items rendered as a card grid -->
                <div class="ping-serie-grid" id="ping-serie-list">
                    <?php foreach ($serieIps as $ip): ?>
                    <div class="ping-serie-item ping-idle" data-id="<?= (int) $ip['id_ip'] ?>">
                        <div class="ping-ip-row">
                            <span class="ping-status-badge badge-idle">Sin conexión</span>
                            <span class="ping-ip"><?= htmlspecialchars($ip['ip']) ?></span>
                        </div>
                        <span class="ping-name"><?= htmlspecialchars($ip['nombre_asociado'] ?? '') ?></span>
                        <span class="ping-contact"><?= (!empty($ip['numero_contacto']) && $ip['numero_contacto'] !== '0') ? htmlspecialchars($ip['numero_contacto']) : 'Sin Telefono Asociado' ?></span>
                        <div class="ping-actions">
                            <button class="btn-icon edit-ip" title="Editar">✎</button>
                            <button class="btn-icon delete-ip" title="Eliminar">✕</button>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <div class="ping-serie-add">
                    <div class="ip-input-container" style="flex:2;min-width:160px;">
                        <input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="0" placeholder="192">
                        <span class="ip-dot">.</span>
                        <input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="1" placeholder="168">
                        <span class="ip-dot">.</span>
                        <input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="2" placeholder="1">
                        <span class="ip-dot">.</span>
                        <input type="text" class="form-input ip-octet" maxlength="3" pattern="[0-9]*" inputmode="numeric" data-octet="3" placeholder="1">
                    </div>
                    <input type="hidden" id="new-ip-hidden" class="ip-hidden">
                    <input type="text" id="new-ip-name" class="form-input" placeholder="Nombre asociado" style="flex:1;min-width:100px;">
                    <input type="text" id="new-ip-contact" class="form-input" placeholder="N° Contacto" style="flex:1;min-width:90px;">
                    <button class="btn btn-secondary btn-sm" id="btn-add-ip">Agregar IP</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Ping Serie Edit IP Modal -->
    <div class="modal-overlay" id="modal-edit-ip" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2>Editar IP</h2>
                <button class="modal-close" onclick="UIModals.close('modal-edit-ip')">&times;</button>
            </div>
            <div class="modal-body ping-edit-form">
                <form id="form-edit-ip">
                    <input type="hidden" id="edit-ip-id" name="id">
                    <div class="form-group">
                        <label for="edit-ip-address">Dirección IP</label>
                        <input type="text" id="edit-ip-address" name="ip" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-ip-name">Nombre asociado</label>
                        <input type="text" id="edit-ip-name" name="nombre_asociado" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="edit-ip-contact">N° Contacto</label>
                        <input type="text" id="edit-ip-contact" name="numero_contacto" class="form-input">
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Guardar Cambios</button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
window.BASE_PATH = '<?= BASE_PATH ?>';
const BASE = window.BASE_PATH;

// --- Helpers ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
async function logout() {
    await fetch(BASE + '/api/logout', { method: 'POST' });
    window.location.href = BASE + '/';
}

// --- Diagram card click ---
let contextTarget = null;

document.querySelectorAll('.diagram-card').forEach(card => {
    card.addEventListener('click', () => {
        window.location.href = BASE + '/diagram/' + card.dataset.id;
    });

    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        contextTarget = card;
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
    });
});

// Close context menu
document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});

// Context menu actions
document.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (!contextTarget) return;

        if (action === 'open') {
            window.location.href = BASE + '/diagram/' + contextTarget.dataset.id;
        } else if (action === 'clone') {
            document.getElementById('clone-diagram-id').value = contextTarget.dataset.id;
            document.getElementById('clone-name').value = contextTarget.dataset.name + ' (copia)';
            openModal('modal-clone-diagram');
        } else if (action === 'delete') {
            document.getElementById('btn-confirm-delete').dataset.diagramId = contextTarget.dataset.id;
            openModal('modal-delete-diagram');
        }
    });
});

// --- New diagram ---
document.getElementById('btn-new-diagram').addEventListener('click', () => openModal('modal-new-diagram'));

document.getElementById('form-new-diagram').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const width = parseInt(form.width.value) || 1200;
    const height = parseInt(form.height.value) || 800;

    const res = await fetch(BASE + '/api/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, width, height }),
    });
    const data = await res.json();
    if (data.success) {
        window.location.href = data.data.redirect;
    } else {
        alert(data.message);
    }
});

// --- Clone diagram ---
document.getElementById('form-clone-diagram').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('clone-diagram-id').value;
    const name = document.getElementById('clone-name').value.trim();

    const res = await fetch(BASE + '/api/diagram/' + id + '/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
        window.location.href = data.data.redirect;
    } else {
        alert(data.message);
    }
});

// --- Delete diagram ---
document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    const id = document.getElementById('btn-confirm-delete').dataset.diagramId;
    const res = await fetch(BASE + '/api/diagram/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
        window.location.reload();
    } else {
        alert(data.message);
    }
});

// --- Ping Serie (shared via PingSerie module, loaded after API and DOMHelpers) ---
document.addEventListener('DOMContentLoaded', () => {
    // The PingSerie module is loaded via script tag but auto-inits
});
</script>
<script src="<?= BASE_PATH ?>/assets/js/modules/dom-helpers.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/api.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/modals.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/ping.js"></script>
<script data-worker="ping" data-src="<?= BASE_PATH ?>/assets/js/workers/ping-worker.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/ping-serie.js"></script>
