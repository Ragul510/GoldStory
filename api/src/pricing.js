const r2 = (n) => Math.round(n * 100) / 100;

/** The ONLY place prices are calculated. The browser never sends a price. */
export function buildQuote(product, purity, engraving, rates) {
    if (!product.purities.includes(purity)) {
        return { error: 'purity_not_supported' };
    }

    // Select gold rate based on purity
    const rateMap = {
        '18K': rates.rate18,
        '22K': rates.rate22,
        '24K': rates.rate24,
    };

    const rate = Number(rateMap[purity]);

    if (!(rate > 0)) {
        return { error: 'rates_not_set' };
    }

    // Add engraving weight if applicable
    const weight = r2(
        product.weightG + (engraving ? 0.3 : 0)
    );

    // Gold price
    const gold = weight * rate;

    // Making charges (% of gold price)
    const making = (gold * Number(rates.making)) / 100;

    // Tax (% applied to gold + making charges)
    const taxableAmount = gold + making;
    const tax = (taxableAmount * Number(rates.tax)) / 100;

    // Shipping
    const shipping = Number(rates.shipping);

    // Final price
    const total = gold + making + tax + shipping;

    return {
        purity,
        weight,
        rate,

        gold: r2(gold),
        making: r2(making),
        tax: r2(tax),
        shipping: r2(shipping),
        total: r2(total),

        currency: 'INR',
        estimate: true,
        ratesUpdatedAt: rates.updated_at,
    };
}