(function () {
  const STORAGE_KEY = "foxfarm_verified";
  const REDIRECT_URL = "index.html";

  const continueBtn = document.getElementById("verification-continue");
  const quizEl = document.getElementById("fox-quiz");
  const quizQuestionEl = document.getElementById("fox-quiz-question");
  const quizOptionsEl = document.getElementById("fox-quiz-options");
  const quizFeedbackEl = document.getElementById("fox-quiz-feedback");
  const quizRefreshBtn = document.getElementById("fox-quiz-refresh");

  if (!continueBtn || !quizEl || !quizQuestionEl || !quizOptionsEl || !quizFeedbackEl) {
    return;
  }
  let quizSolved = false;
  let currentQuestion = null;

  const quizQuestions = [
    {
      id: "q1",
      question: "La couleur la plus connue du renard est :",
      options: ["Roux", "Bleu", "Violet"],
      answer: "Roux",
    },
    {
      id: "q2",
      question: "Le renard se deplace sur :",
      options: ["Quatre pattes", "Deux pattes", "Aucune patte"],
      answer: "Quatre pattes",
    },
    {
      id: "q3",
      question: "Le renard est un :",
      options: ["Mammifere", "Reptile", "Poisson"],
      answer: "Mammifere",
    },
    {
      id: "q4",
      question: "Le petit du renard s'appelle :",
      options: ["Renardeau", "Renardon", "Renardet"],
      answer: "Renardeau",
    },
    {
      id: "q5",
      question: "Le renard a souvent une queue :",
      options: ["Touffue", "Ecailleuse", "Transparente"],
      answer: "Touffue",
    },
    {
      id: "q6",
      question: "Le renard est connu pour etre :",
      options: ["Malin", "Aveugle", "Aquatique"],
      answer: "Malin",
    },
  ];

  function redirectToReturn() {
    const returnUrl = new URLSearchParams(window.location.search).get("return") || REDIRECT_URL;
    window.location.href = returnUrl;
  }

  function updateButtonState() {
    continueBtn.disabled = !quizSolved;
    continueBtn.classList.toggle("is-ready", quizSolved);
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function setQuizFeedback(message, status) {
    quizFeedbackEl.textContent = message || "";
    quizEl.classList.remove("is-correct", "is-wrong");
    if (status === "correct") quizEl.classList.add("is-correct");
    if (status === "wrong") quizEl.classList.add("is-wrong");
  }

  function renderQuizQuestion() {
    currentQuestion = shuffle(quizQuestions)[0];
    quizSolved = false;
    quizQuestionEl.textContent = currentQuestion.question;
    quizOptionsEl.innerHTML = "";
    setQuizFeedback("", null);

    shuffle(currentQuestion.options).forEach((optionText) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fox-quiz-option";
      btn.textContent = optionText;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");

      btn.addEventListener("click", function () {
        const allOptions = Array.from(quizOptionsEl.querySelectorAll(".fox-quiz-option"));
        allOptions.forEach((el) => {
          el.classList.remove("selected", "good", "bad");
          el.setAttribute("aria-checked", "false");
        });

        btn.classList.add("selected");
        btn.setAttribute("aria-checked", "true");

        if (optionText === currentQuestion.answer) {
          quizSolved = true;
          btn.classList.add("good");
          setQuizFeedback("Bonne reponse, bien joue.", "correct");
        } else {
          quizSolved = false;
          btn.classList.add("bad");
          const goodBtn = allOptions.find((el) => el.textContent === currentQuestion.answer);
          goodBtn?.classList.add("good");
          setQuizFeedback("Ce n'est pas la bonne reponse. Essaie encore.", "wrong");
        }
        updateButtonState();
      });

      quizOptionsEl.appendChild(btn);
    });

    updateButtonState();
  }

  continueBtn.addEventListener("click", function () {
    if (!quizSolved) return;
    sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    redirectToReturn();
  });

  quizRefreshBtn?.addEventListener("click", function () {
    renderQuizQuestion();
  });

  renderQuizQuestion();
  updateButtonState();
})();
