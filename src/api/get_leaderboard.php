<?php
/**
 * get_leaderboard.php
 * Liest die Leaderboard-CSV und gibt die Top-N-Einträge sortiert als JSON zurück.
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur GET-Anfragen erlaubt.']);
    exit;
}

if (!file_exists(CSV_PATH)) {
    // Noch keine Bestenliste vorhanden: leere CSV mit Header anlegen.
    $directory = dirname(CSV_PATH);
    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }
    $handle = fopen(CSV_PATH, 'c+');
    if ($handle !== false) {
        flock($handle, LOCK_EX);
        fputcsv($handle, ['name', 'score', 'date']);
        flock($handle, LOCK_UN);
        fclose($handle);
    }
    echo json_encode([]);
    exit;
}

$handle = fopen(CSV_PATH, 'r');
if ($handle === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Bestenliste konnte nicht gelesen werden.']);
    exit;
}

flock($handle, LOCK_SH);

$entries = [];
$isFirstRow = true;
while (($row = fgetcsv($handle)) !== false) {
    if ($isFirstRow) {
        $isFirstRow = false;
        continue; // Header überspringen
    }
    if (count($row) < 3) {
        continue;
    }
    $entries[] = [
        'name' => $row[0],
        'score' => (int) $row[1],
        'date' => $row[2],
    ];
}

flock($handle, LOCK_UN);
fclose($handle);

usort($entries, static fn($a, $b) => $b['score'] <=> $a['score']);
$entries = array_slice($entries, 0, MAX_ENTRIES);

echo json_encode($entries);
