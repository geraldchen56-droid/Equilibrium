// Chapter 8: hidden information. Akerlof's lemons and Spence's job-market signal.

/**
 * Lemons: car quality q is uniform on [0, 1]; a seller values the car at q, a buyer at k * q.
 * At price p only owners with q <= p sell, so the average car on offer has quality p / 2.
 */
export function lemons(p: number, k: number) {
  const offered = Math.min(1, Math.max(0, p));        // share of cars offered
  const avgQuality = offered / 2;
  const buyerValue = k * avgQuality;
  return { offered, avgQuality, buyerValue, buyerProfit: buyerValue - p };
}

/** With uniform quality, trade at any positive price is worthwhile for buyers only if k >= 2. */
export const lemonsTradeSurvives = (k: number) => k >= 2;

/** Highest price a buyer will pay (break-even): k p / 2 >= p fails for every p > 0 when k < 2. */
export const lemonsMaxPrice = (k: number) => (k >= 2 ? 1 : 0);

/**
 * Spence: two types of worker. Employers pay `wageGap` more to anyone they believe is high-ability.
 * A unit of education costs costHigh for able workers and costLow (> costHigh) for the rest.
 * In a separating equilibrium the able get e*, the rest get 0, and neither wants to mimic the other:
 *   low type won't copy:  wageGap <= costLow  * e*
 *   high type will pay:   wageGap >= costHigh * e*
 */
export function spenceRange(wageGap: number, costHigh: number, costLow: number) {
  const lo = wageGap / costLow, hi = wageGap / costHigh;
  return { lo, hi, exists: costLow > costHigh };
}

export function spenceCheck(e: number, wageGap: number, costHigh: number, costLow: number) {
  const highPays = wageGap - costHigh * e >= 0;
  const lowStaysOut = wageGap - costLow * e <= 0;
  return { highPays, lowStaysOut, separating: highPays && lowStaysOut, highNet: wageGap - costHigh * e, lowNetIfMimic: wageGap - costLow * e };
}

/** The intuitive criterion selects the cheapest separating signal. */
export const leastCostSignal = (wageGap: number, costLow: number) => wageGap / costLow;
