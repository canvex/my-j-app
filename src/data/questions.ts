// src/constants/questions.ts (或你存放此處程式碼的檔案名稱)

import { Category, CategoryKey, Question } from "../types/typing";

// 預設分類：僅保留一個「常用短句」
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "phrases", name: "常用短句" },
];

// 預設題庫：對應分類，加入「今天天氣真好」範例
export const QUESTION_BANK: Record<CategoryKey, Question[]> = {
  phrases: [
    {
      target: "今日はいい天気ですね",
      kana: "きょうはいいてんきですね",
      meaning: "今天天氣真好呢",
    },
  ],
};
