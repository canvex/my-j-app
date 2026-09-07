import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { CategoryKey } from "../types/typing";

interface CategorySelectorProps {
  currentCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
}

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "gojuon", label: "五十音" },
  { key: "daily", label: "日常招呼" },
  { key: "phrases", label: "常用短句" },
  { key: "customize", label: "自訂" },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  currentCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.categoryContainer}>
      {CATEGORIES.map(({ key, label }) => {
        const isActive = currentCategory === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
            onPress={() => onSelectCategory(key)}
          >
            <Text
              style={[
                styles.categoryBtnText,
                isActive && styles.categoryBtnTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EBECEF",
  },
  categoryBtnActive: { backgroundColor: "#0066FF" },
  categoryBtnText: { fontSize: 13, fontWeight: "700", color: "#6E7191" },
  categoryBtnTextActive: { color: "#FFFFFF" },
});
