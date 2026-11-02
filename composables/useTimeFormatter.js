// composables/useTimeFormatter.js
export default function useTimeFormatter() {
  /**
   * Format a time in seconds (e.g. 513.42) as m:ss.cc ("8:33.42").
   *
   * - No time at all (null, undefined, '', NaN) gives ''.
   * - 0 or less also gives '': no race lasts zero seconds, and the KNRB (foys) uses 0 for a crew
   *   without a time (did not start or did not finish), like it uses null.
   * - A value that is not a number, such as an already formatted "8:35.309", is returned as is.
   * @param {string|number|null|undefined} timeValue
   * @returns {string}
   */
  const formatTime = (timeValue) => {
    if (timeValue === null || timeValue === undefined) return '';
    if (typeof timeValue === 'string' && timeValue.trim() === '') return '';
    if (isNaN(timeValue)) return typeof timeValue === 'number' ? '' : timeValue;

    const seconds = parseFloat(timeValue);
    if (!Number.isFinite(seconds) || seconds <= 0) return '';

    const totalMilliseconds = Math.round(seconds * 1000); // rounding removes float noise (513.42 * 1000)
    const minutes = Math.floor(totalMilliseconds / 60000);
    const wholeSeconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const hundredths = Math.floor((totalMilliseconds % 1000) / 10);

    return `${minutes}:${String(wholeSeconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  return { formatTime };
}
