// src/components/TargetText.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface TargetTextProps {
  target: string;
  input: string;
  firstMismatchIndex: number;
  isDesktop?: boolean;
}

export const TargetText: React.FC<TargetTextProps> = ({
  target,
  input,
  firstMismatchIndex,
  isDesktop = false,
}) => {
  return (
    <View style={styles.targetWordRow}>
      {target.split("").map((char, index) => {
        let charStyle = styles.charNormal;

        if (index < input.length) {
          charStyle =
            input[index] === char ? styles.charCorrect : styles.charWrong;
        }

        if (index === firstMismatchIndex) {
          charStyle =
            index < input.length ? styles.charWrong : styles.charCurrent;
        }

        const isCurrentFocus = index === firstMismatchIndex;

        return (
          <View
            key={index}
            style={[
              styles.charBox,
              isCurrentFocus && styles.charCurrentWrapper,
            ]}
          >
            <Text
              style={[
                styles.targetChar,
                charStyle,
                isDesktop && styles.targetCharDesktop,
              ]}
            >
              {char}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  targetWordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    gap: 0, // 確保沒有額外間距
  },
  charBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 2, // 留給底線的空間
    borderBottomWidth: 3,
    borderBottomColor: "transparent", // 預設隱藏底線，避免沒焦點時高低不一
  },
  charCurrentWrapper: {
    borderBottomColor: "#0066FF", // 當前字才顯示藍色底線
  },
  targetChar: {
    fontSize: 24, // 👈 稍微調小，確保 11~13 個字能在手機上一行完整呈現
    fontWeight: "800",
    marginHorizontal: 0, // 👈 移除左右外距，消除字距過開
    paddingHorizontal: 2, // 👈 縮小內聚，讓底線寬度恰到好處
    paddingVertical: 0,
    borderRadius: 4,
    overflow: "hidden",
  },
  targetCharDesktop: {
    fontSize: 32, // 電腦版大小
  },
  charNormal: { color: "#1A1D26" },
  charCorrect: { color: "#28C76F" },
  charWrong: { color: "#FFFFFF", backgroundColor: "#FF4D4F" },
  charCurrent: { color: "#0066FF" },
});
