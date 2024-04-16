import { Color } from 'vscode';

export class ColorUtils {
    private constructor() { }

    static random(): Color {
        return new Color(Math.random(), Math.random(), Math.random(), 1);
    }

    static randomGrayscale(): Color {
        const v = 0.25 + Math.random() / 2;
        return new Color(v, v, v, 1);
    }

    static interted(color: Color): Color {
        return new Color(1 - color.red, 1 - color.green, 1 - color.blue, color.alpha);
    }

    static saturated(color: Color): Color {
        var r = color.red;
        var g = color.green;
        var b = color.blue;
        if (r < g && r < b) {
            r = 0;
            if (g > b) g = 1;

        } else if (g < b && g < r) {
            g = 0;
            if (r > b) r = 1;
        } else {
            b = 0;
            if (r > g) r = 1;
        }
        return new Color(r, g, b, 1);
    }

    static desaturated(color: Color, f: number): Color {
        f = Math.min(Math.max(0, f), 1);
        const l = 0.3 * color.red + 0.6 * color.green + 0.1 * color.blue;
        const r = color.red + f * (l - color.red);
        const g = color.green + f * (l - color.green);
        const b = color.blue + f * (l - color.blue);
        return new Color(r, g, b, color.alpha);
    }

    static toHexCode(color: Color): string {
        const hr = Math.floor(color.red * 255).toString(16).padStart(2, '0');
        const hg = Math.floor(color.green * 255).toString(16).padStart(2, '0');
        const hb = Math.floor(color.blue * 255).toString(16).padStart(2, '0');
        return `#${hr}${hg}${hb}`;
    }
}
