import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widget-task-handler';

// Must run before expo-router's entry registers the main app component —
// this is what lets Android launch a headless JS instance to redraw a
// widget without opening the app itself.
registerWidgetTaskHandler(widgetTaskHandler);

require('expo-router/entry');
