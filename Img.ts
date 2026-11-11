/**
 * @file Img.ts
 * @description 定义自定义 HTML 元素 <fs-img>，可直接显示存储在 vvvfs 中的图片文件。
 * @author IFTC
 * @example
 * <fs-img src="/home/user/Pictures/logo.png" alt="Logo" width="120"></fs-img>
 * <fs-img path="/home/user/Pictures/logo.png" watch></fs-img>
 */
import type { VVVFS, VVVFSOptions } from "./index";

/**
 * 监听的属性列表
 */
const OBSERVED_ATTRIBUTES = ["src", "path", "dbname", "alt", "width", "height", "watch"];

/**
 * 默认数据库名
 */
const DEFAULT_DB_NAME = "vvvfs";

/**
 * 会改变文件内容的操作类型（其余操作不会触发刷新）
 */
const WATCH_MUTATIONS = new Set([
    "create",
    "write",
    "append",
    "rename",
    "delete",
    "move",
    "copy",
    "downloadFile",
]);

/**
 * 刷新重试间隔（毫秒）
 * @description vvvfs 的 watch 在操作提交前触发，立即刷新会读到旧内容，
 * 因此延迟一段时间后重试，直到读到的文件发生变化。
 */
const WATCH_RETRY_DELAY = 50;

/**
 * 刷新最大重试次数
 */
const WATCH_MAX_ATTEMPTS = 10;

/**
 * Shadow DOM 内部样式
 */
const SHADOW_STYLE = `
    :host {
        display: inline-block;
    }
    img {
        display: block;
        max-width: 100%;
    }
    img[hidden] {
        display: none;
    }
    slot {
        display: none;
    }
    :host([data-state="error"]) slot,
    :host([data-state="idle"]) slot {
        display: block;
    }
`;

/**
 * VVVFS 构造函数类型
 */
type VVVFSConstructor = new (name?: string, options?: VVVFSOptions) => VVVFS;

/**
 * 全局作用域（VVVFS 库会向 globalThis 挂载 VVVFS / vvvfs）
 */
const globalScope = globalThis as typeof globalThis & {
    VVVFS?: VVVFSConstructor;
    vvvfs?: VVVFS;
};

/**
 * 已创建的 VVVFS 实例缓存（按数据库名共享，避免重复创建）
 */
const instanceCache = new Map<string, VVVFS>();

/**
 * 每个 (数据库名, 路径) 对应的元素集合，用于共享同一个 watch 监听器
 */
const watcherSets = new Map<string, Set<FsImg>>();

/**
 * 生成监听键
 * @param dbname 数据库名
 * @param path 文件路径
 */
function watchKey(dbname: string, path: string): string {
    return dbname + "\n" + path;
}

/**
 * 注册共享监听器
 * @description VVVFS 未提供取消监听的 API，因此同一个 (数据库名, 路径) 只注册一次，
 * 集合清空后监听器闭包仍保留在 VVVFS 内部（每个路径仅一个闭包，开销极小）。
 * @param el 目标元素
 * @param fs VVVFS 实例
 * @param dbname 数据库名
 * @param path 文件路径
 */
function registerWatcher(el: FsImg, fs: VVVFS, dbname: string, path: string): void {
    const key = watchKey(dbname, path);
    let set = watcherSets.get(key);
    if (!set) {
        set = new Set<FsImg>();
        watcherSets.set(key, set);
        fs.watch(path, (type) => {
            // 只有修改类操作才需要刷新
            if (!WATCH_MUTATIONS.has(type)) return false;
            const current = watcherSets.get(key);
            if (!current || current.size === 0) return false;
            for (const target of current) {
                if (target.isConnected) target.scheduleWatchRefresh();
            }
            // 返回 false，避免取消触发监听的文件操作
            return false;
        });
    }
    set.add(el);
}

/**
 * 将元素从共享监听集合中移除
 * @param el 目标元素
 * @param dbname 数据库名
 * @param path 文件路径
 */
function unregisterWatcher(el: FsImg, dbname: string, path: string): void {
    const key = watchKey(dbname, path);
    const set = watcherSets.get(key);
    if (!set) return;
    set.delete(el);
    if (set.size === 0) watcherSets.delete(key);
}

/**
 * load 事件详情
 */
export interface FsImgLoadDetail {
    /** 图片路径 */
    path: string;
    /** 图片文件对象 */
    file: File | null;
}

/**
 * error 事件详情
 */
export interface FsImgErrorDetail {
    /** 图片路径 */
    path: string;
    /** 错误信息 */
    message: string;
}

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
 * @events
 * - load：图片加载完成（detail: { path, file }）
 * - error：图片加载失败（detail: { path, message }）
 */
export class FsImg extends HTMLElement {
    /**
     * 监听的属性列表
     */
    static get observedAttributes(): string[] {
        return OBSERVED_ATTRIBUTES;
    }

    /**
     * Shadow Root
     */
    #shadow: ShadowRoot;
    /**
     * 默认插槽（加载失败 / 无路径时的回退内容）
     */
    #slot: HTMLSlotElement;
    /**
     * 内部 <img> 元素
     */
    #img: HTMLImageElement | null = null;
    /**
     * 当前图片的 ObjectURL
     */
    #objectURL: string | null = null;
    /**
     * 当前使用的 VVVFS 实例
     */
    #fs: VVVFS | null = null;
    /**
     * 当前展示的文件对象
     */
    #currentFile: File | null = null;
    /**
     * 加载令牌（用于丢弃过期的异步结果）
     */
    #token = 0;
    /**
     * 是否正在执行由自身触发的读取（避免 watch 递归）
     */
    #skipWatch = false;
    /**
     * watch 刷新重试定时器
     */
    #watchTimer: number | null = null;
    /**
     * 当前注册的监听信息
     */
    #watchDbname: string | null = null;
    #watchPath: string | null = null;

    /**
     * 构造函数：创建 Shadow DOM
     */
    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = SHADOW_STYLE;
        this.#shadow.appendChild(style);
        this.#slot = document.createElement("slot");
        this.#shadow.appendChild(this.#slot);
    }

    /**
     * 图片路径（src 优先，其次 path）
     */
    get src(): string {
        return this.getAttribute("src") ?? this.getAttribute("path") ?? "";
    }
    set src(value: string) {
        this.setAttribute("src", value);
    }

    /**
     * 数据库名
     */
    get dbname(): string {
        return this.getAttribute("dbname") || DEFAULT_DB_NAME;
    }
    set dbname(value: string) {
        this.setAttribute("dbname", value);
    }

    /**
     * 元素挂载时
     */
    connectedCallback(): void {
        this.#ensureImg();
        this.#syncAttrs();
        this.#syncWatch();
        void this.refresh();
    }

    /**
     * 元素卸载时
     */
    disconnectedCallback(): void {
        // 使所有进行中的异步加载失效
        this.#token++;
        this.#clearWatchTimer();
        this.#unregisterWatch();
        this.#revokeObjectURL();
        this.#setState("idle");
    }

    /**
     * 属性变化时
     * @param name 属性名
     */
    attributeChangedCallback(name: string): void {
        if (!this.isConnected) return;
        if (name === "alt" || name === "width" || name === "height") {
            this.#syncAttrs();
            return;
        }
        if (name === "watch") {
            this.#syncWatch();
            return;
        }
        if (name === "dbname") {
            this.#fs = null;
        }
        this.#syncWatch();
        void this.refresh();
    }

    /**
     * 手动刷新：重新读取并显示图片
     * @returns 是否成功显示
     */
    refresh(): Promise<boolean> {
        // 自身读取触发的 watch 不递归刷新
        if (this.#skipWatch) return Promise.resolve(false);
        return this.#reload();
    }

    /**
     * 调度一次 watch 触发的刷新（内部使用）
     * @description 延迟重试，直到读到的文件内容发生变化，
     * 以避开 vvvfs watch 在操作提交前触发导致的旧内容问题。
     */
    scheduleWatchRefresh(): void {
        if (this.#watchTimer !== null || !this.isConnected) return;
        let attempts = 0;
        const tick = async () => {
            this.#watchTimer = null;
            if (!this.isConnected) return;
            const changed = await this.#refreshForWatch();
            attempts++;
            if (!changed && attempts < WATCH_MAX_ATTEMPTS) {
                this.#watchTimer = window.setTimeout(tick, WATCH_RETRY_DELAY);
            }
        };
        this.#watchTimer = window.setTimeout(tick, WATCH_RETRY_DELAY);
    }

    /**
     * 执行加载
     */
    async #reload(): Promise<boolean> {
        const token = ++this.#token;
        const src = this.src;
        this.#setState("loading");

        if (!src) {
            this.#revokeObjectURL();
            this.#clearImg();
            this.#setState("idle");
            return false;
        }

        const fs = this.#resolveFS();
        if (!fs) return false;
        this.#syncWatch(fs);

        let file: File | null = null;
        this.#skipWatch = true;
        try {
            file = await fs.read(src);
        } catch (error) {
            if (token === this.#token && this.isConnected) {
                this.#fail(error instanceof Error ? error.message : String(error));
            }
            return false;
        } finally {
            this.#skipWatch = false;
        }

        if (token !== this.#token || !this.isConnected) return false;

        if (!file) {
            this.#fail(`文件不存在: ${src}`);
            return false;
        }

        return this.#display(file);
    }

    /**
     * watch 触发的刷新：仅当文件内容变化时才重新展示
     * @returns 内容是否发生变化（或无需比较）
     */
    async #refreshForWatch(): Promise<boolean> {
        const src = this.src;
        if (!src) return true;
        const fs = this.#fs ?? this.#resolveFS();
        if (!fs) return true;

        let file: File | null = null;
        this.#skipWatch = true;
        try {
            file = await fs.read(src);
        } catch {
            return true;
        } finally {
            this.#skipWatch = false;
        }

        if (!this.isConnected) return true;
        if (this.#isSameFile(file, this.#currentFile)) return false;

        if (!file) {
            this.#fail(`文件不存在: ${src}`);
            return true;
        }
        // 无论是否为图片，内容已变化，处理完毕即停止重试
        this.#display(file);
        return true;
    }

    /**
     * 判断两个文件对象内容是否一致
     * @param a 文件 A
     * @param b 文件 B
     */
    #isSameFile(a: File | null, b: File | null): boolean {
        if (!a || !b) return a === b;
        return (
            a.size === b.size &&
            a.type === b.type &&
            a.name === b.name &&
            a.lastModified === b.lastModified
        );
    }

    /**
     * 解析要使用的 VVVFS 实例
     */
    #resolveFS(): VVVFS | null {
        const dbname = this.dbname;
        // 默认数据库名时优先复用全局 vvvfs 实例
        if (dbname === DEFAULT_DB_NAME && globalScope.vvvfs) {
            this.#fs = globalScope.vvvfs;
            return this.#fs;
        }
        if (!instanceCache.has(dbname)) {
            if (!globalScope.VVVFS) {
                this.#fail("VVVFS 尚未加载，无法创建文件系统实例");
                return null;
            }
            try {
                instanceCache.set(dbname, new globalScope.VVVFS(dbname));
            } catch (error) {
                this.#fail(
                    "创建 VVVFS 实例失败: " +
                        (error instanceof Error ? error.message : String(error)),
                );
                return null;
            }
        }
        this.#fs = instanceCache.get(dbname)!;
        return this.#fs;
    }

    /**
     * 展示文件
     * @param file 图片文件
     * @returns 是否成功展示
     */
    #display(file: File): boolean {
        if (file.type && !file.type.startsWith("image/")) {
            this.#fail(`文件不是图片: ${this.src}（${file.type}）`);
            return false;
        }
        const img = this.#ensureImg();
        img.removeAttribute("hidden");
        this.#syncAttrs();
        this.#currentFile = file;
        const url = URL.createObjectURL(file);
        this.#revokeObjectURL();
        this.#objectURL = url;
        img.src = url;
        return true;
    }

    /**
     * 加载失败处理
     * @param message 错误信息
     */
    #fail(message: string): void {
        this.#revokeObjectURL();
        this.#clearImg();
        this.#setState("error");
        this.dispatchEvent(
            new CustomEvent<FsImgErrorDetail>("error", {
                detail: { path: this.src, message },
            }),
        );
    }

    /**
     * 获取（或创建）内部 <img> 元素
     */
    #ensureImg(): HTMLImageElement {
        if (!this.#img) {
            const img = document.createElement("img");
            // 暴露为 part，便于外部通过 ::part(img) 定制样式
            img.setAttribute("part", "img");
            img.addEventListener("load", () => {
                if (!this.isConnected) return;
                this.#setState("loaded");
                this.dispatchEvent(
                    new CustomEvent<FsImgLoadDetail>("load", {
                        detail: { path: this.src, file: this.#currentFile },
                    }),
                );
            });
            img.addEventListener("error", () => {
                if (!this.isConnected) return;
                this.#revokeObjectURL();
                this.#setState("error");
                this.dispatchEvent(
                    new CustomEvent<FsImgErrorDetail>("error", {
                        detail: { path: this.src, message: "图片解码失败" },
                    }),
                );
            });
            this.#img = img;
        }
        if (this.#img.parentNode === null) {
            this.#shadow.insertBefore(this.#img, this.#slot);
        }
        return this.#img;
    }

    /**
     * 同步 alt / width / height 到内部 <img>
     */
    #syncAttrs(): void {
        const img = this.#img;
        if (!img) return;
        for (const name of ["alt", "width", "height"]) {
            const value = this.getAttribute(name);
            if (value === null) img.removeAttribute(name);
            else img.setAttribute(name, value);
        }
    }

    /**
     * 同步 watch 监听（路径 / 数据库名 / watch 属性变化时调用）
     * @param fs 已解析的 VVVFS 实例（可选）
     */
    #syncWatch(fs?: VVVFS | null): void {
        const dbname = this.dbname;
        const path = this.src;
        const watching = this.hasAttribute("watch") && path.length > 0;

        // 目标未变化时无需处理
        if (
            watching &&
            this.#watchPath === path &&
            this.#watchDbname === dbname
        ) {
            return;
        }

        // 先注销旧监听
        if (this.#watchPath !== null && this.#watchDbname !== null) {
            unregisterWatcher(this, this.#watchDbname, this.#watchPath);
            this.#watchDbname = null;
            this.#watchPath = null;
        }

        if (watching) {
            const target = fs ?? this.#fs;
            if (target) {
                registerWatcher(this, target, dbname, path);
                this.#watchDbname = dbname;
                this.#watchPath = path;
            }
        }
    }

    /**
     * 注销 watch 监听
     */
    #unregisterWatch(): void {
        if (this.#watchPath !== null && this.#watchDbname !== null) {
            unregisterWatcher(this, this.#watchDbname, this.#watchPath);
        }
        this.#watchDbname = null;
        this.#watchPath = null;
    }

    /**
     * 清除 watch 刷新重试定时器
     */
    #clearWatchTimer(): void {
        if (this.#watchTimer !== null) {
            window.clearTimeout(this.#watchTimer);
            this.#watchTimer = null;
        }
    }

    /**
     * 清空内部 <img> 的 src
     */
    #clearImg(): void {
        this.#currentFile = null;
        if (this.#img) {
            this.#img.removeAttribute("src");
            this.#img.toggleAttribute("hidden", true);
        }
    }

    /**
     * 释放 ObjectURL
     */
    #revokeObjectURL(): void {
        if (this.#objectURL) {
            URL.revokeObjectURL(this.#objectURL);
            this.#objectURL = null;
        }
    }

    /**
     * 设置状态（写入 data-state 属性，便于 CSS 定制）
     * @param state 状态
     */
    #setState(state: "idle" | "loading" | "loaded" | "error"): void {
        if (state === "idle") this.removeAttribute("data-state");
        else this.setAttribute("data-state", state);
    }
}

// 注册自定义元素（避免重复注册导致报错）
if (typeof customElements !== "undefined" && !customElements.get("fs-img")) {
    customElements.define("fs-img", FsImg);
}
