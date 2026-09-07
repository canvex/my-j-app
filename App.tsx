// App.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
// 💡 導入 SafeAreaProvider 與 useSafeAreaInsets
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import PracticeScreen from "./src/screens/PracticeScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { QuestionProvider } from "./src/context/QuestionContext";

const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0066FF",
        tabBarInactiveTintColor: "#A0A3BD",
        tabBarStyle: {
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
        },
      }}
    >
      <Tab.Screen
        name="Practice"
        component={PracticeScreen}
        options={{
          tabBarLabel: "練習",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>⌨️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "設定",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    // 💡 1. 核心修正：最外層加上 SafeAreaProvider
    <SafeAreaProvider>
      <QuestionProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </QuestionProvider>
    </SafeAreaProvider>
  );
}
