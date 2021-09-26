import { localize } from "./common/language";
import { convertUnit } from "./helpers/helper";
import { propertiesPanel } from "./panels/propertiesPanel";
import { context } from "./common/context";
import { sketch } from "../sketch";
import { parseColor, getFillsFromStyle, getBordersFromStyle, getLayerRadius, getShadowsFromStyle } from "./helpers/styles";
import { SMFillData, SMShadow } from "./interfaces";
import { createBubble } from "./helpers/elements";
import { Edge, EdgeVertical } from "../sketch/layer/alignment";
import { applyTintToSMColor, applyTintToSMGradient } from "./export/tint";

export async function markProperties(position: Edge | EdgeVertical) {
    let selection = context.selection;
    if (selection.length <= 0) {
        sketch.UI.message(localize("Select a layer to mark!"));
        return false;
    }
    if (!(await propertiesPanel()))
        return false;
    for (let target of selection.layers) {
        properties({
            target: target,
            placement: position,
            properties: context.configs.properties
        });
    }
}

export function markPropertiesAll() {
    let selection = context.selection.layers;

    if (selection.length <= 0) {
        sketch.UI.message(localize("Select a layer to mark!"));
        return false;
    }

    for (let target of selection) {
        properties({
            target: target,
            placement: Edge.right,
            properties: ["layer-name", "color", "border", "opacity", "radius", "shadow", "font-size", "font-face", "character", "line-height", "paragraph", "style-name"]
        });
    }
}

function properties(options: { target: Layer, placement: Edge | EdgeVertical, properties?: string[], content?: string }) {
    options = Object.assign({
        placement: "top",
        properties: ["layer-name", "color", "border", "opacity", "radius", "shadow", "font-size", "line-height", "font-face", "character", "paragraph", "style-name"]
    }, options);
    let target = options.target;

    let name = "#properties-" + target.id;

    let artboard = target.getParentArtboard();
    let root = artboard || target.getParentPage();
    if (artboard) sketch.find<Group>(
        `Group, [name="${name}"]`,
        artboard
    ).forEach(g => g.remove());

    let bubble = createBubble(
        options.content || getProperties(target, options.properties),
        {
            name: name,
            parent: root,
            foreground: context.meaxureStyles.property.foreground,
            background: context.meaxureStyles.property.background,
            bubblePosition: options.placement,
        }
    )
    bubble.alignToByPostion(target, options.placement)
}

function findTint(layer: Layer): Fill {
    let tint: Fill;
    let parent = layer.parent;
    while (parent && parent.type !== sketch.Types.Artboard && parent.type !== sketch.Types.Page) {
        if (parent.style && parent.style.fills && parent.style.fills.length) {
            let fills = parent.style.fills.filter(f => f.enabled);
            if (!fills.length) continue;
            tint = fills[0];
        }
        parent = parent.parent;
    }
    return tint;
}

function getProperties(target: Layer, properties: string[]): string {
    let targetStyle = target.style;
    let elements = properties.map((property) => {
        switch (property) {
            case "color":
                let tint = findTint(target);
                if (target.type == sketch.Types.Text) {
                    let color = parseColor(targetStyle.textColor);
                    if (tint) color = applyTintToSMColor(color, tint.color);
                    return "color: " + color[context.configs.format];
                } else {
                    let fills = getFillsFromStyle(targetStyle);
                    if (fills.length <= 0) return undefined;
                    // TODO: support multiple fills
                    let fill = fills.pop();
                    if (tint) {
                        if (fill.fillType == sketch.Style.FillType.Color) {
                            fill.color = applyTintToSMColor(fill.color, tint.color);
                        } else if (fill.fillType == sketch.Style.FillType.Gradient) {
                            fill.gradient = applyTintToSMGradient(fill.gradient, tint.color);
                        }
                    }
                    return "fill: " + fillTypeContent(fill);
                }
            case "border":
                let bordersJSON = getBordersFromStyle(targetStyle);
                if (bordersJSON.length <= 0) return undefined;
                let borderJSON = bordersJSON.pop();
                return "border: " + convertUnit(borderJSON.thickness) + " " + borderJSON.position + "\r\n * " + fillTypeContent(borderJSON);
            case "opacity":
                return "opacity: " + Math.round(targetStyle.opacity * 100) + "%";
            case "radius":
                if (
                    target.type == sketch.Types.ShapePath ||
                    (target.type == sketch.Types.Group && target.layers[0].type == sketch.Types.ShapePath)
                ) {
                    return "radius: " + convertUnit(getLayerRadius(target));
                }
            case "shadow":
                let results = [];
                let shadows = getShadowsFromStyle(targetStyle);
                let innerShadow = shadows.filter(s => s.type == 'inner')[0];
                let outerShadow = shadows.filter(s => s.type == 'outer')[0];
                if (outerShadow) {
                    results.push("shadow: outer\r\n" + shadowContent(outerShadow));
                }
                if (innerShadow) {
                    results.push("shadow: inner\r\n" + shadowContent(innerShadow));
                }
                return results.join('\n');
            case "font-size":
                if (target.type != sketch.Types.Text) return undefined;
                return "font-size: " + convertUnit(targetStyle.fontSize, true);
            case "line-height":
                if (target.type != sketch.Types.Text) return undefined;
                let lineHeight = targetStyle.lineHeight;
                if (!lineHeight) return undefined;
                return "line: " + convertUnit(lineHeight, true) + " (" + Math.round(lineHeight / targetStyle.fontSize * 10) / 10 + ")";
            case "font-face":
                if (target.type != sketch.Types.Text) return undefined;
                return "font-face: " + targetStyle.fontFamily;
            case "character":
                if (target.type != sketch.Types.Text) return undefined;
                return "character: " + convertUnit(targetStyle.kerning, true);
            case "paragraph":
                if (target.type != sketch.Types.Text) return undefined;
                return "paragraph: " + convertUnit(targetStyle.paragraphSpacing, true);
            case "style-name":
                let sharedStyle = (target as Group).sharedStyle;
                if (sharedStyle) return "style-name: " + sharedStyle.name;
                break;
            case "layer-name":
                return "layer-name: " + target.name;
            default:
                break;
        }
    });
    return elements.filter(e => !!e).join('\n');
}

function fillTypeContent(fillJSON: SMFillData) {
    if (fillJSON.fillType == "Color") {
        return fillJSON.color[context.configs.format];
    }

    if (fillJSON.fillType == "Gradient") {
        let fc = [];
        fc.push(fillJSON.gradient.type)
        fillJSON.gradient.colorStops.forEach(function (stop) {
            fc.push(" " + Math.round(stop.position * 100) + "%: " + stop.color[context.configs.format]);
        });
        return fc.join("\n");
    }
}
function shadowContent(shadow: SMShadow) {
    let sc = [];
    sc.push(" * x, y - " + convertUnit(shadow.offsetX) + ", " + convertUnit(shadow.offsetY));
    if (shadow.blurRadius) sc.push(" * blur - " + convertUnit(shadow.blurRadius));
    if (shadow.spread) sc.push(" * spread - " + convertUnit(shadow.spread));
    return sc.join("\r\n")
}
