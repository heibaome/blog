import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = createDOMPurify(window as any);

/**
 * SVG 安全白名单标签
 * 仅保留绘图相关的 SVG 元素
 */
const SVG_ALLOWED_TAGS = [
  "svg", "g", "defs", "symbol", "use",
  "path", "circle", "ellipse", "line", "polyline", "polygon", "rect",
  "text", "tspan", "textPath",
  "linearGradient", "radialGradient", "stop", "color-profile",
  "clipPath", "mask", "pattern", "image",
  "title", "desc", "metadata",
  "filter", "feGaussianBlur", "feOffset", "feMerge", "feMergeNode",
  "feColorMatrix", "feComposite", "feFlood", "feTurbulence",
  "feDisplacementMap", "feConvolveMatrix", "feDiffuseLighting",
  "feSpecularLighting", "fePointLight", "feSpotLight", "feDistantLight",
  "animate", "animateMotion", "animateTransform", "set",
  "marker", "view", "switch", "foreignObject",
];

/**
 * SVG 安全白名单属性
 */
const SVG_ALLOWED_ATTR = [
  // 基础属性
  "id", "class", "style", "tabindex", "lang", "xml:lang",
  // 几何属性
  "x", "y", "x1", "y1", "x2", "y2",
  "width", "height", "rx", "ry",
  "cx", "cy", "r", "d",
  "points", "xlink:href", "href",
  // 变换
  "transform", "viewBox", "preserveAspectRatio",
  "gradientUnits", "gradientTransform", "spreadMethod",
  "patternUnits", "patternTransform", "patternContentUnits",
  // 样式
  "fill", "fill-opacity", "fill-rule",
  "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin",
  "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit",
  "opacity", "color", "color-interpolation", "color-rendering",
  // 文字
  "font-size", "font-family", "font-weight", "font-style",
  "text-anchor", "text-decoration", "letter-spacing", "word-spacing",
  "dx", "dy", "rotate", "textLength", "lengthAdjust",
  "startOffset", "method", "spacing",
  // 其他
  "offset", "stop-color", "stop-opacity",
  "clip-path", "clip-rule", "mask",
  "filter", "filterUnits", "primitiveUnits",
  "in", "in2", "result", "operator", "k1", "k2", "k3", "k4",
  "stdDeviation", "scale", "xChannelSelector", "yChannelSelector",
  "mode", "type", "values", "slope", "intercept", "amplitude",
  "exponent", "baseFrequency", "numOctaves", "seed", "stitchTiles",
  "diffuseConstant", "specularConstant", "specularExponent",
  "surfaceScale", "azimuth", "elevation", "limitingConeAngle",
  "pointsAtX", "pointsAtY", "pointsAtZ",
  // 动画
  "attributeName", "attributeType", "from", "to", "by",
  "dur", "repeatCount", "repeatDur", "begin", "end",
  "calcMode", "values", "keyTimes", "keySplines",
  "additive", "accumulate",
  // ARIA（保留无障碍）
  "role", "aria-label", "aria-hidden", "aria-labelledby", "aria-describedby",
  // 标准属性
  "target", "rel",
];

/**
 * 净化 SVG 内容
 * 去除所有脚本、事件处理器和危险元素
 * 返回净化后的 SVG 字符串，如果内容无效则返回 null
 */
export function sanitizeSvg(svgContent: string): string | null {
  // 基础校验：必须包含 <svg 标签
  if (!svgContent.includes("<svg")) return null;

  // 长度上限，防止超大 SVG 攻击
  if (svgContent.length > 1024 * 1024) return null; // 1MB

  try {
    const cleaned = purify.sanitize(svgContent, {
      USE_PROFILES: { svg: true },
      ADD_TAGS: SVG_ALLOWED_TAGS,
      ADD_ATTR: SVG_ALLOWED_ATTR,
      // 强制禁止的内容
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
      FORBID_ATTR: [
        "onabort", "onactivate", "onafterprint", "onafterupdate",
        "onbeforeactivate", "onbeforecopy", "onbeforecut", "onbeforedeactivate",
        "onbeforeeditfocus", "onbeforepaste", "onbeforeprint", "onbeforeunload",
        "onbeforeupdate", "onblur", "onbounce", "oncellchange", "onchange",
        "onclick", "oncontextmenu", "oncontrolselect", "oncopy", "oncut",
        "ondataavailable", "ondatasetchanged", "ondatasetcomplete", "ondblclick",
        "ondeactivate", "ondrag", "ondragend", "ondragenter", "ondragleave",
        "ondragover", "ondragstart", "ondrop", "onerror", "onerrorupdate",
        "onfilterchange", "onfinish", "onfocus", "onfocusin", "onfocusout",
        "onhashchange", "onhelp", "oninput", "onkeydown", "onkeypress",
        "onkeyup", "onlayoutcomplete", "onload", "onlosecapture", "onmessage",
        "onmousedown", "onmouseenter", "onmouseleave", "onmousemove",
        "onmouseout", "onmouseover", "onmouseup", "onmousewheel",
        "onmove", "onmoveend", "onmovestart", "onoffline", "ononline",
        "onpagehide", "onpageshow", "onpaste", "onpopstate", "onprogress",
        "onpropertychange", "onreadystatechange", "onreset", "onresize",
        "onresizeend", "onresizestart", "onrowenter", "onrowexit",
        "onrowsdelete", "onrowsinserted", "onscroll", "onsearch",
        "onselect", "onselectionchange", "onselectstart", "onstart",
        "onstop", "onstorage", "onsubmit", "ontimeupdate", "ontouchcancel",
        "ontouchend", "ontouchmove", "ontouchstart", "onunhandledrejection",
        "onunload", "onvolumechange", "onwaiting", "onwheel",
      ],
    });

    // 净化后仍需包含 <svg 标签才算有效
    if (!cleaned.includes("<svg")) return null;

    return cleaned;
  } catch {
    return null;
  }
}
