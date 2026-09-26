import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { BabyStatusSnapshot } from './getSnapshot';
import { StatTile } from './StatTile';
import { widgetColors, widgetFonts } from './theme';

// Wide (4x2) banner widget — the same snapshot as the square widget, laid
// out as a photo/name/age block on the left with the weight and feeding
// tiles side by side on the right, so it reads well in a single row.
export function BabyStatusBannerWidget({ snapshot }: { snapshot: BabyStatusSnapshot }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: widgetColors.canvas,
        borderRadius: 16,
        padding: 12,
        flexGap: 12,
      }}
    >
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ flexDirection: 'column', width: 96, alignItems: 'flex-start' }}
      >
        {snapshot.photoUrl ? (
          <ImageWidget
            image={snapshot.photoUrl as `https:${string}`}
            imageWidth={40}
            imageHeight={40}
            radius={20}
            resizeMode="cover"
          />
        ) : (
          <FlexWidget
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: widgetColors.accentSoft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={snapshot.name.charAt(0).toUpperCase() || 'P'}
              style={{ fontFamily: widgetFonts.heading, fontSize: 18, color: widgetColors.accentStrong }}
            />
          </FlexWidget>
        )}
        <TextWidget
          text={snapshot.name}
          maxLines={1}
          truncate="END"
          style={{ fontFamily: widgetFonts.heading, fontSize: 18, color: widgetColors.text, marginTop: 6 }}
        />
        <TextWidget
          text={snapshot.ageLabel}
          maxLines={1}
          style={{ fontFamily: widgetFonts.body, fontSize: 10, color: widgetColors.muted }}
        />
      </FlexWidget>
      <FlexWidget style={{ flex: 1, flexDirection: 'row', flexGap: 8 }}>
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
