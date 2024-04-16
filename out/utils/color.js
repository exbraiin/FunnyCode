"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorUtils = void 0;
const vscode_1 = require("vscode");
class ColorUtils {
    constructor() { }
    static random() {
        return new vscode_1.Color(Math.random(), Math.random(), Math.random(), 1);
    }
    static randomGrayscale() {
        const v = 0.25 + Math.random() / 2;
        return new vscode_1.Color(v, v, v, 1);
    }
    static interted(color) {
        return new vscode_1.Color(1 - color.red, 1 - color.green, 1 - color.blue, color.alpha);
    }
    static saturated(color) {
        var r = color.red;
        var g = color.green;
        var b = color.blue;
        if (r < g && r < b) {
            r = 0;
            if (g > b)
                g = 1;
        }
        else if (g < b && g < r) {
            g = 0;
            if (r > b)
                r = 1;
        }
        else {
            b = 0;
            if (r > g)
                r = 1;
        }
        return new vscode_1.Color(r, g, b, 1);
    }
    static desaturated(color, f) {
        f = Math.min(Math.max(0, f), 1);
        const l = 0.3 * color.red + 0.6 * color.green + 0.1 * color.blue;
        const r = color.red + f * (l - color.red);
        const g = color.green + f * (l - color.green);
        const b = color.blue + f * (l - color.blue);
        return new vscode_1.Color(r, g, b, color.alpha);
    }
    static toHexCode(color) {
        const hr = Math.floor(color.red * 255).toString(16).padStart(2, '0');
        const hg = Math.floor(color.green * 255).toString(16).padStart(2, '0');
        const hb = Math.floor(color.blue * 255).toString(16).padStart(2, '0');
        return `#${hr}${hg}${hb}`;
    }
}
exports.ColorUtils = ColorUtils;
//# sourceMappingURL=color.js.map