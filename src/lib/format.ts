// Shared formatting for money, areas and dates (Philippine conventions).

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const pesoExact = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const number = new Intl.NumberFormat("en-PH");

/** ₱1,500,000 */
export const formatPeso = (n: number) => peso.format(n);
/** ₱1,500,000.50 */
export const formatPesoExact = (n: number) => pesoExact.format(n);
/** 4,560 */
export const formatNumber = (n: number) => number.format(n);

export const TIME_ZONE = "Asia/Manila";

/** Friday, 27 November 2026 */
export const formatLongDate = (d: Date) =>
  d.toLocaleDateString("en-PH", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });

/** Mon, 30 Nov */
export const formatShortDate = (d: Date) =>
  d.toLocaleDateString("en-PH", { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE });
