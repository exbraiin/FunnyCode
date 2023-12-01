"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubicCurve = void 0;
class CubicCurve {
    static ease = new CubicCurve(0.25, 0.1, 0.25, 1.0);
    static easeInBack = new CubicCurve(0.6, -0.28, 0.735, 0.045);
    a;
    b;
    c;
    d;
    _cubicErrorBound = 0.001;
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    transform(t) {
        if (t <= 0)
            return 0;
        if (t >= 1)
            return 1;
        return this.transformInternal(t);
    }
    evaluateCubic(a, b, m) {
        return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
    }
    transformInternal(t) {
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
            }
            else {
                end = midpoint;
            }
        }
    }
}
exports.CubicCurve = CubicCurve;
//# sourceMappingURL=cubic_curve.js.map