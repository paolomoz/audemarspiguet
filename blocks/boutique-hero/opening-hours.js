/**
 * opening-hours — shared Yext-hours helpers for the store-detail archetype
 * (boutique-hero contact card + carousel.boutiques store cards).
 *
 * Authored hours format (one token per day, generated from the Yext entity's
 * `hours` field): "Monday 10:00 — 18:30, 14:30 — 19:00" or "Sunday Closed".
 * The live site derives the same three strings client-side (Open now /
 * Closed now / Closed) from the baked entity + the visitor's clock, so the
 * status is computed here too — never authored.
 */

const DAY_INDEX = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};

/**
 * Parse authored day lines into structured entries.
 * @param {string[]} lines e.g. ["Monday 10:00 — 18:30", ..., "Sunday Closed"]
 * @returns {Array<{idx:number,label:string,closed:boolean,intervals:string[],
 *   ranges:Array<[number,number]>}>} sorted Monday-first
 */
export function parseHours(lines) {
  const toMin = (hhmm) => {
    const m = hhmm.match(/(\d{1,2}):(\d{2})/);
    return m ? (Number(m[1]) * 60) + Number(m[2]) : null;
  };
  return lines
    .map((raw) => {
      const text = raw.replace(/\s+/g, ' ').trim();
      const m = text.match(/^(\S+)\s*(.*)$/);
      if (!m) return null;
      const label = m[1];
      const idx = DAY_INDEX[label.toLowerCase()];
      if (idx === undefined) return null;
      const rest = m[2].trim();
      const intervals = rest && !/^closed$/i.test(rest)
        ? rest.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const ranges = intervals
        .map((iv) => {
          const times = iv.match(/\d{1,2}:\d{2}/g) || [];
          return times.length === 2 ? [toMin(times[0]), toMin(times[1])] : null;
        })
        .filter(Boolean);
      return {
        idx, label, closed: !intervals.length, intervals, ranges,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.idx - b.idx);
}

/**
 * Current weekday index (0 = Monday) and minutes-of-day in a timezone.
 */
export function nowIn(timezone) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'Europe/Zurich', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
  } catch {
    parts = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
  }
  const get = (t) => (parts.find((p) => p.type === t) || {}).value;
  const idx = DAY_INDEX[(get('weekday') || 'monday').toLowerCase()] ?? 0;
  return { idx, minutes: (Number(get('hour')) * 60) + Number(get('minute')) };
}

/**
 * Open/closed right now, given parsed days + timezone.
 * @returns {{open:boolean, today:object|null}}
 */
export function openStatus(days, timezone) {
  const { idx, minutes } = nowIn(timezone);
  const today = days.find((d) => d.idx === idx) || null;
  const open = !!today && today.ranges.some(([a, b]) => minutes >= a && minutes < b);
  return { open, today, todayIdx: idx };
}

/** Rotate parsed days so today comes first (live week-list order). */
export function rotateFromToday(days, todayIdx) {
  return [...days].sort((a, b) => ((a.idx - todayIdx + 7) % 7) - ((b.idx - todayIdx + 7) % 7));
}
