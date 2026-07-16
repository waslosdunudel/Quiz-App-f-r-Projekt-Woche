/**
 * main.js
 * Steuert die View-Wechsel (Start -> Quiz -> Ergebnis -> Bestenliste) und
 * verbindet Quiz-Logik und Leaderboard-Modul mit den UI-Elementen.
 */
(() => {
  const views = document.querySelectorAll(".view");
  const startBtn = document.getElementById("start-btn");
  const showLeaderboardBtn = document.getElementById("show-leaderboard-btn");
  const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");
  const backFromLeaderboardBtn = document.getElementById("back-from-leaderboard-btn");
  const playAgainBtn = document.getElementById("play-again-btn");
  const nameForm = document.getElementById("name-form");
  const playerNameInput = document.getElementById("player-name");
  const finalScoreEl = document.getElementById("final-score");
  const submitStatusEl = document.getElementById("submit-status");

  // Auf GitHub Pages steht kein PHP-Backend zur Verfügung, daher wird die
  // Bestenliste dort ausgeblendet (die Docker-Version bleibt unverändert).
  const LEADERBOARD_ENABLED = !/\.github\.io$/.test(location.hostname);

  let currentScore = 0;
  let previousViewId = "start-view";

  function switchView(viewId) {
    views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  }

  function showLeaderboard(fromViewId) {
    previousViewId = fromViewId;
    switchView("leaderboard-view");
    Leaderboard.render();
  }

  startBtn.addEventListener("click", () => {
    switchView("quiz-view");
    Quiz.start();
  });

  showLeaderboardBtn.addEventListener("click", () => showLeaderboard("start-view"));
  viewLeaderboardBtn.addEventListener("click", () => showLeaderboard("result-view"));

  backFromLeaderboardBtn.addEventListener("click", () => {
    switchView(previousViewId);
  });

  playAgainBtn.addEventListener("click", () => {
    submitStatusEl.textContent = "";
    nameForm.reset();
    nameForm.querySelector("button").disabled = false;
    playerNameInput.disabled = false;
    switchView("start-view");
  });

  nameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = playerNameInput.value.trim();
    if (!name) {
      return;
    }
    const submitButton = nameForm.querySelector("button");
    submitButton.disabled = true;
    playerNameInput.disabled = true;
    submitStatusEl.textContent = "Wird gespeichert...";
    try {
      await Leaderboard.submitScore(name, currentScore);
      submitStatusEl.textContent = "In der Bestenliste gespeichert!";
    } catch (error) {
      submitStatusEl.textContent = "Fehler beim Speichern. Bitte später erneut versuchen.";
      submitButton.disabled = false;
      playerNameInput.disabled = false;
    }
  });

  Quiz.init({
    onFinish: (score) => {
      currentScore = score;
      finalScoreEl.textContent = `${score} Punkte`;
      switchView("result-view");
    },
  });

  if (!LEADERBOARD_ENABLED) {
    showLeaderboardBtn.hidden = true;
    viewLeaderboardBtn.hidden = true;
    nameForm.hidden = true;
  }
})();
