import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createElement, useEffect, useRef } from 'react';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

// Web stand-in for @react-native-community/datetimepicker (which has no web
// implementation): a native <input type="date|time">, opened straight away so
// it behaves like the native picker sheet the callers expect to pop up.
// Same props/onChange contract as the subset of the native picker we use.
type Props = {
  value: Date;
  mode?: 'date' | 'time';
  display?: string;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
};

const pad = (n: number) => String(n).padStart(2, '0');

function toInputValue(value: Date, mode: 'date' | 'time') {
  return mode === 'date'
    ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    : `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function eventOf(kind: DateTimePickerEvent['type'], date?: Date): DateTimePickerEvent {
  return {
    type: kind,
    nativeEvent: { timestamp: date?.getTime() ?? Date.now(), utcOffset: -new Date().getTimezoneOffset() },
  };
}

export default function DateTimeField({ value, mode = 'date', onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // Needs a recent user gesture in some browsers — the focused input is
      // still right there to click.
    }
  }, []);

  return createElement('input', {
    ref,
    type: mode,
    defaultValue: toInputValue(value, mode),
    'aria-label': mode === 'date' ? 'Choose date' : 'Choose time',
    onChange: (e: { target: HTMLInputElement }) => {
      const raw = e.target.value;
      if (!raw) return;
      const next = new Date(value);
      if (mode === 'date') {
        const [y, m, d] = raw.split('-').map(Number);
        next.setFullYear(y, m - 1, d);
      } else {
        const [h, min] = raw.split(':').map(Number);
        next.setHours(h, min, 0, 0);
      }
      done.current = true;
      onChange?.(eventOf('set', next), next);
    },
    onBlur: () => {
      if (!done.current) onChange?.(eventOf('dismissed'));
    },
    style: {
      marginTop: space.sm,
      padding: space.md,
      borderRadius: radius.sm,
      border: `1px solid ${colors.line}`,
      fontSize: type.body,
      color: colors.text,
      backgroundColor: colors.surface,
      fontFamily: 'inherit',
    },
  });
}
