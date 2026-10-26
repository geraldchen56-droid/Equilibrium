// Exact rational arithmetic so equilibria print as 2/3, not 0.6666667.

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export class Fraction {
  readonly n: number;
  readonly d: number;

  constructor(n: number, d = 1) {
    if (d === 0) throw new Error("Fraction: zero denominator");
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      // Accept decimals like 0.5 by scaling.
      const scale = 10 ** Math.max(decimals(n), decimals(d));
      n = Math.round(n * scale);
      d = Math.round(d * scale);
    }
    const g = gcd(n, d);
    const sign = d < 0 ? -1 : 1;
    this.n = (sign * n) / g;
    this.d = (sign * d) / g;
  }

  static of(x: number | Fraction): Fraction {
    return x instanceof Fraction ? x : new Fraction(x);
  }

  add(o: Fraction | number) { const b = Fraction.of(o); return new Fraction(this.n * b.d + b.n * this.d, this.d * b.d); }
  sub(o: Fraction | number) { const b = Fraction.of(o); return new Fraction(this.n * b.d - b.n * this.d, this.d * b.d); }
  mul(o: Fraction | number) { const b = Fraction.of(o); return new Fraction(this.n * b.n, this.d * b.d); }
  div(o: Fraction | number) { const b = Fraction.of(o); return new Fraction(this.n * b.d, this.d * b.n); }
  neg() { return new Fraction(-this.n, this.d); }

  cmp(o: Fraction | number): number { const b = Fraction.of(o); return Math.sign(this.n * b.d - b.n * this.d); }
  eq(o: Fraction | number) { return this.cmp(o) === 0; }
  gt(o: Fraction | number) { return this.cmp(o) > 0; }
  lt(o: Fraction | number) { return this.cmp(o) < 0; }
  gte(o: Fraction | number) { return this.cmp(o) >= 0; }

  isZero() { return this.n === 0; }
  valueOf() { return this.n / this.d; }
  toString() { return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`; }
}

function decimals(x: number): number {
  const s = String(x);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

export const F = (n: number, d = 1) => new Fraction(n, d);
