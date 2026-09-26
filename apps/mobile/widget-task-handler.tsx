import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { BabyStatusBannerWidget } from '@/widgets/BabyStatusBannerWidget';
import { BabyStatusSquareWidget } from '@/widgets/BabyStatusSquareWidget';
import { getBabyStatusSnapshot } from '@/widgets/getSnapshot';

// Runs in a headless JS task whenever Android needs new pixels for one of
// our widgets — first placement, its periodic refresh, a resize, or the
// user manually asking for an update. There's nothing to do on
// WIDGET_CLICK: both widgets only ever use "OPEN_APP"/"OPEN_URI"
// clickActions, which the native side handles without invoking this task.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction === 'WIDGET_DELETED') return;

  const snapshot = await getBabyStatusSnapshot();

  switch (props.widgetInfo.widgetName) {
    case 'BabyStatusSquareWidget':
      props.renderWidget(<BabyStatusSquareWidget snapshot={snapshot} />);
      break;
    case 'BabyStatusBannerWidget':
      props.renderWidget(<BabyStatusBannerWidget snapshot={snapshot} />);
      break;
  }
}
