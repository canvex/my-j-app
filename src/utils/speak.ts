import * as Speech from "expo-speech";

//句子發音
export const speaksentence = (sentence: string) => {
  // const thing = "としょかんでほんをかりる";
  Speech.speak(sentence, { language: "ja-JP" });
};
