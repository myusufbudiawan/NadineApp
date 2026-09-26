import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { BabyStatusSnapshot } from './getSnapshot';
import { StatTile } from './StatTile';
import { widgetColors, widgetFonts } from './theme';

// 2x2 home-screen widget — a compact snapshot for a corner of the home
// screen: name + age up top, weight and feeding stacked underneath. Each
// stat tile deep-links to its add screen; the header opens the app.
export function BabyStatusSquareWidget({ snapshot }: { snapshot: BabyStatusSnapshot }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: widgetColors.canvas,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        {snapshot.photoUrl ? (
          <ImageWidget
            image={snapshot.photoUrl as `https:${string}`}
            imageWidth={34}
            imageHeight={34}
            radius={17}
            resizeMode="cover"
          />
        ) : (
          <FlexWidget
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: widgetColors.accentSoft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={snapshot.name.charAt(0).toUpperCase() || 'P'}
              style={{ fontFamily: widgetFonts.heading, fontSize: 16, color: widgetColors.accentStrong }}
            />
          </FlexWidget>
        )}
        <FlexWidget style={{ flexDirection: 'column', marginLeft: 8, flex: 1 }}>
          <TextWidget
            text={snapshot.name}
            maxLines={1}
            truncate="END"
            style={{ fontFamily: widgetFonts.heading, fontSize: 20, color: widgetColors.text }}
          />
          <TextWidget
            text={snapshot.ageLabel}
            maxLines={1}
            style={{ fontFamily: widgetFonts.body, fontSize: 11, color: widgetColors.muted }}
          />
        </FlexWidget>
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'column', marginTop: 10, flexGap: 8 }}>
        <StatTile
          label="Weight"
          value={snapshot.weightLabel}
          placeholder="—"
          caption={snapshot.weightCaption}
          deepLink="preemietrack://track/add-weight"
        />
        <StatTile
          label="Feeding"
          value={snapshot.feedingLabel}
          placeholder="—"
          caption={snapshot.feedingCaption}
          deepLink="preemietrack://track/add-feeding"
        />
      </FlexWidget>
    </FlexWidget>
  );
}
