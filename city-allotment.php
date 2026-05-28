<?php
session_start();

// ---------- DB CONFIG ----------
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_NAME = getenv('DB_NAME') ?: 'vegapilot';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';

$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) {
    http_response_code(500);
    exit('Database connection failed.');
}
$mysqli->set_charset('utf8mb4');

// ---------- AUTH: resolve logged-in candidate's mobile ----------
// Expecting the auth layer to put the candidate id or mobile into the session.
$candidateMobile = null;

if (!empty($_SESSION['registeredMobile'])) {
    $candidateMobile = $_SESSION['registeredMobile'];
} elseif (!empty($_SESSION['candidate_id'])) {
    $stmt = $mysqli->prepare('SELECT registeredMobile FROM registered_candidates WHERE id = ? LIMIT 1');
    $cid = (int)$_SESSION['candidate_id'];
    $stmt->bind_param('i', $cid);
    $stmt->execute();
    $stmt->bind_result($mobileResult);
    if ($stmt->fetch()) {
        $candidateMobile = $mobileResult ?: null;
    }
    $stmt->close();
}

if (!$candidateMobile) {
    http_response_code(401);
    exit('Please log in to view your city allotment.');
}

// ---------- FETCH ADMIT CARD FOR THIS USER ----------
$stmt = $mysqli->prepare(
    'SELECT id, candidate_name, candidate_location, number_mobile, number_whatsapp,
            test_center, test_city, applicant_name
       FROM admit_card_data
      WHERE status = 1
        AND (number_mobile = ? OR number_whatsapp = ?)
      LIMIT 1'
);
$stmt->bind_param('ss', $candidateMobile, $candidateMobile);
$stmt->execute();
$admit = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$admit) {
    ?><!doctype html>
    <html><head><meta charset="utf-8"><title>City Allotment</title></head>
    <body>
        <h1>City Allotment</h1>
        <p>No admit card record was found for your registered mobile number (<?= htmlspecialchars($candidateMobile) ?>).</p>
    </body></html>
    <?php
    exit;
}

// ---------- FETCH PEERS ----------
// Peers in the same Test City (excluding self)
$peersCityStmt = $mysqli->prepare(
    'SELECT candidate_name, number_whatsapp
       FROM admit_card_data
      WHERE test_city = ?
        AND status = 1
        AND id <> ?
      ORDER BY candidate_name ASC'
);
$selfId = (int)$admit['id'];
$peersCityStmt->bind_param('si', $admit['test_city'], $selfId);
$peersCityStmt->execute();
$peersCity = $peersCityStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$peersCityStmt->close();

// Peers in the same Test Center (excluding self)
$peersCenterStmt = $mysqli->prepare(
    'SELECT candidate_name, number_whatsapp
       FROM admit_card_data
      WHERE test_center = ?
        AND status = 1
        AND id <> ?
      ORDER BY candidate_name ASC'
);
$peersCenterStmt->bind_param('si', $admit['test_center'], $selfId);
$peersCenterStmt->execute();
$peersCenter = $peersCenterStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$peersCenterStmt->close();

function h($v) { return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>City Allotment</title>
    <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px; color: #1f2937; background: #f9fafb; }
        h1 { margin-top: 0; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 180px 1fr; row-gap: 8px; column-gap: 16px; }
        .grid .label { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
        th { background: #f3f4f6; font-weight: 600; }
        h2 { margin: 0 0 12px; font-size: 1.1rem; }
        h3 { margin: 20px 0 8px; }
        .muted { color: #6b7280; font-style: italic; }
    </style>
</head>
<body>

<h1>City Allotment</h1>

<section class="card">
    <h2>Your Details</h2>
    <div class="grid">
        <div class="label">Name</div>            <div><?= h($admit['candidate_name']) ?></div>
        <div class="label">Mobile Number</div>   <div><?= h($admit['number_mobile']) ?></div>
        <div class="label">WhatsApp Number</div> <div><?= h($admit['number_whatsapp']) ?></div>
        <div class="label">Place</div>           <div><?= h($admit['candidate_location']) ?></div>
        <div class="label">Applicant Name</div>  <div><?= h($admit['applicant_name']) ?></div>
        <div class="label">Test City</div>       <div><?= h($admit['test_city']) ?></div>
        <div class="label">Test Center</div>     <div><?= h($admit['test_center']) ?></div>
    </div>
</section>

<section class="card">
    <h2>Peers</h2>

    <h3>From Test City &mdash; <?= h($admit['test_city']) ?></h3>
    <?php if (empty($peersCity)): ?>
        <p class="muted">No other candidates found in this test city.</p>
    <?php else: ?>
        <table>
            <thead><tr><th>Name</th><th>Contact (WhatsApp)</th></tr></thead>
            <tbody>
            <?php foreach ($peersCity as $p): ?>
                <tr>
                    <td><?= h($p['candidate_name']) ?></td>
                    <td><?= h($p['number_whatsapp']) ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>

    <h3>From Test Center &mdash; <?= h($admit['test_center']) ?></h3>
    <?php if (empty($peersCenter)): ?>
        <p class="muted">No other candidates found in this test center.</p>
    <?php else: ?>
        <table>
            <thead><tr><th>Name</th><th>Contact (WhatsApp)</th></tr></thead>
            <tbody>
            <?php foreach ($peersCenter as $p): ?>
                <tr>
                    <td><?= h($p['candidate_name']) ?></td>
                    <td><?= h($p['number_whatsapp']) ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</section>

</body>
</html>
