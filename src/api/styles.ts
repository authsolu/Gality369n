import { BorderData, FillData, SMShadow } from "./interfaces";
import { SMColor } from "./interfaces";
import { sketch } from "../sketch";


export function sharedTextStyle(
    document: Document,
    name: string,
    color: string,
    // alignment?: number
): SharedStyle {
    let sharedStyles = document.sharedTextStyles;
    let sharedStyle = sharedStyles.find(s => s.name == name);
    if (!sharedStyle) {
        let text = new sketch.Text({ text: 'temp' });
        let style = text.style;
        // style.alignment = alignment;
        style.textColor = color;
        style.fontSize = 12;
        sharedStyle = sketch.SharedStyle.fromStyle({ name: name, document: document, style: style });
        text.remove();
    }
    return sharedStyle;

}

export function sharedLayerStyle(document: Document, name, color: string, borderColor?: string): SharedStyle {
    let sharedStyle = document.sharedLayerStyles.find(s => s.name == name);

    if (!sharedStyle) {
        let tmp = new sketch.ShapePath({});
        let style = tmp.style;
        sketch.Style
        style.fills = [
            <Fill>{
                enabled: true,
                fillType: sketch.Style.FillType.Color,
                color: color,
            }
        ];
        if (borderColor) {
            style.borders = [
                <Border>{
                    enabled: true,
                    color: borderColor,
                    thickness: 1,
                    position: sketch.Style.BorderPosition.Inside,
                }
            ]
        }
        sharedStyle = sketch.SharedStyle.fromStyle({ name: name, document: document, style: style });
    }
    return sharedStyle;
}

export function getBordersFromStyle(style: Style): BorderData[] {
    let bordersData: BorderData[] = [];
    for (let border of style.borders) {
        if (!border.enabled) continue;
        let fillType = border.fillType;
        let borderData: BorderData = {
            fillType: fillType,
            position: border.position,
            thickness: border.thickness,
            color: <SMColor>{},
            gradient: <Gradient>{},
        };

        switch (fillType) {
            case sketch.Style.FillType.Color:
                borderData.color = parseColor(border.color);
                break;
            case sketch.Style.FillType.Gradient:
                borderData.gradient = border.gradient;
                break;
            default:
                continue;
        }
        bordersData.push(borderData);
    }
    return bordersData;
}
export function getFillsFromStyle(style: Style): FillData[] {
    let fillsData: FillData[] = [];
    for (let fill of style.fills) {
        if (!fill.enabled) continue;
        let fillType = fill.fillType,
            fillData = <FillData>{
                fillType: fillType,
                color: <SMColor>{},
                gradient: <Gradient>{}
            };

        switch (fillType) {
            case sketch.Style.FillType.Color:
                fillData.color = parseColor(fill.color);
                break;
            case sketch.Style.FillType.Gradient:
                fillData.gradient = fill.gradient;
                break;

            default:
                continue;
        }
        fillsData.push(fillData);
    }
    return fillsData;
}

export function getShadowsFromStyle(style: Style): SMShadow[] {
    let convertShadow = function (shadow: Shadow, type: "outer" | "inner") {
        return {
            type: type,
            offsetX: shadow.x,
            offsetY: shadow.y,
            blurRadius: shadow.blur,
            spread: shadow.spread,
            color: parseColor(shadow.color)
        };
    }
    return style.shadows.filter(s => s.enabled).map(s => convertShadow(s, 'outer')).concat(
        ...style.innerShadows.filter(s => s.enabled).map(s => convertShadow(s, 'inner'))
    );
}

export function parseColor(color: string): SMColor {
    let red = parseInt(color.substr(1, 2), 16);
    let green = parseInt(color.substr(3, 2), 16);
    let blue = parseInt(color.substr(5, 2), 16);
    let alpha = parseInt(color.substr(7, 2), 16);
    let colorUpperCase = color.toUpperCase();
    return {
        r: red,
        g: green,
        b: blue,
        a: alpha,
        "color-hex": colorUpperCase.substr(0, 7) + " " + Math.round(alpha / 255 * 100) + "%",
        "argb-hex": "#" + alpha.toString(16).toUpperCase() + colorUpperCase.substr(1, 6).replace("#", ""),
        "css-rgba": "rgba(" + [
            red,
            green,
            blue,
            (Math.round(alpha * 100) / 255)
        ].join(",") + ")",
        "ui-color": "(" + [
            "r:" + red.toFixed(2),
            "g:" + green.toFixed(2),
            "b:" + blue.toFixed(2),
            "a:" + alpha.toFixed(2)
        ].join(" ") + ")"
    };
}
export function getLayerRadius(layer: Layer): number[] {
    if (layer.type == sketch.Types.ShapePath) {
        return (layer as ShapePath).radius;
    }
    if (layer.layers && layer.layers.length && layer.layers[0].type == sketch.Types.ShapePath) {
        return (layer.layers[0] as ShapePath).radius;
    }
    return undefined;
}