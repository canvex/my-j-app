// src/utils/haptics.ts
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

import * as Speech from "expo-speech";

export const triggerHaptic = (type: "light" | "success") => {
  if (Platform.OS !== "web") {
    if (type === "light")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "success")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

//句子發音
export const speaksentence = (sentence: string) => {
  // const thing = "としょかんでほんをかりる";
  Speech.speak(sentence, { language: "ja-JP" });
};
