<?php
// Diagram editor — the main canvas page
$diagramId = (int) $diagram['id'];
$diagramName = htmlspecialchars($diagram['name']);
$canvasWidth = (int) ($diagram['width'] ?? 1200);
$canvasHeight = (int) ($diagram['height'] ?? 800);
?>

<div class="diagram-page" id="diagram-page" data-diagram-id="<?= $diagramId ?>">
    <!-- Top Bar -->
    <header class="editor-topbar">
        <div class="editor-topbar-left">
            <button class="btn-icon" id="btn-back" title="Volver al menú">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="editor-diagram-name"><?= $diagramName ?></span>
            <span class="editor-diagram-id">#<?= $diagramId ?></span>
        </div>
        <div class="editor-topbar-right">
            <button class="btn btn-sm btn-outline" id="btn-save" title="Guardar diagrama">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span class="btn-text">Guardar</span>
                <span class="btn-spinner" style="display:none;"></span>
            </button>
        </div>
    </header>

    <!-- Canvas Area -->
    <div class="canvas-viewport" id="canvas-viewport">
        <div class="canvas-container"
             id="canvas"
             style="width:<?= $canvasWidth ?>px; height:<?= $canvasHeight ?>px;"
             data-width="<?= $canvasWidth ?>"
             data-height="<?= $canvasHeight ?>">

            <!-- Render saved objects -->
            <?php
            // Boxes (background rectangles)
            foreach (($objects['boxes'] ?? []) as $box):
                $bx = (int) ($box['pos_x'] ?? 0);
                $by = (int) ($box['pos_y'] ?? 0);
                $bw = (int) ($box['box_width'] ?? 100);
                $bh = (int) ($box['box_height'] ?? 100);
                $bc = htmlspecialchars($box['color'] ?? '#e2e8f0');
                $bb = htmlspecialchars($box['border_color'] ?? '#94a3b8');
            ?>
            <div class="node-box"
                 style="left:<?= $bx ?>px; top:<?= $by ?>px; width:<?= $bw ?>px; height:<?= $bh ?>px; background:<?= $bc ?>; border:2px dashed <?= $bb ?>; position:absolute;"></div>
            <?php endforeach; ?>

            <?php
            // Antennas
            foreach (($objects['antennas'] ?? []) as $a):
                $ax = (int) ($a['pos_x'] ?? 0);
                $ay = (int) ($a['pos_y'] ?? 0);
            ?>
            <div class="object object-antenna"
                 data-type="antenna"
                 data-id="<?= (int) $a['objectID'] ?>"
                 data-name="<?= htmlspecialchars($a['name']) ?>"
                 data-ssid="<?= htmlspecialchars($a['ssid']) ?>"
                 data-ip="<?= htmlspecialchars($a['ip']) ?>"
                 data-frequency="<?= (int) $a['frecuency'] ?>"
                 data-mode="<?= (int) $a['mode'] ?>"
                 data-band="<?= htmlspecialchars($a['band'] ?? '') ?>"
                 data-ap-client="<?= (int) ($a['apClient'] ?? 0) ?>"
                 style="left:<?= $ax ?>px; top:<?= $ay ?>px; position:absolute;"
                 draggable="false">
                <?php
                    $antennaIcon = ((int) ($a['mode'] ?? 0) === 0) ? 'antenna-ap.svg' : 'antenna-station.svg';
                    echo file_get_contents(APP_ROOT . '/public/assets/img/devices/' . $antennaIcon);
                ?>
                <span class="object-info"><?= htmlspecialchars($a['name']) ?><br><small><?= htmlspecialchars($a['ip']) ?></small></span>
            </div>
            <?php endforeach; ?>

            <?php
            // Routers
            foreach (($objects['routers'] ?? []) as $r):
                $rx = (int) ($r['pos_x'] ?? 0);
                $ry = (int) ($r['pos_y'] ?? 0);
            ?>
            <div class="object object-router"
                 data-type="router"
                 data-id="<?= (int) $r['objectID'] ?>"
                 data-name="<?= htmlspecialchars($r['name']) ?>"
                 data-ip="<?= htmlspecialchars($r['ip']) ?>"
                 data-ports="<?= (int) $r['ports'] ?>"
                 style="left:<?= $rx ?>px; top:<?= $ry ?>px; position:absolute;"
                 draggable="false">
                <?= file_get_contents(APP_ROOT . '/public/assets/img/devices/router.svg') ?>
                <span class="object-info"><?= htmlspecialchars($r['name']) ?><br><small><?= htmlspecialchars($r['ip']) ?></small></span>
            </div>
            <?php endforeach; ?>

            <?php
            // Switches
            foreach (($objects['switches'] ?? []) as $s):
                $sx = (int) ($s['pos_x'] ?? 0);
                $sy = (int) ($s['pos_y'] ?? 0);
            ?>
            <div class="object object-switch"
                 data-type="switch"
                 data-id="<?= (int) $s['objectID'] ?>"
                 data-name="<?= htmlspecialchars($s['name']) ?>"
                 data-ip="<?= htmlspecialchars($s['ip']) ?>"
                 data-ports="<?= (int) $s['ports'] ?>"
                 style="left:<?= $sx ?>px; top:<?= $sy ?>px; position:absolute;"
                 draggable="false">
                <?= file_get_contents(APP_ROOT . '/public/assets/img/devices/switch.svg') ?>
                <span class="object-info"><?= htmlspecialchars($s['name']) ?><br><small><?= htmlspecialchars($s['ip']) ?></small></span>
            </div>
            <?php endforeach; ?>

            <?php
            // Modems
            foreach (($objects['modems'] ?? []) as $m):
                $mx = (int) ($m['pos_x'] ?? 0);
                $my = (int) ($m['pos_y'] ?? 0);
            ?>
            <div class="object object-modem"
                 data-type="modem"
                 data-id="<?= (int) $m['objectID'] ?>"
                 data-name="<?= htmlspecialchars($m['name']) ?>"
                 data-ip="<?= htmlspecialchars($m['ip']) ?>"
                 data-service="<?= htmlspecialchars($m['service'] ?? '') ?>"
                 data-vlan="<?= htmlspecialchars($m['vlan'] ?? '') ?>"
                 style="left:<?= $mx ?>px; top:<?= $my ?>px; position:absolute;"
                 draggable="false">
                <?= file_get_contents(APP_ROOT . '/public/assets/img/devices/modem.svg') ?>
                <span class="object-info"><?= htmlspecialchars($m['name']) ?><br><small><?= htmlspecialchars($m['ip']) ?></small></span>
            </div>
            <?php endforeach; ?>

            <?php
            // Computers
            foreach (($objects['computers'] ?? []) as $c):
                $cx = (int) ($c['pos_x'] ?? 0);
                $cy = (int) ($c['pos_y'] ?? 0);
            ?>
            <div class="object object-computer"
                 data-type="computer"
                 data-id="<?= (int) $c['objectID'] ?>"
                 data-name="<?= htmlspecialchars($c['name']) ?>"
                 data-ip="<?= htmlspecialchars($c['ip']) ?>"
                 style="left:<?= $cx ?>px; top:<?= $cy ?>px; position:absolute;"
                 draggable="false">
                <?= file_get_contents(APP_ROOT . '/public/assets/img/devices/computer.svg') ?>
                <span class="object-info"><?= htmlspecialchars($c['name']) ?><br><small><?= htmlspecialchars($c['ip']) ?></small></span>
            </div>
            <?php endforeach; ?>

            <?php
            // Notes
            foreach (($objects['notes'] ?? []) as $n):
                $nx = (int) ($n['pos_x'] ?? 0);
                $ny = (int) ($n['pos_y'] ?? 0);
            ?>
            <div class="note"
                 data-id="<?= (int) $n['noteID'] ?>"
                 data-text="<?= htmlspecialchars($n['text']) ?>"
                 style="left:<?= $nx ?>px; top:<?= $ny ?>px; position:absolute;"
                 draggable="false">
                <?= htmlspecialchars($n['text']) ?>
            </div>
            <?php endforeach; ?>

            <?php
            // Build a map of objectID → icon center position from all loaded devices
            // Icon is 48×48 centered in 80px-wide .object container
            // Center X = pos_x + 40 (half of 80px container)
            // Center Y = pos_y + 24 (half of 48px icon, the visual anchor)
            $objCenterMap = [];
            $deviceTypes = ['antennas', 'routers', 'switches', 'modems', 'computers'];
            foreach ($deviceTypes as $type) {
                foreach (($objects[$type] ?? []) as $dev) {
                    $oid = (int) ($dev['objectID'] ?? 0);
                    if ($oid > 0) {
                        $dx = (int) ($dev['pos_x'] ?? 0);
                        $dy = (int) ($dev['pos_y'] ?? 0);
                        $objCenterMap[$oid] = ['x' => $dx + 40, 'y' => $dy + 24];
                    }
                }
            }

            // Lines (rendered as positioned divs)
            foreach (($objects['lines'] ?? []) as $line):
                $parentId = (int) ($line['parentElement'] ?? 0);
                $linkedId = (int) ($line['linkedObject'] ?? 0);

                // Try to compute line position from parent/linked objects
                $from = $objCenterMap[$parentId] ?? null;
                $to   = $objCenterMap[$linkedId] ?? null;

                if ($from && $to) {
                    $dx = $to['x'] - $from['x'];
                    $dy = $to['y'] - $from['y'];
                    $lx = $from['x'];
                    $ly = $from['y'];
                    $lw = sqrt($dx * $dx + $dy * $dy);
                    $la = rad2deg(atan2($dy, $dx));
                } else {
                    // Fallback to stored DB values (may be 0 for migrated data)
                    $lx = (int) ($line['pos_x'] ?? 0);
                    $ly = (int) ($line['pos_y'] ?? 0);
                    $lw = (float) ($line['line_width'] ?? 0);
                    $la = (float) ($line['line_angle'] ?? 0);
                }
            ?>
            <div class="line"
                 data-id="<?= (int) $line['lineID'] ?>"
                 data-brother="<?= (int) $line['brotherLine'] ?>"
                 data-parent="<?= (int) $line['parentElement'] ?>"
                 data-linked="<?= (int) $line['linkedObject'] ?>"
                 style="left:<?= $lx ?>px; top:<?= $ly ?>px; width:<?= $lw ?>px; transform:rotate(<?= $la ?>deg); position:absolute;">
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Side Toolbar -->
    <aside class="taskbar closed" id="taskbar">
        <div class="taskbar-header">
            <h3>Herramientas</h3>
            <button class="btn-icon" id="btn-taskbar-close">&times;</button>
        </div>
        <nav class="taskbar-nav">
            <button class="taskbar-btn" data-action="add-object">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar Dispositivo
            </button>
            <button class="taskbar-btn" data-action="add-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                Agregar Caja
            </button>
            <button class="taskbar-btn" data-action="add-note">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Agregar Nota
            </button>
            <button class="taskbar-btn" data-action="config-canvas">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                Configurar Lienzo
            </button>
            <button class="taskbar-btn" data-action="ping-serie">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Ping en Serie
            </button>
            <button class="taskbar-btn" id="btn-ping-trace" data-action="ping-trace">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><polyline points="5 5 12 12 19 19"/><polyline points="5 5 12 2 19 5"/></svg>
                Trazado de Ping
            </button>
            <button class="taskbar-btn" data-action="print">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H4a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Exportar PNG
            </button>
            <button class="taskbar-btn" id="btn-backup-db" data-action="backup">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Respaldar BD
            </button>
            <button class="taskbar-btn taskbar-btn-danger" data-action="exit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Salir
            </button>
        </nav>
    </aside>

    <!-- Toggle taskbar button (when hidden) -->
    <button class="taskbar-toggle" id="btn-taskbar-open" style="display:flex;" title="Abrir herramientas">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>

    <!-- Context Menu — Object -->
    <div class="context-menu" id="context-menu-object" style="display:none;">
        <button class="context-item" data-action="info">Ver Información</button>
        <button class="context-item" data-action="ping">Probar Ping</button>
        <button class="context-item" data-action="link">Agregar Enlace</button>
        <button class="context-item" data-action="open-ip">Abrir Interfaz</button>
        <button class="context-item" data-action="edit">Editar</button>
        <button class="context-item" data-action="clone">Clonar</button>
        <button class="context-item context-item-danger" data-action="delete-object">Eliminar</button>
    </div>

    <!-- Context Menu — Line -->
    <div class="context-menu" id="context-menu-line" style="display:none;">
        <button class="context-item context-item-danger" data-action="delete-line">Eliminar Enlace</button>
    </div>

    <!-- Context Menu — Note -->
    <div class="context-menu" id="context-menu-note" style="display:none;">
        <button class="context-item" data-action="edit-note">Editar Nota</button>
        <button class="context-item context-item-danger" data-action="delete-note">Eliminar Nota</button>
    </div>

    <!-- Context Menu — Box -->
    <div class="context-menu" id="context-menu-box" style="display:none;">
        <button class="context-item" data-action="edit-box">Editar Caja</button>
        <button class="context-item context-item-danger" data-action="delete-box">Eliminar Caja</button>
    </div>

    <!-- Info Panel -->
    <div class="info-panel" id="info-panel" style="display:none;">
        <div class="info-panel-header">
            <h3>Información</h3>
            <button class="btn-icon" id="btn-info-close">&times;</button>
        </div>
        <div class="info-panel-body" id="info-panel-body"></div>
    </div>

    <!-- Modals Container -->
    <!-- Device Type Selector Modal -->
    <div class="modal-overlay" id="modal-select-device" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2>Seleccionar Dispositivo</h2>
                <button class="modal-close" onclick="UIModals.close('modal-select-device')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="form-select-device">
                    <div class="form-group">
                        <label for="device-type">Tipo de dispositivo</label>
                        <select id="device-type" class="form-input" required>
                            <option value="">— Seleccionar —</option>
                            <option value="antenna">Antena (Shift+1)</option>
                            <option value="router">Router (Shift+2)</option>
                            <option value="switch">Switch (Shift+3)</option>
                            <option value="modem">Modem (Shift+4)</option>
                            <option value="computer">Computadora (Shift+5)</option>
                        </select>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Device Form Modal (dynamically populated) -->
    <div class="modal-overlay" id="modal-device-form" style="display:none;">
        <div class="modal">
            <div class="modal-header">
                <h2 id="device-form-title">Crear Dispositivo</h2>
                <button class="modal-close" onclick="UIModals.close('modal-device-form')">&times;</button>
            </div>
            <div class="modal-body" id="device-form-body"></div>
        </div>
    </div>

    <!-- Edit Device Form Modal -->
    <div class="modal-overlay" id="modal-edit-device" style="display:none;">
        <div class="modal">
            <div class="modal-header">
                <h2>Editar Dispositivo</h2>
                <button class="modal-close" onclick="UIModals.close('modal-edit-device')">&times;</button>
            </div>
            <div class="modal-body" id="edit-device-body"></div>
        </div>
    </div>

    <!-- Ping Test Modal -->
    <div class="modal-overlay" id="modal-ping" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2>Test de Ping</h2>
                <button class="modal-close" onclick="UIModals.close('modal-ping')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="ping-target" id="ping-target-name"></div>
                <div id="ping-results"></div>
                <button class="btn btn-primary btn-full" id="btn-start-ping">Iniciar Ping</button>
            </div>
        </div>
    </div>

    <!-- Canvas Config Modal -->
    <div class="modal-overlay" id="modal-canvas-config" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2>Configurar Lienzo</h2>
                <button class="modal-close" onclick="UIModals.close('modal-canvas-config')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="canvas-width">Ancho (px)</label>
                        <input type="number" id="canvas-width" class="form-input" value="<?= $canvasWidth ?>" min="200" max="10000">
                    </div>
                    <div class="form-group">
                        <label for="canvas-height">Alto (px)</label>
                        <input type="number" id="canvas-height" class="form-input" value="<?= $canvasHeight ?>" min="200" max="10000">
                    </div>
                </div>
                <button class="btn btn-primary btn-full" id="btn-update-canvas">Actualizar</button>
            </div>
        </div>
    </div>

    <!-- Note Modal -->
    <div class="modal-overlay" id="modal-note" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2 id="note-modal-title">Agregar Nota</h2>
                <button class="modal-close" onclick="UIModals.close('modal-note')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="note-text">Texto</label>
                    <textarea id="note-text" class="form-input" rows="3" placeholder="Escribe tu nota..."></textarea>
                </div>
                <button class="btn btn-primary btn-full" id="btn-add-note">Agregar Nota</button>
            </div>
        </div>
    </div>

    <!-- Color Picker Modal (for boxes) -->
    <div class="modal-overlay" id="modal-color-picker" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2>Color de Caja</h2>
                <button class="modal-close" onclick="UIModals.close('modal-color-picker')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="box-color">Color</label>
                    <input type="color" id="box-color" class="form-input" value="#e2e8f0">
                </div>
                <div class="form-group">
                    <label for="box-border-color">Borde</label>
                    <input type="color" id="box-border-color" class="form-input" value="#94a3b8">
                </div>
                <button class="btn btn-primary btn-full" id="btn-confirm-box">Crear Caja</button>
            </div>
        </div>
    </div>

    <!-- Save Progress Modal -->
    <div class="modal-overlay" id="modal-save" style="display:none;">
        <div class="modal modal-sm">
            <div class="modal-body" style="text-align:center;">
                <div class="spinner"></div>
                <p id="save-status">Guardando diagrama...</p>
                <p class="text-muted" id="save-progress"></p>
            </div>
        </div>
    </div>

    <!-- Ping Serie Modal -->
    <div class="modal-overlay" id="modal-ping-serie" style="display:none;">
        <div class="modal modal-xl">
            <div class="modal-header">
                <h2>Ping en Serie</h2>
                <div class="ping-serie-header-actions">
                    <button class="btn-icon" id="btn-edit-ping-serie" title="Activar edición" aria-label="Activar edición">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon" id="btn-export-ping-serie" title="Exportar imagen" aria-label="Exportar imagen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button class="btn-icon" id="btn-toggle-ping-layout" title="Vista tabla" aria-label="Vista tabla">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 5h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3M4 17a2 2 0 0 0 2 2h5v-3H4zm7-5H4v3h7zm6 7a2 2 0 0 0 2-2v-1h-7v3zm2-7h-7v3h7zM4 11h7V8H4zm8 0h7V8h-7z"/></svg>
                    </button>
                    <button class="modal-close" onclick="PingSerie.close()">&times;</button>
                </div>
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

    <!-- Ping Trace Modal -->
    <div class="modal-overlay" id="modal-ping-trace" style="display:none;">
        <div class="modal modal-md trace-modal">
            <div class="modal-header">
                <h2>Trazado de Ping</h2>
                <button class="modal-close" onclick="PingTrace.cancel()">&times;</button>
            </div>
            <div class="modal-body trace-body">
                <div class="trace-form">
                    <div class="form-group">
                        <label>Dispositivo de Origen</label>
                        <input type="text" class="form-input" id="trace-source-input" list="trace-devices-list" placeholder="Buscar por nombre o IP..." autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Dispositivo de Destino</label>
                        <input type="text" class="form-input" id="trace-target-input" list="trace-devices-list" placeholder="Buscar por nombre o IP..." autocomplete="off">
                    </div>
                    <datalist id="trace-devices-list"></datalist>
                </div>
                <button class="btn btn-primary btn-full" id="btn-start-trace" disabled>Iniciar Trazado</button>
                <div class="trace-results" id="trace-results" style="display:none;"></div>
            </div>
        </div>
    </div>

    <!-- Toast / Notification -->
    <div class="toast-container" id="toast-container"></div>

    <!-- Loading overlay for box creation -->
    <div class="box-creation-overlay" id="box-creation-overlay" style="display:none;">
        <div class="crosshair" id="crosshair-1"></div>
        <div class="crosshair" id="crosshair-2" style="display:none;"></div>
    </div>
</div>

<script>window.BASE_PATH = '<?= BASE_PATH ?>';</script>
<script src="<?= BASE_PATH ?>/assets/js/libs/canvas2image.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/libs/html2canvas.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/api.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/state.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/dom-helpers.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/devices.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/forms.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/drag.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/links.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/boxes.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/ping.js"></script>
<script data-worker="ping" data-src="<?= BASE_PATH ?>/assets/js/workers/ping-worker.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/ping-serie.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/ping-trace.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/export.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/context-menu.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/modals.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/keyboard.js"></script>
<script src="<?= BASE_PATH ?>/assets/js/modules/editor.js"></script>
