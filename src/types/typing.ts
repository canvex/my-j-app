// src/types/typing.ts

export type CategoryKey = string; // 改為動態字串

export interface Question {
  id?: string;
  target: string; // 一般句子/漢字 (例如：日本語の練習)
  kana: string; // 平假名 (例如：にほんごのれんしゅう)
  meaning: string; // 中文翻譯 (例如：日文輸入練習)
}

export interface PracticeStats {
  elapsedTime: number;
  charCount: number;
  cpm: number;
}

export interface Category {
  id: CategoryKey;
  name: string;
}
