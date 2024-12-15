// composables/useTimeFormatter.js
export default function useTimeFormatter() {
  /**
   * Format a time in seconds.milliseconds (e.g., 513.42) to mm:ss:MS
   * @param {string|number} timeValue - The time value to format
   * @returns {string} - The formatted time string (mm:ss:MS)
   */
  const formatTime = (timeValue) => {
    if (isNaN(timeValue)) return timeValue; // Return the original value if it's not a valid number

    const totalMilliseconds = parseFloat(timeValue) * 1000; // Convert to milliseconds
    const minutes = Math.floor(totalMilliseconds / 60000); // Extract minutes
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000); // Extract seconds
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10); // Extract centiseconds (MS)

    // Ensure two-digit formatting for seconds and milliseconds
    const formattedSeconds = seconds.toString().padStart(2, '0');
    const formattedMilliseconds = milliseconds.toString().padStart(2, '0');

    return `${minutes}:${formattedSeconds}.${formattedMilliseconds}`;
  };

  return { formatTime };
}
