import { Platform } from 'react-native';

// Must run before expo-router's entry registers the main app component —
// this is what lets Android launch a headless JS instance to redraw a
// widget without opening the app itself. Home-screen widgets don't exist on
// web (the browser demo), so skip loading the widget module there.
if (Platform.OS !== 'web') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

require('expo-router/entry');
