import { exportPanel } from "../../panels/exportPanel";
import { sketch } from "../../sketch";
import { localize } from "../../state/language";
import { context } from "../../state/context";
import { createWebviewPanel } from "../../webviewPanel";
import { toSlug, emojiToEntities } from "../../api/api";
import { toHTMLEncode, tik } from "../../api/helper";
import { writeFile, buildTemplate, exportImage } from "./files";
import { logger } from "../../api/logger";
import { ExportData, ArtboardData } from "../../api/interfaces";
import { getLayerData } from "./layerData";
import { clearSliceCache, getCollectedSlices } from "./slice";
import { clearMaskStack } from "./mask";
import { getDocumentColors } from "./colors";

export let tempCreatedLayers: Layer[] = [];
export let savePath: string;
export let assetsPath: string;

let exporting = false;
export async function exportSpecification() {
    if (exporting) {
        sketch.UI.message('Please wait for former task to exit.');
        return;
    }
    let results = await exportPanel();
    if (!results) return;
    if (results.selectionArtboards.length <= 0) return false;
    let document = sketch.Document.fromNative(context.document);
    savePath = sketch.UI.savePanel(
        localize("Export spec"),
        localize("Export to:"),
        localize("Export"),
        true,
        document.fileName
    );
    if (!savePath) return;
    assetsPath = savePath + "/assets";

    exporting = true;
    let stopWatch = tik();
    clearMaskStack();
    clearSliceCache();
    let processingPanel = createWebviewPanel({
        url: context.resourcesRoot + "/panel/processing.html",
        width: 304,
        height: 104,
    });
    processingPanel.onClose(() => cancelled = true);
    processingPanel.show();
    let onFinishCleanup = function () {
        for (let tmp of tempCreatedLayers) {
            if (tmp) tmp.remove();
        }
        tempCreatedLayers = [];
        exporting = false;
        processingPanel.close();
    }
    let template = NSString.stringWithContentsOfFile_encoding_error(context.resourcesRoot + "/template.html", 4, nil);
    let data: ExportData = {
        scale: context.configs.scale,
        unit: context.configs.units,
        colorFormat: context.configs.format,
        artboards: [],
        slices: [],
        colors: getDocumentColors(document)
    };

    let cancelled = false;
    let layerIndex = 0;
    for (let i = 0; i < results.selectionArtboards.length; i++) {
        let artboard = results.selectionArtboards[i];
        let page = artboard.parent as Page;
        let fileName = toSlug(page.name + ' ' + artboard.name);
        data.artboards[i] = <ArtboardData>{
            notes: [],
            layers: [],
        };
        data.artboards[i].pageName = toHTMLEncode(emojiToEntities(page.name));
        data.artboards[i].pageObjectID = page.id;
        data.artboards[i].name = toHTMLEncode(emojiToEntities(artboard.name));
        data.artboards[i].slug = fileName
        data.artboards[i].objectID = artboard.id;
        data.artboards[i].width = artboard.frame.width;
        data.artboards[i].height = artboard.frame.height;
        for (let layer of artboard.allSubLayers()) {
            layerIndex++;
            if (cancelled) {
                onFinishCleanup();
                sketch.UI.message('Cancelled by user.');
                return;
            }
            processingPanel.postMessage('process', {
                percentage: Math.round(layerIndex / results.allCount * 100),
                text: localize("Processing layer %@ of %@", [layerIndex, results.allCount])
            });
            let taskError: Error;
            await getLayerTask(artboard, layer, data.artboards[i], results.byInfluence)
                .catch(err => taskError = err);
            if (taskError) {
                onFinishCleanup();
                logger.error(taskError);
                return;
            }
        }
        if (results.advancedMode) {
            exportArtboardAdvanced(artboard, data.artboards[i], savePath, i);
        }
        else {
            exportArtboard(artboard, data.artboards[i], savePath, template);
        }
    }
    data.slices = getCollectedSlices();

    let selectingPath = savePath;
    if (results.advancedMode) {
        writeFile({
            content: buildTemplate(template, {
                lang: context.languageData,
                data: JSON.stringify(data)
            }),
            path: savePath,
            fileName: "index.html"
        });
        selectingPath = savePath + "/index.html";
    }
    onFinishCleanup();
    NSWorkspace.sharedWorkspace().activateFileViewerSelectingURLs([NSURL.fileURLWithPath(selectingPath)]);
    sketch.UI.message(localize("Export complete! Takes %s seconds", [stopWatch.tok() / 1000]));
}

function getLayerTask(artboard: Artboard, layer: Layer, data: ArtboardData, byInfluence: boolean, symbolLayer?: Layer): Promise<boolean> {
    return new Promise<true>((resolve, reject) => {
        try {
            getLayerData(artboard, layer, data, byInfluence, symbolLayer)
        } catch (error) {
            reject(error)
        }
        resolve(true);
    });
}

function exportArtboardAdvanced(artboard: Artboard, data: ArtboardData, savePath: string, index: number) {
    // data.artboards[artboardIndex].imagePath = "preview/" + objectID + ".png";
    data.imagePath = "preview/" + encodeURI(data.slug) + ".png";

    exportImage(artboard, {
        format: 'png',
        scale: 2,
    }, savePath + "/preview", data.slug);

    writeFile({
        content: "<meta http-equiv=\"refresh\" content=\"0;url=../index.html#artboard" + index + "\">",
        path: savePath + "/links",
        fileName: data.slug + ".html"
    });
}

function exportArtboard(artboard: Artboard, data: ArtboardData, savePath: string, template: string) {
    let imageURL = NSURL.fileURLWithPath(
        exportImage(
            artboard,
            {
                format: 'png',
                scale: 2,
            }, savePath, data.objectID
        )
    );
    let imageData = NSData.dataWithContentsOfURL(imageURL);
    let imageBase64 = imageData.base64EncodedStringWithOptions(0);
    data.imageBase64 = 'data:image/png;base64,' + imageBase64;

    let newData = JSON.parse(JSON.stringify(data));
    newData.artboards = [data];

    writeFile({
        content: buildTemplate(template, {
            lang: context.languageData,
            data: JSON.stringify(newData)
        }),
        path: savePath,
        fileName: data.slug + ".html"
    });
}
