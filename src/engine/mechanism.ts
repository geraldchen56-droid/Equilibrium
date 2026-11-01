// Chapter 11: designing rules so that truth-telling is a best response.
// Public project: n people, the project costs `cost`; each person i reports a value.

export interface ProjectOutcome {
  built: boolean;
  /** What each person pays (cost share plus any tax). */
  pay: number[];
  /** Pivot taxes (Clarke) or 0. */
  tax: number[];
}

/**
 * Naive rule: build if reports cover the cost, and split the cost in proportion to reports.
 * Saying less lowers your bill, so people shade their reports and good projects die.
 */
export function proportionalRule(reports: number[], cost: number): ProjectOutcome {
  const total = reports.reduce((a, b) => a + b, 0);
  const built = total >= cost && total > 0;
  return { built, pay: reports.map((r) => (built ? (cost * r) / total : 0)), tax: reports.map(() => 0) };
}

/**
 * Clarke pivot (a VCG mechanism): everyone owes an equal share cost/n if it's built.
 * Build if total reported net value (report - share) is non-negative. A person whose report flips
 * the decision pays a tax equal to the net harm that flip does to everyone else.
 */
export function clarkeRule(reports: number[], cost: number): ProjectOutcome {
  const n = reports.length, share = cost / n;
  const net = reports.map((r) => r - share);
  const total = net.reduce((a, b) => a + b, 0);
  const built = total >= 0;
  const tax = net.map((ni) => {
    const others = total - ni;
    const builtWithout = others >= 0;
    return builtWithout === built ? 0 : Math.abs(others);
  });
  return { built, pay: tax.map((t) => (built ? share : 0) + t), tax };
}

/** A person's utility from an outcome given their TRUE value. */
export const utility = (o: ProjectOutcome, i: number, trueValue: number) => (o.built ? trueValue : 0) - o.pay[i];
