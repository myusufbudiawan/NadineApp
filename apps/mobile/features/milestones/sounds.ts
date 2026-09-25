import { MilestoneId } from './types';

// A distinct short chime per milestone (see scripts/generate-milestone-chimes.py).
export const milestoneSounds: Record<MilestoneId, number> = {
  'off-cpap': require('../../assets/sounds/off-cpap.m4a'),
  'off-high-flow': require('../../assets/sounds/off-high-flow.m4a'),
  'room-air': require('../../assets/sounds/room-air.m4a'),
  'first-oral-feed': require('../../assets/sounds/first-oral-feed.m4a'),
  'full-oral-feeds': require('../../assets/sounds/full-oral-feeds.m4a'),
  'term-feeding-volume': require('../../assets/sounds/term-feeding-volume.m4a'),
  'regained-birth-weight': require('../../assets/sounds/regained-birth-weight.m4a'),
  'two-kilos': require('../../assets/sounds/two-kilos.m4a'),
  'first-cuddle': require('../../assets/sounds/first-cuddle.m4a'),
  'open-cot': require('../../assets/sounds/open-cot.m4a'),
  'reached-due-date': require('../../assets/sounds/reached-due-date.m4a'),
  discharged: require('../../assets/sounds/discharged.m4a'),
};
