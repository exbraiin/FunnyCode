export class CubicCurve {
    static readonly ease = new CubicCurve(0.25, 0.1, 0.25, 1.0);
    static readonly easeInBack = new CubicCurve(0.6, -0.28, 0.735, 0.045);

    private a: number;
    private b: number;
    private c: number;
    private d: number;
    private _cubicErrorBound: number = 0.001;

    constructor(a: number, b: number, c: number, d: number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    public transform(t: number): number {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        return this.transformInternal(t);
    }

    private evaluateCubic(a: number, b: number, m: number): number {
        return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
    }

    private transformInternal(t: number): number {
        let start = 0.0;
        let end = 1.0;
        while (true) {
            let midpoint = (start + end) / 2;
            let estimate = this.evaluateCubic(this.a, this.c, midpoint);
            let abs = Math.abs(t - estimate);
            if (abs < this._cubicErrorBound) {
                return this.evaluateCubic(this.b, this.d, midpoint);
            }
            if (estimate < t) {
                start = midpoint;
            } else {
                end = midpoint;
            }
        }
    }
}