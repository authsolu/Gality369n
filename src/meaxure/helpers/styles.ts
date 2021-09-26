import { BorderData, SMFillData, SMShadow, SMGradient, SMGradientStop } from "../interfaces";
import { SMColor } from "../interfaces";
import { sketch } from "../../sketch";

export function getBordersFromStyle(style: Style): BorderData[] {
    let bordersData: BorderData[] = [];
    for (let border of style.borders) {
        if (!border.enabled) continue;
        let fillType = border.fillType;
        let borderData: BorderData = {
            fillType: fillType,
            position: border.position,
            thickness: border.thickness,
            color: undefined,
            gradient: undefined,
        };

        switch (fillType) {
            case sketch.Style.FillType.Color:
                borderData.color = parseColor(border.color);
                break;
            case sketch.Style.FillType.Gradient:
                borderData.gradient = parseGradient(border.gradient);
                break;
            default:
                continue;
        }
        bordersData.push(borderData);
    }
    return bordersData;
}
export function getFillsFromStyle(style: Style): SMFillData[] {
    let fillsData: SMFillData[] = [];
    for (let fill of style.fills) {
        if (!fill.enabled) continue;
        let fillType = fill.fillType;
        let fillData = <SMFillData>{
            fillType: fillType,
            color: <SMColor>{},
            gradient: <SMGradient>{}
        };
        switch (fillType) {
            case sketch.Style.FillType.Color:
                fillData.color = parseColor(fill.color);
                break;
            case sketch.Style.FillType.Gradient:
                fillData.gradient = parseGradient(fill.gradient);
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

export function parseColor(rgbaHex: string): SMColor {
    let red = parseInt(rgbaHex.substr(1, 2), 16);
    let green = parseInt(rgbaHex.substr(3, 2), 16);
    let blue = parseInt(rgbaHex.substr(5, 2), 16);
    let alpha = parseInt(rgbaHex.substr(7, 2), 16);
    let colorUpperCase = rgbaHex.toUpperCase();
    return {
        r: red,
        g: green,
        b: blue,
        a: alpha,
        "color-hex": colorUpperCase.substr(0, 7) + " " + Math.round(alpha / 255 * 100) + "%",
        "argb-hex": "#" + alpha.toString(16).toUpperCase() + colorUpperCase.substr(1, 6).replace("#", ""),
        "rgba-hex": rgbaHex.toLocaleUpperCase(),
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

export function parseGradient(gradient: Gradient): SMGradient {
    return <SMGradient>{
        type: gradient.gradientType,
        from: gradient.from,
        to: gradient.to,
        colorStops: gradient.stops.map(s => {
            return <SMGradientStop>{
                position: s.position,
                color: parseColor(s.color)
            }
        }),
        aspectRatio: gradient.aspectRatio,
    }
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