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
</body>
</html>
