import { element, formatNumber } from "./dom.js";
import { toRoman } from "/shared/roman.js";

export function initializePractice() {
  let quiz = {
    questionIndex: 0,
    correctAnswers: 0,
    number: 1,
    toDecimal: false,
    answered: false,
    usedNumbers: new Set(),
  };
  function showQuestion() {
    const max = { easy: 100, medium: 1000, hard: 3999 }[
      element("difficulty").value
    ];
    do {
      quiz.number = 1 + Math.floor(Math.random() * max);
    } while (quiz.usedNumbers.has(quiz.number));
    quiz.usedNumbers.add(quiz.number);
    quiz.toDecimal = quiz.questionIndex % 2 === 1;
    quiz.answered = false;
    element("question-label").textContent =
      "ВОПРОС " +
      (quiz.questionIndex + 1) +
      " ИЗ 10 · " +
      (quiz.toDecimal ? "ЗАПИШИТЕ ДЕСЯТИЧНЫМ ЧИСЛОМ" : "ЗАПИШИТЕ РИМСКИМИ");
    element("question").textContent = quiz.toDecimal
      ? toRoman(quiz.number)
      : formatNumber(quiz.number);
    element("answer").value = "";
    element("answer").inputMode = quiz.toDecimal ? "numeric" : "text";
    element("answer").disabled = false;
    element("feedback").textContent = "";
    element("check").disabled = false;
    element("quiz-form").hidden = false;
    element("next").hidden = true;
    element("progress").value = quiz.questionIndex;
    element("score").textContent =
      "Верно: " + quiz.correctAnswers + " из " + quiz.questionIndex;
  }
  function resetQuiz() {
    quiz = {
      questionIndex: 0,
      correctAnswers: 0,
      number: 1,
      toDecimal: false,
      answered: false,
      usedNumbers: new Set(),
    };
    showQuestion();
  }
  element("quiz-form").onsubmit = (e) => {
    e.preventDefault();
    if (quiz.answered) return;
    const a = element("answer").value.trim();
    if (!a) {
      element("feedback").textContent = "Сначала введите ответ.";
      element("answer").focus();
      return;
    }
    const expected = quiz.toDecimal
      ? String(quiz.number)
      : toRoman(quiz.number);
    const ok = quiz.toDecimal
      ? /^\d+$/.test(a) && Number(a) === quiz.number
      : a.toUpperCase() === expected;
    quiz.correctAnswers += Number(ok);
    quiz.answered = true;
    element("feedback").textContent = ok
      ? "Верно! " + formatNumber(quiz.number) + " = " + toRoman(quiz.number)
      : "Правильный ответ: " +
        expected +
        ". " +
        formatNumber(quiz.number) +
        " = " +
        toRoman(quiz.number);
    element("answer").disabled = true;
    element("check").disabled = true;
    element("next").hidden = false;
    element("next").textContent =
      quiz.questionIndex === 9
        ? "Посмотреть результат →"
        : "Следующий вопрос →";
    element("score").textContent =
      "Верно: " + quiz.correctAnswers + " из " + (quiz.questionIndex + 1);
    element("progress").value = quiz.questionIndex + 1;
  };
  element("next").onclick = () => {
    quiz.questionIndex++;
    if (quiz.questionIndex >= 10) {
      element("question-label").textContent = "ТРЕНИРОВКА ЗАВЕРШЕНА";
      element("question").textContent = quiz.correctAnswers + " / 10";
      element("feedback").textContent =
        quiz.correctAnswers === 10
          ? "Отлично! Вы уверенно читаете римские числа."
          : quiz.correctAnswers >= 7
            ? "Хороший результат. Ещё немного практики — и всё получится."
            : "Загляните в правила и попробуйте ещё раз — здесь можно тренироваться без ограничений.";
      element("quiz-form").hidden = true;
      element("next").hidden = true;
    } else {
      showQuestion();
      element("answer").focus();
    }
  };
  element("restart").onclick = resetQuiz;
  element("difficulty").onchange = resetQuiz;

  resetQuiz();
}
