/**
 * quiz.js
 * Lädt die Fragen, steuert den Quiz-Ablauf (Frage anzeigen, Timer, Auswertung)
 * und berechnet die Punkte (Basis-Punkte + Zeitbonus).
 */
const Quiz = (() => {
  const BASE_POINTS = 100;
  const MAX_TIME_BONUS = 50;
  const NEXT_QUESTION_DELAY_MS = 1200;
  const TICK_MS = 100;

  const questionTextEl = document.getElementById("question-text");
  const answersListEl = document.getElementById("answers-list");
  const questionCounterEl = document.getElementById("question-counter");
  const scoreDisplayEl = document.getElementById("score-display");
  const timerBarEl = document.getElementById("timer-bar");
  const timerSecondsEl = document.getElementById("timer-seconds");

  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let timeLeft = 0;
  let timerInterval = null;
  let onFinishCallback = null;

  async function loadQuestions() {
    const response = await fetch("data/questions.json");
    if (!response.ok) {
      throw new Error("Fragen konnten nicht geladen werden.");
    }
    return response.json();
  }

  function updateScoreUI() {
    scoreDisplayEl.textContent = `Punkte: ${score}`;
  }

  function updateTimerUI(remaining, limit) {
    const percent = Math.max(0, (remaining / limit) * 100);
    timerBarEl.style.width = `${percent}%`;
    timerBarEl.style.backgroundColor = percent < 30 ? "#e34d4d" : "#2f5bff";
    timerSecondsEl.textContent = `${Math.ceil(remaining)}s`;
  }

  function startTimer(limit) {
    clearInterval(timerInterval);
    timeLeft = limit;
    updateTimerUI(timeLeft, limit);

    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - TICK_MS / 1000);
      updateTimerUI(timeLeft, limit);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleAnswer(null);
      }
    }, TICK_MS);
  }

  function showQuestion() {
    const question = questions[currentIndex];
    questionCounterEl.textContent = `Frage ${currentIndex + 1}/${questions.length}`;
    questionTextEl.textContent = question.question;
    answersListEl.innerHTML = "";

    question.options.forEach((optionText, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-btn";
      button.textContent = optionText;
      button.addEventListener("click", () => handleAnswer(index));
      answersListEl.appendChild(button);
    });

    startTimer(question.timeLimit || 10);
  }

  function handleAnswer(selectedIndex) {
    clearInterval(timerInterval);
    const question = questions[currentIndex];
    const buttons = Array.from(answersListEl.querySelectorAll(".answer-btn"));
    buttons.forEach((button) => (button.disabled = true));

    const isCorrect = selectedIndex === question.correctIndex;
    if (selectedIndex !== null) {
      buttons[selectedIndex].classList.add(isCorrect ? "correct" : "incorrect");
    }
    if (!isCorrect) {
      buttons[question.correctIndex].classList.add("correct");
    }

    if (isCorrect) {
      const timeBonus = Math.round((timeLeft / (question.timeLimit || 10)) * MAX_TIME_BONUS);
      score += BASE_POINTS + timeBonus;
      updateScoreUI();
    }

    setTimeout(() => {
      currentIndex += 1;
      if (currentIndex < questions.length) {
        showQuestion();
      } else {
        finish();
      }
    }, NEXT_QUESTION_DELAY_MS);
  }

  function finish() {
    if (typeof onFinishCallback === "function") {
      onFinishCallback(score);
    }
  }

  async function start() {
    currentIndex = 0;
    score = 0;
    updateScoreUI();
    if (questions.length === 0) {
      questions = await loadQuestions();
    }
    showQuestion();
  }

  function init(options = {}) {
    onFinishCallback = options.onFinish || null;
  }

  return { init, start };
})();
