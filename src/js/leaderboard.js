/**
 * leaderboard.js
 * Übermittelt den Score ans PHP-Backend und rendert die Top-100-Bestenliste.
 */
const Leaderboard = (() => {
  const leaderboardBodyEl = document.getElementById("leaderboard-body");

  async function submitScore(name, score) {
    const response = await fetch("api/submit_score.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score }),
    });
    if (!response.ok) {
      throw new Error("Score konnte nicht gespeichert werden.");
    }
    return response.json();
  }

  async function fetchTop() {
    const response = await fetch("api/get_leaderboard.php");
    if (!response.ok) {
      throw new Error("Bestenliste konnte nicht geladen werden.");
    }
    return response.json();
  }

  async function render() {
    leaderboardBodyEl.innerHTML = "";
    try {
      const entries = await fetchTop();
      if (entries.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "Noch keine Einträge vorhanden.";
        row.appendChild(cell);
        leaderboardBodyEl.appendChild(row);
        return;
      }
      entries.forEach((entry, index) => {
        const row = document.createElement("tr");

        const rankCell = document.createElement("td");
        rankCell.textContent = String(index + 1);

        const nameCell = document.createElement("td");
        nameCell.textContent = entry.name;

        const scoreCell = document.createElement("td");
        scoreCell.textContent = entry.score;

        const dateCell = document.createElement("td");
        dateCell.textContent = entry.date;

        row.append(rankCell, nameCell, scoreCell, dateCell);
        leaderboardBodyEl.appendChild(row);
      });
    } catch (error) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = "Bestenliste konnte nicht geladen werden.";
      row.appendChild(cell);
      leaderboardBodyEl.appendChild(row);
    }
  }

  return { submitScore, render };
})();
