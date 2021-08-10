import { context } from "../state/context";
import { getRect, is, toJSString } from "./api";
import { SMRect } from "./interfaces-deprecated";

export function extend(options, target) {
    target = target || this;

    for (let key in options) {
        target[key] = options[key];
    }
    return target;
}

export function mathHalf(number) {
    return Math.round(number / 2);
}
export function convertUnit(value, isText?, percentageType?) {
    if (value instanceof Array) {
        let units = context.configs.units.split("/"),
            unit = units[0];

        if (units.length > 1 && isText) {
            unit = units[1];
        }

        let scale = context.configs.scale;
        let tempValues = [];

        value.forEach(function (element) {
            tempValues.push(Math.round(element / scale * 10) / 10);
        });

        return tempValues.join(unit + ' ') + unit;

    } else {

        if (percentageType && context.artboard) {
            let artboardRect = getRect(context.artboard);
            if (percentageType == "width") {
                return Math.round((value / artboardRect.width) * 1000) / 10 + "%";
            } else if (percentageType == "height") {
                return Math.round((value / artboardRect.height) * 1000) / 10 + "%";
            }
        }

        let val = Math.round(value / context.configs.scale * 10) / 10,
            units: string[] = context.configs.units.split("/"),
            unit = units[0];

        if (units.length > 1 && isText) {
            unit = units[1];
        }

        return val + unit;
    }

}
export function toHex(c) {
    let hex = Math.round(c).toString(16).toUpperCase();
    return hex.length == 1 ? "0" + hex : hex;
}
export function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
export function isIntersect(a: SMRect, b: SMRect) {
    return isIntersectX(a, b) && isIntersectY(a, b);
}
export function isIntersectX(a: SMRect, b: SMRect) {
    return (a.x >= b.x && a.x <= b.x + b.width) || //left board of a in x range of b
        (a.x + a.width >= b.x && a.x + a.width <= b.x + b.width) || //right board of a in x range of b
        (a.x < b.x && a.x + a.width > b.x + b.width)  // x range of a includes b's
}
export function isIntersectY(a: SMRect, b: SMRect) {
    return (a.y >= b.y && a.y <= b.y + b.height) || //top board of a in y range of b
        (a.y + a.height >= b.y && a.y + a.height <= b.y + b.height) || //bottom board of a in y range of b
        (a.y < b.y && a.y + a.height > b.y + b.height); // y range of a includes b's
}
export function getDistance(targetRect, containerRect?) {
    containerRect = containerRect || getRect(context.current);

    return {
        top: (targetRect.y - containerRect.y),
        right: (containerRect.maxX - targetRect.maxX),
        bottom: (containerRect.maxY - targetRect.maxY),
        left: (targetRect.x - containerRect.x),
    }
}
export function find(format, container?, returnArray?) {
    if (!format || !format.key || !format.match) {
        return false;
    }
    container = container || context.current;
    let predicate = NSPredicate.predicateWithFormat(format.key, format.match),
        items;

    if (container.pages) {
        items = container.pages();
    } else if (is(container, MSSharedStyleContainer) || is(container, MSSharedTextStyleContainer)) {
        items = container.objectsSortedByName();
    } else if (container.children) {
        items = container.children();
    } else {
        items = container;
    }

    let queryResult = items.filteredArrayUsingPredicate(predicate);

    if (returnArray) return queryResult;

    if (queryResult.count() == 1) {
        return queryResult[0];
    } else if (queryResult.count() > 0) {
        return queryResult;
    } else {
        return false;
    }
}
export function toHTMLEncode(str) {
    return toJSString(str)
        .replace(/\</g, "&lt;")
        .replace(/\>/g, '&gt;')
        .replace(/\'/g, "&#39;")
        .replace(/\"/g, "&quot;")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029")
        .replace(/\ud83c|\ud83d/g, "");
    // return str.replace(/\&/g, "&amp;").replace(/\"/g, "&quot;").replace(/\'/g, "&#39;").replace(/\</g, "&lt;").replace(/\>/g, '&gt;');
}

export function deepEqual(x, y) {
    if (x === y) {
        return true;
    }
    if (!(typeof x == "object" && x != null) || !(typeof y == "object" && y != null)) {
        return false;
    }
    if (Object.keys(x).length != Object.keys(y).length) {
        return false;
    }
    for (let prop in x) {
        if (y.hasOwnProperty(prop)) {
            if (!deepEqual(x[prop], y[prop])) {
                return false;
            }
        } else {
            return false;
        }
    }
    return true;
}
export function openURL(url) {
    let nsurl = NSURL.URLWithString(url);
    NSWorkspace.sharedWorkspace().openURL(nsurl);
}

export function tik() {
    let start = Date.now();
    return {
        tok: function () {
            return Date.now() - start;
        }
    }
}