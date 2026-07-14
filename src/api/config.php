<?php
/**
 * config.php
 * Zentrale Konfiguration für das Leaderboard-Backend.
 */

// Pfad zur CSV-Datei, in der die Bestenliste gespeichert wird.
define('CSV_PATH', __DIR__ . '/data/leaderboard.csv');

// Maximale Anzahl an Einträgen, die in der Bestenliste behalten werden.
define('MAX_ENTRIES', 100);

// Maximale Länge des Spielernamens.
define('MAX_NAME_LENGTH', 20);

// Plausible Obergrenze für einen Score (Schutz vor manipulierten Werten).
// Richtwert: Anzahl Fragen * (Basis-Punkte + max. Zeitbonus).
define('MAX_SCORE', 100000);
