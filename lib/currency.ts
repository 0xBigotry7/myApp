export const conversionRates: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.27,
  JPY: 0.0067,
  CNY: 0.138,
  THB: 0.029,
  AUD: 0.66,
  CAD: 0.73,
  CHF: 1.13,
  HKD: 0.13,
  SGD: 0.74,
  KRW: 0.00075,
  MXN: 0.059,
  INR: 0.012,
  IDR: 0.000064,
  VND: 0.000064,
  PHP: 0.000041,
  MYR: 0.21,
  TWD: 0.032,
};

export const convertCurrency = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  const fromRate = conversionRates[from] || 1;
  const toRate = conversionRates[to] || 1;
  const amountInUSD = amount * fromRate;
  return amountInUSD / toRate;
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    THB: "฿",
    AUD: "A$",
    CAD: "C$",
    CHF: "Fr",
    HKD: "HK$",
    SGD: "S$",
    KRW: "₩",
    MXN: "Mex$",
    INR: "₹",
  };
  return symbols[currency] || currency;
};

