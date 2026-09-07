// src/utils/backup.ts

import { Category, CategoryKey, Question } from "../types/typing";

export interface BackupData {
  version: number;
  categories: Category[];
  questionsBank: Record<CategoryKey, Question[]>; // 👈 這裡原本是 questionBank，改成 questionsBank 加上 s
}

export const exportBackup = (
  categories: Category[],
  questionsBank: Record<CategoryKey, Question[]>,
): string => {
  const data: BackupData = {
    version: 1,
    categories,
    questionsBank,
  };
  return JSON.stringify(data, null, 2);
};

export const mergeBackupData = (
  currentCategories: Category[],
  currentBank: Record<CategoryKey, Question[]>,
  importedData: BackupData,
): {
  updatedCategories: Category[];
  updatedBank: Record<CategoryKey, Question[]>;
  addedCount: number;
} => {
  let addedCount = 0;
  const updatedCategories = [...currentCategories];
  const updatedBank: Record<CategoryKey, Question[]> = { ...currentBank };

  // 1. 新增未存在的分類
  if (Array.isArray(importedData.categories)) {
    importedData.categories.forEach((impCat) => {
      const exists = updatedCategories.some((c) => c.id === impCat.id);
      if (!exists) {
        updatedCategories.push(impCat);
      }
    });
  }

  // 2. 針對各分類進行題目去重與合併
  const impBank = importedData.questionsBank || {};
  Object.keys(impBank).forEach((catId) => {
    const existingList = updatedBank[catId] || [];
    const incomingList = impBank[catId] || [];

    const uniqueNew: Question[] = [];

    incomingList.forEach((incomingQ) => {
      // 僅在「同一個分類」內檢查是否重複
      const isDuplicate = existingList.some(
        (eq) => eq.target === incomingQ.target && eq.kana === incomingQ.kana,
      );

      if (!isDuplicate) {
        uniqueNew.push(incomingQ);
        addedCount++;
      }
    });

    updatedBank[catId] = [...existingList, ...uniqueNew];
  });

  return {
    updatedCategories,
    updatedBank,
    addedCount,
  };
};
