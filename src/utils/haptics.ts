// src/utils/haptics.ts
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const triggerHaptic = (type: 'light' | 'success') => {
  if (Platform.OS !== 'web') {
    if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};