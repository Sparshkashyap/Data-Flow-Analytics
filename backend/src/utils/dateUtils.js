function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeDate(value) {
  if (!value || value === 'null' || value === 'undefined') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function differenceInDays(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end - start) / msPerDay);
}

module.exports = { toNumber, safeDate, differenceInDays };
