<?php
/**
 * submit_score.php
 * Nimmt einen Score per POST entgegen, validiert ihn und hängt ihn an die
 * Leaderboard-CSV an. Danach wird die Liste sortiert und auf Top-N gekürzt.
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST-Anfragen erlaubt.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || !isset($input['name'], $input['score'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige Anfrage.']);
    exit;
}

// --- Namen validieren/bereinigen ---
$name = (string) $input['name'];
$name = trim($name);
// Steuerzeichen und Zeilenumbrüche entfernen (verhindert CSV/Header-Injection).
$name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? '';
$name = mb_substr($name, 0, MAX_NAME_LENGTH);

if ($name === '') {
    $name = 'Anonym';
}

// Schutz vor CSV-Formel-Injection (z. B. wenn die Datei in Excel geöffnet wird).
if (preg_match('/^[=+\-@]/', $name)) {
    $name = "'" . $name;
}

// --- Score validieren ---
if (!is_numeric($input['score'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Score muss eine Zahl sein.']);
    exit;
}

$score = (int) round((float) $input['score']);

if ($score < 0 || $score > MAX_SCORE) {
    http_response_code(400);
    echo json_encode(['error' => 'Score außerhalb des gültigen Bereichs.']);
    exit;
}

$date = date('Y-m-d H:i:s');

// --- Datei sperren, lesen, neue Zeile hinzufügen, sortieren, kürzen ---
$directory = dirname(CSV_PATH);
if (!is_dir($directory)) {
    mkdir($directory, 0755, true);
}

$handle = fopen(CSV_PATH, 'c+');
if ($handle === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Bestenliste konnte nicht geöffnet werden.']);
    exit;
}

if (!flock($handle, LOCK_EX)) {
    fclose($handle);
    http_response_code(500);
    echo json_encode(['error' => 'Bestenliste ist derzeit gesperrt.']);
    exit;
}

$entries = [];
rewind($handle);
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

$entries[] = ['name' => $name, 'score' => $score, 'date' => $date];

usort($entries, static fn($a, $b) => $b['score'] <=> $a['score']);
$entries = array_slice($entries, 0, MAX_ENTRIES);

ftruncate($handle, 0);
rewind($handle);
fputcsv($handle, ['name', 'score', 'date']);
foreach ($entries as $entry) {
    fputcsv($handle, [$entry['name'], $entry['score'], $entry['date']]);
}

fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

echo json_encode(['success' => true, 'name' => $name, 'score' => $score]);
