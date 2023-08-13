/** Converts the time to milliseconds */
export const ms = (arg0: string | number | null): number => {
  if (!arg0) {
    return 0;
  }
  const regex = /(\d+):(\d+):(\d+)\.?(\d+)?/;
  const match = arg0.toString().match(regex);
  if (!match) {
    throw new Error(`Invalid time format: ${arg0}`);
  }

  const [, hours, minutes, seconds, milliseconds] = match;
  const totalMs = (+hours * 60 * 60 + +minutes * 60 + +seconds) * 1000 + (milliseconds ? +milliseconds : 0);

  return totalMs;
};

export default ms;
