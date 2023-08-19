/** Converts the time to milliseconds */
export const ms = (arg0: string | number | null): number => {
  if (!arg0) {
    return 0;
  }

  const getRegexMatch = (val: RegExp) => {
    const match = arg0.toString().match(val);
    if (!match) {
      throw new Error(`Invalid time format: ${arg0}`);
    }
    return match;
  };

  const arg = arg0.toString().trim();

  if (arg.includes('sec')) {
    const seconds = Number(arg.replace(/\D/g, ''));

    if (Number.isNaN(seconds)) {
      return 0;
    }

    const totalMs = seconds * 1000;

    return totalMs;
  }

  if (arg.includes('min')) {
    const minutes = Number(arg.replace(/\D/g, ''));

    if (Number.isNaN(minutes)) {
      return 0;
    }

    const seconds = 60;
    const totalMs = minutes * seconds * 1000;

    return totalMs;
  }

  const splittedFormat = arg.split(':');

  const getMilliseconds = (hours: number, minutes: number, seconds?: number, milliseconds?: number) => {
    const totalMs = (hours * 60 * 60 + minutes * 60 + +(seconds ?? 0)) * 1000 + (milliseconds ? +milliseconds : 0);

    return totalMs;
  };
  // hh:mm:ss
  if (splittedFormat.length === 3) {
    const regex = /(\d+):(\d+):(\d+)/;
    const [, hours, minutes, seconds] = getRegexMatch(regex);

    const milliseconds = getMilliseconds(+hours, +minutes, +seconds);

    return milliseconds;
  }

  // hh:mm
  if (splittedFormat.length === 2) {
    const regex = /(\d+):(\d+)/;
    const [, hours, minutes] = getRegexMatch(regex);

    const milliseconds = getMilliseconds(+hours, +minutes);

    return milliseconds;
  }

  const [, hours, minutes, seconds, milliseconds] = getRegexMatch(/(\d+):(\d+):(\d+)\.?(\d+)?/);

  const totalMs = getMilliseconds(+hours, +minutes, +seconds, +milliseconds);

  return totalMs;
};

export default ms;
