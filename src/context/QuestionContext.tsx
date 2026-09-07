// src/context/QuestionContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Category, CategoryKey, Question } from "../types/typing";
import {
  QUESTION_BANK as DEFAULT_BANK,
  DEFAULT_CATEGORIES,
} from "../data/questions";
import { exportBackup, mergeBackupData, BackupData } from "../utils/backup";

const BANK_KEY = "@flick_typing_questions_v5";
const CATS_KEY = "@flick_typing_categories_v5";
const DELETED_CATS_KEY = "@flick_typing_deleted_cats_v5";

const storage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === "web")
        return typeof window !== "undefined"
          ? window.localStorage.getItem(key)
          : null;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, val: string) => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined")
          window.localStorage.setItem(key, val);
        return;
      }
      await AsyncStorage.setItem(key, val);
    } catch (e) {}
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },
};

interface QuestionContextType {
  categories: Category[];
  questionsBank: Record<CategoryKey, Question[]>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: CategoryKey) => Promise<void>;
  importCustomQuestions: (
    category: CategoryKey,
    newQuestions: Question[],
  ) => Promise<number>;
  deleteQuestion: (
    category: CategoryKey,
    kanaToDelete: string,
  ) => Promise<void>;
  resetToDefault: () => Promise<void>;
  exportJSON: () => string;
  importJSON: (
    jsonString: string,
  ) => Promise<{ success: boolean; message: string; addedCount?: number }>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(
  undefined,
);

export const QuestionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [questionsBank, setQuestionsBank] =
    useState<Record<CategoryKey, Question[]>>(DEFAULT_BANK);

  // 初始化載入
  useEffect(() => {
    (async () => {
      const savedBankStr = await storage.getItem(BANK_KEY);
      const savedCatsStr = await storage.getItem(CATS_KEY);
      const savedDeletedCatsStr = await storage.getItem(DELETED_CATS_KEY);

      let deletedCatIds: string[] = [];
      if (savedDeletedCatsStr) {
        try {
          deletedCatIds = JSON.parse(savedDeletedCatsStr);
        } catch (e) {}
      }

      // 1. 處理分類 (先拿預設分類，扣除已被刪除的，再黏上自訂分類)
      let finalCategories = DEFAULT_CATEGORIES.filter(
        (c) => !deletedCatIds.includes(c.id),
      );

      if (savedCatsStr) {
        try {
          const parsedCats: Category[] = JSON.parse(savedCatsStr);
          // 將自訂分類加入
          const existingIds = new Set(finalCategories.map((c) => c.id));
          parsedCats.forEach((cat) => {
            if (!existingIds.has(cat.id) && !deletedCatIds.includes(cat.id)) {
              finalCategories.push(cat);
            }
          });
        } catch (e) {
          console.error(e);
        }
      }

      // 2. 處理題庫
      let finalBank = { ...DEFAULT_BANK };
      if (savedBankStr) {
        try {
          const parsedBank = JSON.parse(savedBankStr);
          finalBank = { ...DEFAULT_BANK, ...parsedBank };
        } catch (e) {
          console.error(e);
        }
      }

      setCategories(finalCategories);
      setQuestionsBank(finalBank);
    })();
  }, []);

  // 新增分類
  const addCategory = async (name: string) => {
    const newId = `custom_${Date.now()}`;
    const newCatList = [...categories, { id: newId, name }];
    const newBank = { ...questionsBank, [newId]: [] };

    setCategories(newCatList);
    setQuestionsBank(newBank);

    await storage.setItem(CATS_KEY, JSON.stringify(newCatList));
    await storage.setItem(BANK_KEY, JSON.stringify(newBank));
  };

  // 刪除分類 (真實刪除並持久化)
  const deleteCategory = async (id: CategoryKey) => {
    const newCatList = categories.filter((c) => c.id !== id);
    const newBank = { ...questionsBank };
    delete newBank[id];

    setCategories(newCatList);
    setQuestionsBank(newBank);

    const savedDeletedCatsStr = await storage.getItem(DELETED_CATS_KEY);
    let deletedCatIds: string[] = [];
    if (savedDeletedCatsStr) {
      try {
        deletedCatIds = JSON.parse(savedDeletedCatsStr);
      } catch (e) {}
    }
    if (!deletedCatIds.includes(id)) {
      deletedCatIds.push(id);
    }

    await storage.setItem(DELETED_CATS_KEY, JSON.stringify(deletedCatIds));
    await storage.setItem(CATS_KEY, JSON.stringify(newCatList));
    await storage.setItem(BANK_KEY, JSON.stringify(newBank));
  };

  // 匯入單一分類題目
  const importCustomQuestions = async (
    category: CategoryKey,
    newQuestions: Question[],
  ) => {
    const existingList = questionsBank[category] || [];
    const existingKanaSet = new Set(existingList.map((q) => q.kana));
    const uniqueNew = newQuestions.filter((q) => !existingKanaSet.has(q.kana));

    if (uniqueNew.length === 0) return 0;

    const updatedBank = {
      ...questionsBank,
      [category]: [...existingList, ...uniqueNew],
    };
    setQuestionsBank(updatedBank);
    await storage.setItem(BANK_KEY, JSON.stringify(updatedBank));
    return uniqueNew.length;
  };

  // 刪除單一題目
  const deleteQuestion = async (
    category: CategoryKey,
    kanaToDelete: string,
  ) => {
    const updatedList = (questionsBank[category] || []).filter(
      (q) => q.kana !== kanaToDelete,
    );
    const updatedBank = { ...questionsBank, [category]: updatedList };
    setQuestionsBank(updatedBank);
    await storage.setItem(BANK_KEY, JSON.stringify(updatedBank));
  };

  // 重置回預設狀態
  const resetToDefault = async () => {
    setCategories(DEFAULT_CATEGORIES);
    setQuestionsBank(DEFAULT_BANK);
    await storage.removeItem(CATS_KEY);
    await storage.removeItem(BANK_KEY);
    await storage.removeItem(DELETED_CATS_KEY);
  };

  // 匯出全部資料成 JSON 字串
  const exportJSON = () => {
    return exportBackup(categories, questionsBank);
  };

  // 匯入全域 JSON 檔案（自動去重 + 新增新分類）
  const importJSON = async (jsonString: string) => {
    try {
      const parsedData: BackupData = JSON.parse(jsonString);

      if (!parsedData || !parsedData.categories || !parsedData.questionsBank) {
        return { success: false, message: "無效的備份檔案格式！" };
      }

      const { updatedCategories, updatedBank, addedCount } = mergeBackupData(
        categories,
        questionsBank,
        parsedData,
      );

      setCategories(updatedCategories);
      setQuestionsBank(updatedBank);

      await storage.setItem(CATS_KEY, JSON.stringify(updatedCategories));
      await storage.setItem(BANK_KEY, JSON.stringify(updatedBank));

      return {
        success: true,
        message: `匯入完成！成功新增 ${addedCount} 筆題目並更新分類。`,
        addedCount,
      };
    } catch (e) {
      return {
        success: false,
        message: "解析失敗，請確認是否為正確的 JSON 檔案。",
      };
    }
  };

  return (
    <QuestionContext.Provider
      value={{
        categories,
        questionsBank,
        addCategory,
        deleteCategory,
        importCustomQuestions,
        deleteQuestion,
        resetToDefault,
        exportJSON,
        importJSON,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};

export const useQuestionContext = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error("useQuestionContext must be used within QuestionProvider");
  }
  return context;
};
