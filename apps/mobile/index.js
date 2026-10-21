import { Platform } from 'react-native';

// Must run before expo-router's entry registers the main app component —
// this is what lets Android launch a headless JS instance to redraw a
// widget without opening the app itself. Android-only: web/iOS lack the API.
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

require('expo-router/entry');
