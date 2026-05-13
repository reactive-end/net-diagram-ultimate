<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="icon" type="image/svg+xml" href="<?= BASE_PATH ?>/assets/img/icons/favicon.svg">
    <title><?= htmlspecialchars($title ?? 'Net Diagram Ultimate') ?></title>
    <link rel="stylesheet" href="<?= BASE_PATH ?>/assets/css/main.css">
    <?= $headExtra ?? '' ?>
</head>
<body class="<?= $bodyClass ?? '' ?>">
    <?= $content ?>
    <?= $scripts ?? '' ?>

    <!-- Reusable confirmation modal for delete actions -->
    <div class="modal-overlay" id="modal-confirm-generic" style="display:none;">
        <div class="modal modal-sm confirm-modal">
            <div class="modal-header">
                <h2 id="confirm-modal-title">Confirm deletion</h2>
                <button class="modal-close" id="confirm-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p id="confirm-modal-message">This action cannot be undone.</p>
                <div class="modal-actions">
                    <button class="btn btn-outline" id="confirm-modal-cancel">Cancel</button>
                    <button class="btn btn-danger" id="confirm-modal-accept">Delete</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
