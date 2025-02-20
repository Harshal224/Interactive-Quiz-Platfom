import React, { useState, useEffect, useCallback, useRef } from "react";
import "./quiz1.css";
import { QuizData } from "./QuizData";
import QuizResult from "./QuizResult";
import { openDB } from "idb";

// ✅ Initialize IndexedDB
const initDB = async () => {
  return openDB("QuizDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("quizHistory")) {
        db.createObjectStore("quizHistory", { keyPath: "id", autoIncrement: true });
      }
    },
  });
};

// ✅ Save score to database
const saveScore = async (score, totalScore) => {
  const db = await initDB();
  await db.add("quizHistory", { score, totalScore, date: new Date().toLocaleString() });
};

// ✅ Get past scores
const getPastScores = async () => {
  const db = await initDB();
  return await db.getAll("quizHistory");
};

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [clickedOption, setClickedOption] = useState(null);
  const [integerAnswer, setIntegerAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pastScores, setPastScores] = useState([]);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [scoreUpdated, setScoreUpdated] = useState(false);

  const timerRef = useRef(null); // 🔹 Use ref for interval

  // ✅ Fetch past scores on load
  useEffect(() => {
    getPastScores().then(setPastScores);
  }, []);

  // ✅ Check Answer Logic
  const checkAnswer = useCallback(() => {
    const correctAnswer = QuizData[currentQuestion].answer;
    return QuizData[currentQuestion].type === "integer"
      ? parseInt(integerAnswer, 10) === correctAnswer
      : clickedOption === correctAnswer;
  }, [currentQuestion, clickedOption, integerAnswer]);

  // ✅ Change Question & Prevent Continuous Updates
  const changeQuestion = useCallback(() => {
    if (!answerChecked || scoreUpdated) return;

    if (checkAnswer()) {
      setScore((prev) => prev + 1);
    }

    setScoreUpdated(true); // Prevents multiple updates

    setTimeout(() => {
      if (currentQuestion < QuizData.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setClickedOption(null);
        setIntegerAnswer("");
        setTimeLeft(30);
        setAnswerChecked(false);
        setScoreUpdated(false);
      } else {
        setShowResult(true);
        saveScore(score, QuizData.length);
      }
    }, 300);
  }, [answerChecked, checkAnswer, currentQuestion, scoreUpdated, score]);

  // ✅ Timer Functionality
  useEffect(() => {
    if (timeLeft === 0) {
      changeQuestion();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, changeQuestion]);

  // ✅ Reset Quiz
  const resetAll = () => {
    setShowResult(false);
    setCurrentQuestion(0);
    setClickedOption(null);
    setIntegerAnswer("");
    setScore(0);
    setTimeLeft(30);
    setAnswerChecked(false);
    setScoreUpdated(false);
    getPastScores().then(setPastScores);
  };

  // ✅ Delete Past Scores from IndexedDB
  const deleteScores = async () => {
    const db = await initDB();
    const tx = db.transaction("quizHistory", "readwrite");
    const store = tx.objectStore("quizHistory");
    await store.clear();
    setPastScores([]);
  };

  return (
    <div className="qbg">
      <div className="app">
        <h1>Java Quiz</h1>

        <div className="quiz">
          {showResult ? (
            <>
              <QuizResult score={score} totalScore={QuizData.length} tryAgain={resetAll} />

              <h3>📊 Past Quiz Attempts</h3>
              <ul className="past-scores">
                {pastScores.map((attempt, index) => (
                  <li key={index}>
                    {attempt.date} - Score: {attempt.score}/{attempt.totalScore}
                  </li>
                ))}
              </ul>

              <button className="btnq delete-btn" onClick={deleteScores}>
                🗑️ Clear Score History
              </button>
            </>
          ) : (
            <>
              <div className="timer">⏳ Time Left: {timeLeft}s</div>
              <h2>{currentQuestion + 1}. {QuizData[currentQuestion].question}</h2>

              <div id="answerbuttons">
                {QuizData[currentQuestion].type === "integer" ? (
                  <>
                    <input
                      type="number"
                      value={integerAnswer}
                      onChange={(e) => setIntegerAnswer(e.target.value)}
                      placeholder="Enter your answer"
                      disabled={answerChecked}
                      className="integer-input"
                    />
                    <button
                      className="btnq"
                      onClick={() => setAnswerChecked(true)}
                      disabled={integerAnswer.trim() === ""}
                    >
                      Submit Answer
                    </button>
                  </>
                ) : (
                  QuizData[currentQuestion].options.map((option, i) => (
                    <button
                      key={i}
                      className={`btnq ${
                        clickedOption !== null
                          ? i === QuizData[currentQuestion].answer
                            ? "correct"
                            : i === clickedOption
                            ? "wrong"
                            : ""
                          : ""
                      }`}
                      onClick={() => {
                        if (!answerChecked) {
                          setClickedOption(i);
                          setAnswerChecked(true);
                        }
                      }}
                      disabled={answerChecked}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>

              {answerChecked && (
                <p className="feedback">
                  {checkAnswer() ? "✅ Correct!" : "❌ Wrong Answer"}
                </p>
              )}

              <button id="next-btnq" onClick={changeQuestion} disabled={!answerChecked}>
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
