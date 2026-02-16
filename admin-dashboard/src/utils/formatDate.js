/**
 * Format ISO date string into readable format
 * @param {string} date
 * @param {object} options
 * @returns {string}
 */
export const formatDate = (
  date,
  options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
) => {
  if (!date) return "-";

  try {
    return new Intl.DateTimeFormat(
      "en-IN",
      options
    ).format(new Date(date));
  } catch {
    return "-";
  }
};
