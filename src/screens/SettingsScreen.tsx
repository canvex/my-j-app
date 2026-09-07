// src/screens/SettingsScreen.tsx

import React, { useState } from "react";
import {
  StyleSheet,
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuestionContext } from "../context/QuestionContext";
import { CategoryKey, Question } from "../types/typing";
import { showAlert, showConfirm, copyToClipboard } from "../utils/alert";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";

// 給 AI 的預設提示詞範本
const AI_PROMPT_TEMPLATE = `請幫我生成 10 題適合日文假名打字練習的題目。
請嚴格輸出為純 JSON 陣列格式（不要包含任何 markdown 標籤或 markdown 程式碼塊），欄位說明如下：
- target: 日文原文（可包含漢字、假名或標點符號）
- kana: 全平假名（這是打字比對的標準，不可包含漢字或全形標點）
- meaning: 中文翻譯

輸出格式範例：
[
  {
    "target": "猫の手も借りたい",
    "kana": "ねこのてもかりたい",
    "meaning": "忙得不可開交"
  }
]`;

export function SettingsScreen() {
  const {
    categories,
    questionsBank,
    addCategory,
    deleteCategory,
    importCustomQuestions,
    deleteQuestion,
    resetToDefault,
    exportJSON,
    importJSON,
  } = useQuestionContext();

  const [newCatName, setNewCatName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(
    categories[0]?.id || "daily",
  );
  const [manageCategory, setManageCategory] = useState<CategoryKey>(
    categories[0]?.id || "daily",
  );
  const [jsonInput, setJsonInput] = useState("");
  const [globalJsonInput, setGlobalJsonInput] = useState("");
  const [copied, setCopied] = useState(false);

  const exampleJson = JSON.stringify(
    [
      {
        target: "猫の手も借りたい",
        kana: "ねこのてもかりたい",
        meaning: "忙得不可開交",
      },
      {
        target: "猿も木から落ちる",
        kana: "さるもきからおちる",
        meaning: "智者千慮，必有一失",
      },
    ],
    null,
    2,
  );

  // 1. 全域 JSON 匯出 (跨平台)
  const handleExportGlobalJSON = async () => {
    const jsonString = exportJSON();
    const fileName = `ja_backup_${new Date().toISOString().slice(0, 10)}.json`;

    if (Platform.OS === "web") {
      try {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        showAlert("匯出失敗", "無法產出備份檔案");
      }
    } else {
      try {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);

        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "匯出題庫",
        });
      } catch (error) {
        showAlert("匯出失敗", "無法啟動分享選單");
      }
    }
  };

  // 2. Web 版檔案上傳全域 JSON
  const handleWebFileImport = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        const result = await importJSON(content);
        showAlert(result.success ? "成功" : "失敗", result.message);
      }
    };
    reader.readAsText(file);
  };

  // 1. 處理「文字輸入框」的 JSON 匯入
  // 手機版：針對 TextInput 裡的文字做匯入
  const handleTextGlobalImport = async () => {
    if (!globalJsonInput.trim()) {
      showAlert("提示", "請先在此貼上 JSON 文字內容！");
      return;
    }

    // 直接呼叫你的核心匯入邏輯 importJSON
    const result = await importJSON(globalJsonInput);
    showAlert(result.success ? "成功" : "失敗", result.message);

    if (result.success) {
      setGlobalJsonInput(""); // 成功後清空輸入框
    }
  };

  // 2. 處理「手機選取檔案」的 JSON 匯入
  const handleMobileFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const response = await fetch(fileUri);
        const fileContent = await response.text();

        // 讀完檔案後，同樣傳給 importJSON 處理！
        const importResult = await importJSON(fileContent);
        showAlert(importResult.success ? "成功" : "失敗", importResult.message);
      }
    } catch (error: any) {
      showAlert("失敗", `檔案讀取失敗：${error.message}`);
    }
  };

  // 一鍵複製 Prompt
  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(AI_PROMPT_TEMPLATE);
    if (success) {
      setCopied(true);
      showAlert(
        "複製成功",
        "提示詞已複製到剪貼簿！可直接貼給 ChatGPT / Claude 出題。",
      );
      setTimeout(() => setCopied(false), 2000);
    } else {
      showAlert("複製失敗", "請手動選取文字複製。");
    }
  };

  // 新增分類
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      showAlert("提示", "請輸入分類名稱");
      return;
    }
    await addCategory(newCatName.trim());
    setNewCatName("");
    showAlert("成功", "已新增分類！");
  };

  // 匯入單一分類題目
  const handleImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        showAlert("格式錯誤", "請輸入 JSON 陣列格式 [ { ... }, { ... } ]");
        return;
      }

      const isValid = parsed.every((q: any) => q.target && q.kana && q.meaning);
      if (!isValid) {
        showAlert("格式錯誤", "每題皆須包含 target, kana, meaning 欄位");
        return;
      }

      const addedCount = await importCustomQuestions(
        selectedCategory,
        parsed as Question[],
      );

      if (addedCount === 0) {
        showAlert("提示", "您匯入的題目已全部存在，未新增重複題目。");
      } else {
        showAlert(
          "成功",
          `已成功匯入 ${addedCount} 條新題目！(自動過濾掉重複題目)`,
        );
        setJsonInput("");
      }
    } catch (e) {
      showAlert("解析錯誤", "請確認輸入的是有效的 JSON 格式");
    }
  };

  const currentQuestions = questionsBank[manageCategory] || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>⚙️ 題庫與系統設定</Text>

        {/* 📦 0. 全域題庫備份與匯入 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 全域題庫備份與還原 (JSON)</Text>
          <Text style={styles.desc}>
            包含所有分類與題目的完整備份，可直接導出分享給朋友或跨裝置同步。
          </Text>

          <TouchableOpacity
            style={styles.globalExportBtn}
            onPress={handleExportGlobalJSON}
          >
            <Text style={styles.globalExportBtnText}>📤 匯出完整題庫 JSON</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.subTitle}>📥 匯入完整題庫</Text>

          {Platform.OS === "web" ? (
            <View style={styles.webImportBox}>
              <Text style={styles.desc}>請選擇先前匯出的 .json 備份檔：</Text>
              <input
                type="file"
                accept=".json"
                onChange={handleWebFileImport}
                style={{ fontSize: "14px", marginTop: "4px" }}
              />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {/* 方式 1：貼上文字匯入 */}
              <TextInput
                style={styles.jsonInput}
                multiline
                numberOfLines={4}
                placeholder="在此貼上全域 JSON 備份文字..."
                value={globalJsonInput}
                onChangeText={setGlobalJsonInput}
              />
              <TouchableOpacity
                style={styles.globalImportBtn}
                onPress={handleTextGlobalImport}
              >
                <Text style={styles.globalImportBtnText}>確認貼上並匯入</Text>
              </TouchableOpacity>

              {/* 分隔線或提示 */}
              <Text
                style={{
                  textAlign: "center",
                  color: "#888",
                  marginVertical: 4,
                }}
              >
                ── 或 ──
              </Text>

              {/* 方式 2：選擇檔案匯入 */}
              <TouchableOpacity
                style={[styles.globalImportBtn, { backgroundColor: "#4A90E2" }]}
                onPress={handleMobileFileImport}
              >
                <Text style={styles.globalImportBtnText}>
                  📁 從手機選擇 .json 檔案
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 1. 分類管理區塊 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📁 分類管理</Text>
          <View style={styles.addCatRow}>
            <TextInput
              style={styles.catInput}
              placeholder="輸入新分類名稱 (例如: 動漫台詞)"
              value={newCatName}
              onChangeText={setNewCatName}
            />
            <TouchableOpacity
              style={styles.addCatBtn}
              onPress={handleAddCategory}
            >
              <Text style={styles.addCatBtnText}>新增</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.desc}>目前的分類：</Text>
          <View style={styles.catChipGroup}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.catChip}>
                <Text style={styles.catChipText}>{cat.name}</Text>
                {categories.length > 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      showConfirm(
                        "刪除分類",
                        `確定要刪除「${cat.name}」及其內部所有題目嗎？`,
                        async () => await deleteCategory(cat.id),
                        "取消",
                        "刪除",
                      )
                    }
                  >
                    <Text style={styles.deleteChipText}> ❌</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 🤖 2. AI 出題提示詞卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI 出題提示詞 (Prompt)</Text>
          <Text style={styles.desc}>
            點擊下方區塊複製提示詞，貼給 ChatGPT / Claude
            生成題目後，再貼回下方匯入區：
          </Text>

          <TouchableOpacity
            style={styles.promptBox}
            activeOpacity={0.7}
            onPress={handleCopyPrompt}
          >
            <Text style={styles.promptText}>{AI_PROMPT_TEMPLATE}</Text>
            <View style={[styles.copyBadge, copied && styles.copyBadgeSuccess]}>
              <Text style={styles.copyBadgeText}>
                {copied ? "✓ 已複製" : "📋 點擊複製提示詞"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. 匯入單一分類題庫區塊 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📥 匯入自訂題目至指定分類</Text>
          <Text style={styles.desc}>選擇要匯入到的分類：</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollCategoryRow}
          >
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catBtn,
                    selectedCategory === cat.id && styles.catBtnActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.catBtnText,
                      selectedCategory === cat.id && styles.catBtnTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TextInput
            style={styles.jsonInput}
            multiline
            numberOfLines={5}
            placeholder="請將 AI 生成的 JSON 貼於此處..."
            value={jsonInput}
            onChangeText={setJsonInput}
          />

          <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
            <Text style={styles.importBtnText}>確認匯入題目</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() => setJsonInput(exampleJson)}
          >
            <Text style={styles.templateBtnText}>填入範例 JSON</Text>
          </TouchableOpacity>
        </View>

        {/* 4. 題目管理區塊 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📋 目前題庫清單 ({currentQuestions.length} 題)
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollCategoryRow}
          >
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catBtn,
                    manageCategory === cat.id && styles.catBtnActive,
                  ]}
                  onPress={() => setManageCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.catBtnText,
                      manageCategory === cat.id && styles.catBtnTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {currentQuestions.map((q, index) => (
            <View key={`${q.kana}-${index}`} style={styles.questionItem}>
              <View style={styles.qTextGroup}>
                <Text style={styles.qTarget}>{q.target}</Text>
                <Text style={styles.qKana}>{q.kana}</Text>
                <Text style={styles.qMeaning}>{q.meaning}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() =>
                  showConfirm(
                    "刪除確認",
                    `確定要刪除「${q.target}」嗎？`,
                    async () => await deleteQuestion(manageCategory, q.kana),
                    "取消",
                    "刪除",
                  )
                }
              >
                <Text style={styles.deleteBtnText}>刪除</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 5. 資料重置 */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() =>
              showConfirm(
                "重置警告",
                "確定要清空自訂題庫與分類，恢復預設嗎？",
                async () => {
                  await resetToDefault();
                  showAlert("完成", "已成功恢復預設題庫與分類！");
                },
                "取消",
                "確定重置",
              )
            }
          >
            <Text style={styles.resetBtnText}>恢復預設題庫與分類</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F5F9",
  },
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1D26",
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1D26",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D26",
    marginBottom: 12,
  },
  desc: {
    fontSize: 13,
    color: "#6E7191",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },

  // 📦 全域備份按鈕樣式
  globalExportBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  globalExportBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  globalImportBtn: {
    backgroundColor: "#1A1D26",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  globalImportBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  webImportBox: {
    backgroundColor: "#F7F8FA",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  // 🤖 AI 提示詞卡片樣式
  promptBox: {
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    position: "relative",
  },
  promptText: {
    fontSize: 12,
    color: "#4A5568",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    lineHeight: 18,
    paddingBottom: 28,
  },
  copyBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "#0066FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBadgeSuccess: {
    backgroundColor: "#10B981",
  },
  copyBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // 分類管理樣式
  addCatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  catInput: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
  },
  addCatBtn: {
    backgroundColor: "#0066FF",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  addCatBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  catChipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  catChipText: {
    fontSize: 13,
    color: "#1A1D26",
    fontWeight: "600",
  },
  deleteChipText: {
    fontSize: 11,
    color: "#FF4D4F",
  },
  scrollCategoryRow: {
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  catBtnActive: {
    backgroundColor: "#0066FF",
  },
  catBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6E7191",
  },
  catBtnTextActive: {
    color: "#FFFFFF",
  },
  jsonInput: {
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  importBtn: {
    backgroundColor: "#0066FF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  importBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  templateBtn: {
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 4,
  },
  templateBtnText: {
    color: "#0066FF",
    fontWeight: "600",
    fontSize: 12,
  },
  questionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  qTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  qTarget: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1D26",
  },
  qKana: {
    fontSize: 12,
    color: "#0066FF",
    marginTop: 2,
  },
  qMeaning: {
    fontSize: 12,
    color: "#6E7191",
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: "#FFEDED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: "#FF4D4F",
    fontSize: 12,
    fontWeight: "600",
  },
  resetBtn: {
    backgroundColor: "#FF4D4F",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  resetBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

export default SettingsScreen;
