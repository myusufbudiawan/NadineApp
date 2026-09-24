import { MilestoneId } from './types';

// A distinct short chime per milestone (see scripts/generate-milestone-chimes.py).
export const milestoneSounds: Record<MilestoneId, number> = {
  'off-cpap': require('../../assets/sounds/off-cpap.wav'),
  'off-high-flow': require('../../assets/sounds/off-high-flow.wav'),
  'room-air': require('../../assets/sounds/room-air.wav'),
  'first-oral-feed': require('../../assets/sounds/first-oral-feed.wav'),
  'full-oral-feeds': require('../../assets/sounds/full-oral-feeds.wav'),
  'term-feeding-volume': require('../../assets/sounds/term-feeding-volume.wav'),
  'regained-birth-weight': require('../../assets/sounds/regained-birth-weight.wav'),
  'two-kilos': require('../../assets/sounds/two-kilos.wav'),
  'first-cuddle': require('../../assets/sounds/first-cuddle.wav'),
  'open-cot': require('../../assets/sounds/open-cot.wav'),
  'reached-due-date': require('../../assets/sounds/reached-due-date.wav'),
  discharged: require('../../assets/sounds/discharged.wav'),
};
