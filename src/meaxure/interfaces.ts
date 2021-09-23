export interface LayerStates {
    isVisible: boolean,
    isLocked: boolean,
    hasSlice: boolean,
    isMeaXure: boolean,
    isEmptyText: boolean,
    isInShapeGroup: boolean,
}
export interface SMRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface SMColor {
    r: number;
    g: number;
    b: number;
    a: number;
    "color-hex": string;
    "argb-hex": string;
    "rgba-hex": string;
    "css-rgba": string;
    "ui-color": string;
}
export interface BorderData {
    fillType: FillType,
    position: BorderPosition,
    thickness: number,
    color: SMColor,
    gradient: SMGradient,
}
export interface SMGradientStop {
    position: number,
    color: SMColor,
}
export interface SMGradient {
    /** The type of the Gradient. */
    type: GradientType;
    /** The position of the start of the Gradient */
    from: Point;
    /** The position of the end of the Gradient. */
    to: Point;
    /**
     * When the gradient is Radial, the from and 
     * to points makes one axis of the ellipse of 
     * the gradient while the aspect ratio 
     * determine the length of the orthogonal 
     * axis (aspectRatio === 1 means that it’s a circle).
     */
    aspectRatio: number;
    /** The different stops of the Gradient */
    colorStops: SMGradientStop[];
}
export interface SMFillData {
    fillType: FillType,
    color: SMColor,
    gradient: SMGradient,
}

export type SMType = "text" | "symbol" | "slice" | "shape";
export interface LayerData {
    // shared
    objectID: string,
    type: SMType,
    name: string,
    rect: SMRect,
    // slice
    rotation: number,
    radius: number[],
    borders: BorderData[],
    fills: SMFillData[],
    shadows: SMShadow[],
    opacity: number,
    styleName: string,
    // text
    content: string,
    color: SMColor,
    fontSize: number,
    fontFace: string,
    textAlign: Alignment,
    letterSpacing: number,
    lineHeight: number,
    // slice
    exportable: SMExportable[],
    // css
    css: string[],
}
export interface SMNote { rect: SMRect, note: string }
export interface ArtboardData {
    // artboard: Artboard,
    pageName: string,
    pageObjectID: string,
    name: string,
    slug: string,
    objectID: string,
    width: number,
    height: number,
    imagePath?: string,
    imageBase64?: string,
    notes: SMNote[],
    layers: LayerData[],
}
export interface ExportData {
    scale: number,
    unit: string,
    colorFormat: string,
    artboards: ArtboardData[],
    slices: any[],
    colors: any[]
}

export interface SMExportFormat {
    format: string,
    scale: number,
    prefix?: string,
    suffix?: string,
}
export interface SMShadow {
    type: "outer" | "inner",
    offsetX: number,
    offsetY: number,
    blurRadius: number,
    spread: number,
    color: SMColor,
}
export interface SMExportable {
    name: string,
    format: string,
    path: string,
}