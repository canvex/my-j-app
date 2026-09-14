// src/utils/checkUpdate.ts

import { Linking } from "react-native";
import Constants from "expo-constants";
import { showConfirm } from "./alert"; // 引入你寫好的 showConfirm

// 1. 填入你的 GitHub 帳號與 Repo 名稱
const GITHUB_OWNER = "canvex"; // 例如 "brianck666"
const GITHUB_REPO = "my-j-app";

/**
 * 檢查 GitHub Releases 是否有新版本
 * @param silentMode 若為 true，當沒有新版本時不跳任何提示（預設）；若為 false，無新版也會提示「已是最新版」
 */
export const checkAppUpdate = async (silentMode = true) => {
  try {
    // 取得 app.json 內設定的 version (例如 "1.3.4")
    const currentVersion = Constants.expoConfig?.version || "1.0.0";

    // 發送請求給 GitHub API 抓取 latest release
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    );

    if (!response.ok) {
      console.log("無法取得 GitHub Release 資訊");
      return;
    }

    const data = await response.json();

    // GitHub Release 的 tag_name 通常寫成 "v1.3.5" 或 "1.3.5"
    const latestTag: string = data.tag_name || "";
    const cleanLatestVersion = latestTag.replace(/^v/, ""); // 把開頭的 'v' 去掉，方便比對

    // 比對版本號：如果 GitHub 最新版號跟目前手機上的不一致
    if (cleanLatestVersion && cleanLatestVersion !== currentVersion) {
      const downloadUrl = data.html_url; // Release 頁面連結

      // 使用你寫好的 showConfirm
      showConfirm(
        "發現新版本 🎉",
        `目前已有最新的 v${cleanLatestVersion} 版本（您當前版本為 v${currentVersion}），是否前往 GitHub 下載更新？`,
        () => {
          // 點擊「確定」後開啟瀏覽器進入 GitHub Release 頁面下載 APK
          Linking.openURL(downloadUrl);
        },
        "稍後再說",
        "前往下載",
      );
    } else if (!silentMode) {
      // 若手動點擊檢查更新且已經是最新版時
      import("./alert").then(({ showAlert }) => {
        showAlert("提示", `目前已是最新版本 (v${currentVersion})`);
      });
    }
  } catch (error) {
    console.error("檢查更新發生錯誤：", error);
  }
};
