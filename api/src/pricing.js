const r2 = (n) => Math.round(n * 100) / 100;

/** The ONLY place prices are calculated. The browser never sends a price. */
export function buildQuote(product, purity, engraving, rates) {
  if (!product.purities.includes(purity)) return { error: 'purity_not_supported' };
  const rate = purity === '24K' ? rates.rate24 : rates.rate22;
  if (!(rate > 0)) return { error: 'rates_not_set' };
  const weight = r2(product.weightG + (engraving ? 0.3 : 0));
  const gold = weight * rate;
  const making = (gold * rates.making) / 100;
  const shipping = rates.shipping;
  return {
    purity, weight, rate, gold: r2(gold), making: r2(making),
    tax: r2(tax), shipping: r2(shipping), total: r2(gold + making + tax + shipping),
    currency: 'INR', estimate: true, ratesUpdatedAt: rates.updated_at,
  };
}
