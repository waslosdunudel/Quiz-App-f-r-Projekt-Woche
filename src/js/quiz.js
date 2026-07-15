/**
 * quiz.js
 * Lädt die Fragen, steuert den Quiz-Ablauf (Frage anzeigen, Timer, Auswertung)
 * und berechnet die Punkte (Basis-Punkte + Zeitbonus).
 */
const Quiz = (() => {
  const MAX_POINTS = 1000;
  const MIN_POINTS = 200;
  const NEXT_QUESTION_DELAY_MS = 1200;
  const TICK_MS = 100;

  const questionTextEl = document.getElementById("question-text");
  const questionImageEl = document.getElementById("question-image");
  const answersListEl = document.getElementById("answers-list");
  const questionCounterEl = document.getElementById("question-counter");
  const scoreDisplayEl = document.getElementById("score-display");
  const timerBarEl = document.getElementById("timer-bar");
  const timerSecondsEl = document.getElementById("timer-seconds");

  let questions = [];
  let currentIndex = 0;
  let currentCorrectIndex = 0;
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

  function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function shuffleOptions(question) {
    const indexed = question.options.map((text, index) => ({ text, index }));
    const shuffled = shuffle(indexed);
    return {
      options: shuffled.map((o) => o.text),
      correctIndex: shuffled.findIndex((o) => o.index === question.correctIndex),
    };
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
    const { options, correctIndex } = shuffleOptions(question);
    currentCorrectIndex = correctIndex;

    questionCounterEl.textContent = `Frage ${currentIndex + 1}/${questions.length}`;
    questionTextEl.textContent = question.question;

    if (question.image) {
      questionImageEl.src = question.image;
      questionImageEl.alt = question.question;
      questionImageEl.hidden = false;
    } else {
      questionImageEl.hidden = true;
      questionImageEl.src = "";
    }

    answersListEl.innerHTML = "";

    options.forEach((optionText, index) => {
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

    const isCorrect = selectedIndex === currentCorrectIndex;
    if (selectedIndex !== null) {
      buttons[selectedIndex].classList.add(isCorrect ? "correct" : "incorrect");
    }
    if (!isCorrect) {
      buttons[currentCorrectIndex].classList.add("correct");
    }

    if (isCorrect) {
      const limit = question.timeLimit || 10;
      const timeRatio = Math.max(0, Math.min(1, timeLeft / limit));
      const points = Math.round(MIN_POINTS + timeRatio * (MAX_POINTS - MIN_POINTS));
      score += points;
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
    questions = shuffle(questions);
    showQuestion();
  }

  function init(options = {}) {
    onFinishCallback = options.onFinish || null;
  }

  return { init, start };
})();
