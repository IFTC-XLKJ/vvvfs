/**
 * @file Img.ts
 * @description 定义自定义 HTML 元素 <fs-img>，可直接显示存储在 vvvfs 中的图片文件。
 * @author IFTC
 * @example
 * <fs-img src="/home/user/Pictures/logo.png" alt="Logo" width="120"></fs-img>
 * <fs-img path="/home/user/Pictures/logo.png" watch></fs-img>
 */
import { FsMedia } from "./Media";

/**
 * 自定义图片元素 <fs-img>
 * @description 直接读取并显示存储在 vvvfs 中的图片文件。
 * 内部使用 Shadow DOM 渲染 <img>，可通过 ::part(img) 定制样式；
 * 默认插槽内容会在加载失败或未设置路径时显示。
 * @attributes
 * - src / path：图片在 vvvfs 中的路径（src 优先，其次 path）
 * - dbname：数据库名，默认 "vvvfs"；未指定且存在全局 vvvfs 实例时直接使用该实例
 * - alt / width / height：透传到内部 <img> 元素
 * - watch：存在时，文件内容发生变化后自动刷新
 * @properties
 * - data：当前显示的图片文件的 Blob 对象（未加载或加载失败时为 null）
 * @events
 * - load：图片加载完成（detail: { path, file }）
 * - error：图片加载失败（detail: { path, message }）
 */
export class FsImg extends FsMedia {
    protected readonly mediaTag = "img";
    protected readonly partName = "img";
    protected readonly mediaLabel = "图片";
    protected readonly acceptPrefix = "image/";
    protected readonly loadEventName = "load";
    protected readonly mediaAttrs = ["alt", "width", "height"] as const;
    protected readonly defaultAttrs: readonly string[] = [];
    protected readonly shadowCss = `
        img {
            display: block;
            max-width: 100%;
        }
    `;
}

// 注册自定义元素（避免重复注册导致报错）
if (typeof customElements !== "undefined" && !customElements.get("fs-img")) {
    customElements.define("fs-img", FsImg);
}
