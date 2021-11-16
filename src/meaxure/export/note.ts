// Copyright 2020 Jebbs. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import { SMNote } from "../interfaces";
import { sketch } from "../../sketch";
import { toHTMLEncode, emojiToEntities } from "../helpers/helper";

export function makeNote(layer: Layer, artboard: Artboard): SMNote {
    if (!layer || layer.type != sketch.Types.Group || !layer.name.startsWith('#meaxure-')) return undefined;
    let textLayer: Text;
    let layers = layer.allSubLayers();
    for (let layer of layers) {
        if (layer.type == sketch.Types.Text) {
            textLayer = layer as Text;
            break;
        }
    }
    layer.hidden = true;
    return <SMNote>{
        rect: layer.frame.changeBasis({ from: layer.parent, to: artboard }),
        note: toHTMLEncode(emojiToEntities(textLayer.text)).replace(/\n/g, "<br>"),
    };
}