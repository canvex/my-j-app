// src/hooks/usePracticeEngine.ts

import { useState, useRef, useEffect, useCallback } from "react";
import { TextInput } from "react-native";
import { CategoryKey, Question } from "../types/typing";
import { shuffleArray } from "../utils/shuffle";
import { triggerHaptic } from "../utils/haptics";
import { speaksentence } from "../utils/speak";
import { useQuestionContext } from "../context/QuestionContext";

export function usePracticeEngine(initialCategory: CategoryKey = "daily") {
  const { categories, questionsBank } = useQuestionContext();
  const [category, setCategory] = useState<CategoryKey>(initialCategory);

  // 當當前選擇的分類被刪除時，自動防護切換到第一個現有分類
  useEffect(() => {
    if (categories.length > 0) {
      const exists = categories.some((c) => c.id === category);
      if (!exists) {
        const fallbackCategory = categories[0].id;
        setCategory(fallbackCategory);
      }
    }
  }, [categories, category]);

  // 題目列表改由 questionsBank 中讀取
  const [questions, setQuestions] = useState<Question[]>(() =>
    shuffleArray(questionsBank[initialCategory] || []),
  );

  // 當分類改變或題庫有匯入更新時，自動重新載入題目
  useEffect(() => {
    setQuestions(shuffleArray(questionsBank[category] || []));
  }, [category, questionsBank]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [input, setInput] = useState<string>("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [charCount, setCharCount] = useState<number>(0);

  const inputRef = useRef<TextInput | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  // 🌟【關鍵修復】: 當題號 (currentIndex) 或 狀態 (isFinished) 改變時，自動鎖定輸入框並喚醒鍵盤
  useEffect(() => {
    if (!isFinished) {
      // 使用 requestAnimationFrame 或 100ms 延遲，確保畫面已渲染完畢再 focus
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFinished]);

  const startNewSession = useCallback(
    (selectedCategory: CategoryKey = category) => {
      triggerHaptic("light");
      stopTimer();

      const bankData =
        questionsBank[selectedCategory] ||
        questionsBank[categories[0]?.id] ||
        [];
      const newQuestions = shuffleArray(bankData);

      setCategory(selectedCategory);
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setInput("");
      setStartTime(null);
      setElapsedTime(0);
      setIsFinished(false);
      setCharCount(0);
    },
    [category, questionsBank, categories],
  );

  const currentQ = questions[currentIndex] || {
    target: "",
    kana: "",
    meaning: "",
  };

  const handleInputChange = (text: string) => {
    setInput(text);

    if (!startTime && text.length > 0) {
      const now = Date.now();
      setStartTime(now);
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - now) / 1000));
      }, 100);
    }

    const currentKana = currentQ.kana;

    if (text === currentKana) {
      triggerHaptic("success");
      speaksentence(text);
      const newCharCount = charCount + currentKana.length;
      setCharCount(newCharCount);
      stopTimer();
    }
  };

  const cpm = elapsedTime > 0 ? Math.round((charCount / elapsedTime) * 60) : 0;
  const progressPercent =
    questions.length > 0
      ? Math.round((currentIndex / questions.length) * 100)
      : 0;

  let firstMismatchIndex = 0;
  while (
    firstMismatchIndex < input.length &&
    firstMismatchIndex < currentQ.kana.length &&
    input[firstMismatchIndex] === currentQ.kana[firstMismatchIndex]
  ) {
    firstMismatchIndex++;
  }

  const hasError = input.length > firstMismatchIndex;
  const nextChar = currentQ.kana[firstMismatchIndex] || "";

  // 簡化後的切換上一題 / 下一題 (無需手動呼叫 focus，交給 useEffect 處理)
  const goToNextQuestion = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      // 還有下一題：正常切換
      setCurrentIndex((prev) => prev + 1);
      setElapsedTime(0);
      setInput("");
      inputRef.current?.clear();
    } else {
      // 已經是最後一題：完成練習，停止計時並進入結算畫面
      stopTimer();
      setIsFinished(true);
    }
  }, [currentIndex, questions.length]);

  const goToPrevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setElapsedTime(0);
      setInput("");
      inputRef.current?.clear();
    }
  }, [currentIndex]);

  return {
    category,
    questions,
    currentIndex,
    currentQ,
    input,
    inputRef,
    elapsedTime,
    isFinished,
    charCount,
    cpm,
    progressPercent,
    firstMismatchIndex,
    hasError,
    nextChar,
    startNewSession,
    handleInputChange,
    goToNextQuestion,
    goToPrevQuestion,
  };
}
