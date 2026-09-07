// src/utils/alert.ts

import { Alert, Platform } from "react-native";

/**
 * 跨平台通用訊息提示 (替代 Alert.alert 的單一按鈕模式)
 */
export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}${message ? `\n\n${message}` : ""}`);
  } else {
    Alert.alert(title, message);
  }
};

/**
 * 跨平台通用二次確認框 (替代 Alert.alert 的確認/取消模式)
 * @param title 標題
 * @param message 內文說明
 * @param onConfirm 點擊確定後執行的 Callback
 * @param cancelText 取消按鈕文字 (預設 "取消")
 * @param confirmText 確定按鈕文字 (預設 "確定")
 */
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  cancelText: string = "取消",
  confirmText: string = "確定",
) => {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel" },
      { text: confirmText, style: "destructive", onPress: onConfirm },
    ]);
  }
};

/**
 * 跨平台剪貼簿複製功能
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (Platform.OS === "web") {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // 舊型 Web 瀏覽器備用方案
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        return true;
      }
    } else {
      // 若有安裝 expo-clipboard 或 @react-native-clipboard/clipboard 可改用套件
      // 此處提供 Expo 建議寫法，若未安裝套件，可藉由 require 動態載入
      const Clipboard = require("react-native").Clipboard;
      if (Clipboard && Clipboard.setString) {
        Clipboard.setString(text);
        return true;
      }
      return false;
    }
  } catch (e) {
    console.error("複製失敗", e);
    return false;
  }
};
