// src/hooks/usePracticeEngine.ts

import { useState, useRef, useEffect, useCallback } from "react";
import { TextInput } from "react-native";
import { CategoryKey, Question } from "../types/typing";
import { shuffleArray } from "../utils/shuffle";
import { triggerHaptic } from "../utils/haptics";
import { speaksentence } from "../utils/speak";
import { useQuestionContext } from "../context/QuestionContext";

export function usePracticeEngine(initialCategory: CategoryKey = "daily") {
  const { categories, questionsBank } = useQuestionContext(); // 👈 取得 categories 與最新的 questionsBank
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

  // ⭐️ 新增：啟動 / 繼續計時器 (Continue Timer)
  const startTimer = () => {
    // 如果計時器已經在跑，就不重複啟動
    if (timerRef.current) return;

    // 紀錄這次啟動的時間點，扣除已耗費的時間 (elapsedTime)
    const baseTime = Date.now() - elapsedTime * 1000;

    if (!startTime) {
      setStartTime(Date.now());
    }

    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - baseTime) / 1000));
    }, 100);
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  const startNewSession = useCallback(
    (selectedCategory: CategoryKey = category) => {
      triggerHaptic("light");
      stopTimer();

      // 修正：改用動態 Context 的 questionsBank 讀取題目，而非靜態檔
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

      setTimeout(() => inputRef.current?.focus(), 100);
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

    // 改用 kana (平假名) 作為比對標準
    const currentKana = currentQ.kana;

    if (text === currentKana) {
      triggerHaptic("success");
      speaksentence(text);
      const newCharCount = charCount + currentKana.length;
      setCharCount(newCharCount);
      stopTimer();

      // if (currentIndex + 1 < questions.length) {
      //   setCurrentIndex((prev) => prev + 1);
      //   setInput("");

      //   // 清空原生 TextInput 快取，防止電腦 Enter 組字帶到下一題
      //   inputRef.current?.clear();
      // } else {
      //   stopTimer();
      //   setIsFinished(true);
      // }
    }
  };

  const cpm = elapsedTime > 0 ? Math.round((charCount / elapsedTime) * 60) : 0;
  const progressPercent =
    questions.length > 0
      ? Math.round((currentIndex / questions.length) * 100)
      : 0;

  // 核心修正：針對 kana 找出第一個打錯或尚未輸入的位置索引
  let firstMismatchIndex = 0;
  while (
    firstMismatchIndex < input.length &&
    firstMismatchIndex < currentQ.kana.length &&
    input[firstMismatchIndex] === currentQ.kana[firstMismatchIndex]
  ) {
    firstMismatchIndex++;
  }

  // 是否當前輸入包含錯誤
  const hasError = input.length > firstMismatchIndex;

  // 按鍵提示永遠指向平假名 (kana) 的「第一個出錯的字」或「下一個該打的字」
  const nextChar = currentQ.kana[firstMismatchIndex] || "";

  // 手動切換下一題
  const goToNextQuestion = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      startTimer();
      setInput("");
      inputRef.current?.clear();
    }
  }, [currentIndex, questions.length]);

  // 手動切換上一題
  const goToPrevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      startTimer();
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
