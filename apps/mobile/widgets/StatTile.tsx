import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { widgetColors, widgetFonts } from './theme';

// A tappable weight/feeding tile — mirrors MetricCard.tsx's shape (label
// over value over caption) but as widget primitives, and doubles as the
// quick-add affordance: tapping it deep-links straight into the matching
// add-* screen instead of just opening the app.
export function StatTile({
  label,
  value,
  placeholder,
  caption,
  deepLink,
}: {
  label: string;
  value?: string;
  placeholder: string;
  caption: string;
  deepLink: string;
}) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: deepLink }}
      style={{
        flex: 1,
        flexDirection: 'column',
        backgroundColor: widgetColors.surface,
        borderColor: widgetColors.divider,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
      }}
    >
      <TextWidget
        text={label.toUpperCase()}
        style={{
          fontFamily: widgetFonts.bodyMedium,
          fontSize: 10,
          letterSpacing: 1,
          color: widgetColors.accent,
        }}
      />
      <TextWidget
        text={value ?? placeholder}
        maxLines={1}
        style={{
          fontFamily: widgetFonts.heading,
          fontSize: 20,
          marginTop: 4,
          color: widgetColors.text,
        }}
      />
      <TextWidget
        text={caption}
        maxLines={1}
        truncate="END"
        style={{
          fontFamily: widgetFonts.body,
          fontSize: 11,
          marginTop: 2,
          color: widgetColors.muted,
        }}
      />
    </FlexWidget>
  );
}
