import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as Speech from "expo-speech";

export default function AboutScreen() {
  const speak = () => {
    const thing = "としょかんでほんをかりる";
    Speech.speak(thing, { language: "ja-JP" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>日文九宮格打字 v1.3.3</Text>
      <Button title="Press to hear some words" onPress={speak} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
