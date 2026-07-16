# Quiz-App für Projekt Woche

Eine kleine Quiz-Webanwendung mit Zeitbonus-Punktesystem und Bestenliste. Das Frontend ist reines HTML/CSS/JavaScript, das Backend besteht aus schlanken PHP-Skripten, die eine CSV-Datei als Speicher nutzen. Alles läuft in einem einzigen Docker-Container (PHP + Apache).

## Funktionsweise

### Ablauf (Frontend)

Die App ist eine Single-Page-Anwendung ([src/index.html](src/index.html)) mit vier "Views", zwischen denen [src/js/main.js](src/js/main.js) umschaltet:

1. **Start-Bildschirm** – Quiz starten oder Bestenliste ansehen.
2. **Quiz-Bildschirm** – gesteuert von [src/js/quiz.js](src/js/quiz.js):
   - Lädt die Fragen aus [src/data/questions.json](src/data/questions.json) (`fetch`).
   - Mischt die Reihenfolge der Fragen sowie – pro Frage – die Reihenfolge der Antwortoptionen (`shuffleOptions`), wobei der korrekte Index nachverfolgt wird.
   - Pro Frage läuft ein Timer (`timeLimit`, Standard 10 s), dargestellt als Fortschrittsbalken.
   - Punktevergabe bei richtiger Antwort: zwischen `MIN_POINTS` (200) und `MAX_POINTS` (1000), abhängig davon, wie viel Zeit noch übrig war (Zeitbonus).
   - Nach der letzten Frage wird `onFinish(score)` aufgerufen.
3. **Ergebnis-Bildschirm** – zeigt die erreichte Punktzahl und lässt den Spieler einen Namen eintragen, der per `Leaderboard.submitScore()` ([src/js/leaderboard.js](src/js/leaderboard.js)) an das Backend gesendet wird.
4. **Bestenliste** – lädt per `Leaderboard.render()` die Top-Einträge vom Backend und stellt sie als Tabelle dar.

### Backend (PHP-API, [src/api/](src/api))

- **[config.php](src/api/config.php)** – zentrale Konstanten: Pfad zur CSV, maximale Anzahl Einträge (100), maximale Namenslänge (20), Pfad zur Bannwort-Liste, maximal plausibler Score.
- **[submit_score.php](src/api/submit_score.php)** – nimmt `POST { name, score }` entgegen und validiert streng, bevor der Eintrag an die CSV angehängt wird:
  - Name wird auf gültiges UTF-8 geprüft (`mb_check_encoding`), Steuerzeichen werden entfernt, Länge begrenzt.
  - Name wird gegen [banned_words.txt](src/api/data/banned_words.txt) geprüft (inkl. einfacher Leetspeak-Normalisierung wie `0`→`o`, `4`→`a`).
  - Schutz vor CSV-Formel-Injection (Namen, die mit `= + - @` beginnen, werden escaped).
  - Score muss numerisch, nicht negativ und unterhalb `MAX_SCORE` sein.
  - Die CSV-Datei wird gesperrt (`flock`), die neue Zeile angehängt, nach Punktzahl sortiert und auf `MAX_ENTRIES` gekürzt.
- **[get_leaderboard.php](src/api/get_leaderboard.php)** – liest die CSV (mit Shared Lock), sortiert absteigend nach Score und gibt die Top-Einträge als JSON zurück.
- **[data/leaderboard.csv](src/api/data/leaderboard.csv)** – persistenter Speicher (Name, Score, Datum). Wird zur Laufzeit beschrieben.
- **[data/banned_words.txt](src/api/data/banned_words.txt)** – eine verbotene Zeichenkette pro Zeile (Groß-/Kleinschreibung wird ignoriert), wird als Teilstring-Filter gegen den eingegebenen Namen verwendet.

### Fragen-Format ([src/data/questions.json](src/data/questions.json))

```json
{
  "question": "Fragetext",
  "image": "image/beispiel.webp",
  "options": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
  "correctIndex": 2,
  "timeLimit": 10
}
```

`image` ist optional. `correctIndex` bezieht sich auf die Position in `options` **vor** dem Mischen im Frontend.

## Projektstruktur

```
docker-compose.yml     # Docker-Compose-Setup (Port, Volume)
Dockerfile              # PHP 8.2 + Apache, kopiert src/ als Document Root
src/
  index.html             # Einstiegspunkt / Markup aller Views
  css/style.css          # Styling
  data/questions.json    # Fragenkatalog
  image/                 # Bilder für Fragen & Hintergrund
  js/
    quiz.js               # Quiz-Ablauf, Timer, Punkteberechnung
    leaderboard.js        # Kommunikation mit dem Backend, Bestenliste rendern
    main.js               # View-Steuerung, verbindet Quiz & Leaderboard
  api/
    config.php            # Konfigurationskonstanten
    submit_score.php      # POST-Endpunkt zum Speichern eines Scores
    get_leaderboard.php   # GET-Endpunkt für die Top-Einträge
    data/
      leaderboard.csv     # persistente Bestenliste (zur Laufzeit beschrieben)
      banned_words.txt    # Namensfilter-Liste
```

## Selbst hosten

### Voraussetzungen

- Docker und Docker Compose (Plugin) installiert.

### Starten

```bash
git clone <repo-url>
cd HTML-Website-Quiz
sudo docker compose up -d --build
```

Die App ist danach unter `http://localhost:8080` bzw. im lokalen Netzwerk unter `http://<server-ip>:8080` erreichbar (siehe [docker-compose.yml](docker-compose.yml), Port-Mapping `0.0.0.0:8080:80`).

### Was dabei passiert

- Das [Dockerfile](Dockerfile) baut auf `php:8.2-apache` auf, kopiert `src/` als Apache-Document-Root und sorgt dafür, dass `src/api/data/` für den Webserver-Benutzer (`www-data`) beschreibbar ist (nötig, damit `submit_score.php` die CSV aktualisieren kann).
- [docker-compose.yml](docker-compose.yml) bindet zusätzlich `./src/api/data` als Volume in den Container, damit die Bestenliste und die Bannwort-Liste auch außerhalb des Containers persistent bleiben und ohne Neu-Build bearbeitet werden können.

### Änderungen übernehmen

Da `src/` beim Build ins Image kopiert wird (kein Live-Mount für Code), muss nach Codeänderungen (JS/CSS/HTML/PHP) neu gebaut werden:

```bash
sudo docker compose up -d --build
```

Änderungen an `src/api/data/banned_words.txt` oder `leaderboard.csv` wirken dagegen sofort, da dieser Ordner als Volume eingebunden ist.

### Container stoppen

```bash
sudo docker compose down
```

### Fragen anpassen

Fragenkatalog in [src/data/questions.json](src/data/questions.json) bearbeiten und passende Bilder in `src/image/` ablegen (Dateiname muss exakt mit dem `image`-Feld übereinstimmen). Danach neu bauen (siehe oben).
