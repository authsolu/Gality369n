import { sketch } from ".";
import { alignLayers, alignLayersByPosition } from "./alignment";
import { LayerAlignment, LayerVerticalAlignment } from "./alignment";
import { getResizingConstraint, setResizingConstraint } from "./resizingConstraint";

declare module 'sketch/sketch' {
    namespace _Sketch {
        interface Layer {
            frameInfluence: Rectangle;
            shouldBreakMaskChain: boolean;
            hasClippingMask: boolean;
            CSSAttributes: string[];
            resizingConstraint: number;
            allSubLayers(): Layer[];
            alignTo(
                layer: Layer,
                horizontal?: { from: LayerAlignment, to: LayerAlignment } | boolean,
                vertical?: { from: LayerVerticalAlignment, to: LayerVerticalAlignment } | boolean
            ): void;
            alignToByPostion(layer: Layer, position: LayerAlignment | LayerVerticalAlignment): void;
        }
    }
}

export function extendLayer() {
    let target = sketch.Layer.prototype
    Object.defineProperty(target, "frameInfluence", {
        get: function () {
            // TODO: frameInfluence should base on its parent
            let root: Artboard | Page;
            if ((this as Layer).type == sketch.Types.Artboard || (this as Layer).type == sketch.Types.Page) {
                root = this;
            } else {
                root = (this as Layer).getParentArtboard() || (this as Layer).getParentPage();
            }
            let artboardRect = root.sketchObject.absoluteRect().rect();
            let influenceCGRect = this.sketchObject.absoluteInfluenceRect();
            return new sketch.Rectangle(
                influenceCGRect.origin.x - artboardRect.origin.x,
                influenceCGRect.origin.y - artboardRect.origin.y,
                influenceCGRect.size.width,
                influenceCGRect.size.height,
            );
        }
    });
    Object.defineProperty(target, "shouldBreakMaskChain", {
        get: function (): boolean {
            return !!this.sketchObject.shouldBreakMaskChain();
        }
    });
    Object.defineProperty(target, "hasClippingMask", {
        get: function (): boolean {
            return !!this.sketchObject.hasClippingMask();
        }
    });
    Object.defineProperty(target, "CSSAttributes", {
        get: function () {
            let layerCSSAttributes = this.sketchObject.CSSAttributes();
            let css = [];
            for (let i = 0; i < layerCSSAttributes.count(); i++) {
                let attribute = new String(layerCSSAttributes[i]).toString();
                css.push(attribute);
            }
            return css;
        }
    });
    Object.defineProperty(target, "resizingConstraint", {
        get: function (): number {
            return getResizingConstraint(this);
        },
        set: function (value: number) {
            setResizingConstraint(this, value);
        }
    });
    target.allSubLayers = function (): Layer[] {
        let layers: Layer[] = [];
        // // fromNative Layers do not have the property 'type'
        // let layerObject: any;
        // let layerObjects = this.sketchObject.children().objectEnumerator();
        // while (layerObject = layerObjects.nextObject()) {
        //     layers.push(sketch.Layer.fromNative(layerObject))
        // }
        enumLayers(this);
        function enumLayers(layer: Layer) {
            layers.push(layer)
            if (layer.layers) {
                layer.layers.forEach(l => enumLayers(l));
            }
        }
        return layers;
    }
    target.alignTo = function (
        layer: Layer,
        horizontal?: { from: LayerAlignment, to: LayerAlignment } | boolean,
        vertical?: { from: LayerVerticalAlignment, to: LayerVerticalAlignment } | boolean
    ) {
        alignLayers(this, layer, horizontal, vertical);
    };
    target.alignToByPostion = function (layer: Layer, position: LayerAlignment | LayerVerticalAlignment) {
        alignLayersByPosition(this, layer, position);
    };
}
