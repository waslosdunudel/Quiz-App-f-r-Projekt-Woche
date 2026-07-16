# Release Notes

## v1.0.0 – 2026-07-16

Erste Veröffentlichung der Quiz-App für die Projektwoche.

### Features

- **Quiz-Ablauf**: Fragen werden aus [src/data/questions.json](src/data/questions.json) geladen, Fragen- und Antwortreihenfolge werden zufällig gemischt.
- **Zeitbonus-Punktesystem**: Pro Frage läuft ein Countdown-Timer (Standard 10 s); je schneller geantwortet wird, desto mehr Punkte (200–1000) gibt es.
- **Bestenliste**: Ergebnisse können nach dem Quiz mit Namen gespeichert werden; Top-100-Bestenliste wird tabellarisch angezeigt.
- **PHP-Backend** (CSV-basiert, kein Datenbankserver nötig):
  - Strenge Validierung von Name und Score in [submit_score.php](src/api/submit_score.php).
  - Namensfilter gegen verbotene Wörter (inkl. einfacher Leetspeak-Normalisierung), Liste in [banned_words.txt](src/api/data/banned_words.txt).
  - Schutz vor CSV-Formel-Injection und Steuerzeichen im Namen.
  - Datei-Sperren (`flock`) beim Schreiben/Lesen der Bestenliste, Sortierung nach Score, Begrenzung auf `MAX_ENTRIES`.
- **Docker-Setup**: Ein Container (PHP 8.2 + Apache) über [Dockerfile](Dockerfile) und [docker-compose.yml](docker-compose.yml); `src/api/data` als Volume für persistente Bestenliste ohne Neu-Build.
- **Fragenkatalog**: Erste Fragensammlung rund um den Schulstandort CSBME inkl. passender Bilder.
- **Mobile-Optimierung**: Hintergrundbild für Handy-Ansicht angepasst, zusätzliche Bild-Assets (webp/avif) für bessere Ladezeiten.

### Fixes

- README-Klonanleitung korrigiert (`cd`-Zielordner entsprach nicht dem tatsächlichen Repository-Namen).
- Bestenliste (`leaderboard.csv`) aus dem Git-Tracking entfernt und in `.gitignore` aufgenommen, da sie zur Laufzeit beschrieben wird.

### Bekannte Einschränkungen

- Änderungen an HTML/CSS/JS/PHP erfordern einen Docker-Rebuild (`docker compose up -d --build`), da `src/` nicht live gemountet ist.
