import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { usePracticeEngine } from "../hooks/usePracticeEngine";
import { SafeAreaView } from "react-native-safe-area-context";
import { TargetText } from "../components/TargetText";
import { FLICK_HINTS } from "../constants/flickHints";
import { useQuestionContext } from "../context/QuestionContext";

export default function PracticeScreen(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const {
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
    nextChar,
    hasError,
    startNewSession,
    handleInputChange,
    goToNextQuestion,
    goToPrevQuestion,
  } = usePracticeEngine("daily");

  const flickHint = FLICK_HINTS[nextChar] || "九宮格鍵盤";
  const { categories } = useQuestionContext();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.responsiveWrapper}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>FLICK TYPING</Text>
              </View>
              <Text style={styles.title}>日文九宮格練習</Text>
            </View>

            {/* 動態分類選擇器 (橫向滾動) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catBtn,
                      category === cat.id && styles.catBtnActive,
                    ]}
                    onPress={() => startNewSession(cat.id)}
                  >
                    <Text
                      style={[
                        styles.catBtnText,
                        category === cat.id && styles.catBtnTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {!isFinished ? (
              /* 練習卡片 */
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.card}
              >
                {/* 進度資訊 */}
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    題目{" "}
                    <Text style={styles.progressHighlight}>
                      {currentIndex + 1}
                    </Text>{" "}
                    / {questions.length}
                  </Text>
                  <View style={styles.cpmBadge}>
                    <Text style={styles.cpmBadgeText}>{cpm} CPM</Text>
                  </View>
                </View>

                {/* 進度條 */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>

                {/* 題目與高亮區域 */}
                <View style={styles.targetSection}>
                  <Text style={styles.sentenceText}>{currentQ.target}</Text>
                  <TargetText
                    target={currentQ.kana}
                    input={input}
                    firstMismatchIndex={firstMismatchIndex}
                    isDesktop={isDesktop}
                  />
                  {Boolean(currentQ.meaning) && (
                    <Text style={styles.meaningText}>{currentQ.meaning}</Text>
                  )}
                </View>

                {/* 按鍵提示 */}
                {nextChar !== "" && (
                  <View
                    style={[styles.hintCard, hasError && styles.hintCardError]}
                  >
                    <Text
                      style={[
                        styles.hintChar,
                        hasError && styles.hintCharError,
                      ]}
                    >
                      {hasError
                        ? `⚠️ 請修正『${nextChar}』`
                        : `『${nextChar}』`}
                    </Text>
                    <View
                      style={[
                        styles.hintDivider,
                        hasError && styles.hintDividerError,
                      ]}
                    />
                    <Text
                      style={[
                        styles.hintAction,
                        hasError && styles.hintCharError,
                      ]}
                    >
                      {flickHint}
                    </Text>
                  </View>
                )}

                {/* 輸入框 */}
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    input.length > 0 && styles.inputActive,
                    hasError && styles.inputError,
                  ]}
                  value={input}
                  onChangeText={handleInputChange}
                  placeholder="點擊此處開始打字..."
                  placeholderTextColor="#A0A3BD"
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                />

                {/* 題目導引區域 (上一題 / 下一題) */}
                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      currentIndex === 0 && styles.navBtnDisabled,
                    ]}
                    onPress={goToPrevQuestion}
                    disabled={currentIndex === 0}
                  >
                    <Text
                      style={[
                        styles.navBtnText,
                        currentIndex === 0 && styles.navBtnTextDisabled,
                      ]}
                    >
                      ⬅️ 上一題
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      currentIndex === questions.length - 1 &&
                        styles.navBtnDisabled,
                    ]}
                    onPress={goToNextQuestion}
                    disabled={currentIndex === questions.length - 1}
                  >
                    <Text
                      style={[
                        styles.navBtnText,
                        currentIndex === questions.length - 1 &&
                          styles.navBtnTextDisabled,
                      ]}
                    >
                      下一題 ➡️
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 數據欄 */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardLabel}>耗時</Text>
                    <Text style={styles.statCardValue}>
                      {elapsedTime} <Text style={styles.statCardUnit}>秒</Text>
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardLabel}>總字數</Text>
                    <Text style={styles.statCardValue}>
                      {charCount} <Text style={styles.statCardUnit}>字</Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              /* 結算頁面 */
              <View style={styles.card}>
                <View style={styles.successIconWrapper}>
                  <Text style={styles.successEmoji}>🎯</Text>
                </View>
                <Text style={styles.resultTitle}>練習完成！</Text>
                <Text style={styles.resultSubtitle}>
                  太棒了，繼續保持這個節奏！
                </Text>

                <View style={styles.mainScoreCard}>
                  <Text style={styles.mainScoreLabel}>平均打字速度</Text>
                  <Text style={styles.mainScoreValue}>{cpm}</Text>
                  <Text style={styles.mainScoreUnit}>CPM (字/分)</Text>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardLabel}>總耗時</Text>
                    <Text style={styles.statCardValue}>
                      {elapsedTime} <Text style={styles.statCardUnit}>秒</Text>
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardLabel}>總字數</Text>
                    <Text style={styles.statCardValue}>
                      {charCount} <Text style={styles.statCardUnit}>字</Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => startNewSession()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>
                    換一組題目再試一次
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F5F9" },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  responsiveWrapper: { width: "100%", maxWidth: 480 },
  header: { alignItems: "center", marginBottom: 16 },
  tagBadge: {
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0066FF",
    letterSpacing: 1.2,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1D26" },

  /* 💡 補上的分類按鈕樣式 */
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  catBtnActive: {
    backgroundColor: "#0066FF",
    borderColor: "#0066FF",
  },
  catBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6E7191",
  },
  catBtnTextActive: {
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: { fontSize: 13, fontWeight: "600", color: "#6E7191" },
  progressHighlight: { color: "#1A1D26", fontWeight: "800" },
  cpmBadge: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cpmBadgeText: { fontSize: 12, fontWeight: "700", color: "#4A4D5A" },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#F0F2F5",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0066FF",
    borderRadius: 3,
  },
  targetSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  sentenceText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6E7191",
    marginBottom: 12,
  },
  meaningText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066FF",
    marginTop: 8,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9E6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#FFE58F",
  },
  hintCardError: { backgroundColor: "#FFF2F0", borderColor: "#FFCCC7" },
  hintChar: { fontSize: 14, fontWeight: "800", color: "#D48806" },
  hintCharError: { color: "#FF4D4F" },
  hintDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#FFE58F",
    marginHorizontal: 10,
  },
  hintDividerError: { backgroundColor: "#FFCCC7" },
  hintAction: { fontSize: 14, fontWeight: "700", color: "#D48806" },
  input: {
    backgroundColor: "#F7F8FA",
    borderWidth: 2,
    borderColor: "#F0F2F5",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1D26",
    textAlign: "center",
    marginVertical: 16,
  },
  inputActive: { borderColor: "#0066FF", backgroundColor: "#FFFFFF" },
  inputError: { borderColor: "#FF4D4F", backgroundColor: "#FFF2F0" },
  statsContainer: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6E7191",
    marginBottom: 4,
  },
  statCardValue: { fontSize: 18, fontWeight: "800", color: "#1A1D26" },
  statCardUnit: { fontSize: 12, fontWeight: "500", color: "#6E7191" },
  successIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EAF9ED",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  successEmoji: { fontSize: 28 },
  resultTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#1A1D26",
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: "#6E7191",
    textAlign: "center",
    marginBottom: 20,
  },
  mainScoreCard: {
    backgroundColor: "#E8F2FF",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  mainScoreLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0066FF",
    marginBottom: 2,
  },
  mainScoreValue: {
    fontSize: 44,
    fontWeight: "900",
    color: "#0066FF",
    letterSpacing: -1,
  },
  mainScoreUnit: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0066FF",
    opacity: 0.7,
  },
  primaryButton: {
    backgroundColor: "#0066FF",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
  },
  navBtnDisabled: {
    backgroundColor: "#F0F2F5",
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0066FF",
  },
  navBtnTextDisabled: {
    color: "#A0A3BD",
  },
});
