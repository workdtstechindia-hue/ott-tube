/**
 * Format number to INR currency
 * @param {number} amount
 * @param {boolean} showSymbol
 * @returns {string}
 */
export const formatCurrency = (
  amount = 0,
  showSymbol = true
) => {
  if (typeof amount !== "number") return "₹0";

  const formatter = new Intl.NumberFormat("en-IN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "INR",
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};
