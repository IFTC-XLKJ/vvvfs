/**
 * @file Media.ts
 * @description 定义自定义 HTML 元素 <fs-audio> 与 <fs-video>，可直接播放存储在 vvvfs 中的音频 / 视频文件。
 * 同时导出 <fs-img> / <fs-audio> / <fs-video> 共用的抽象基类 FsMedia。
 * @author IFTC
 * @example
 * <fs-audio src="/home/user/Music/demo.mp3"></fs-audio>
 * <fs-video src="/home/user/Videos/demo.mp4" width="320"></fs-video>
 */
import type { VVVFS, VVVFSOptions } from "./index";

/**
 * 监听的属性列表
 */
const OBSERVED_ATTRIBUTES = [
    "src",
    "path",
    "dbname",
    "watch",
    "controls",
    "autoplay",
    "loop",
    "muted",
    "preload",
    "width",
    "height",
    "alt",
];

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
 * 各元素共用的 Shadow DOM 基础样式
 */
const SHADOW_BASE_STYLE = `
    :host {
        display: inline-block;
    }
    [hidden] {
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
 * 媒体元素类型（图片 / 音频 / 视频）
 */
type MediaElement = HTMLImageElement | HTMLMediaElement;

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
const watcherSets = new Map<string, Set<FsMedia>>();

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
function registerWatcher(el: FsMedia, fs: VVVFS, dbname: string, path: string): void {
    const key = watchKey(dbname, path);
    let set = watcherSets.get(key);
    if (!set) {
        set = new Set<FsMedia>();
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
function unregisterWatcher(el: FsMedia, dbname: string, path: string): void {
    const key = watchKey(dbname, path);
    const set = watcherSets.get(key);
    if (!set) return;
    set.delete(el);
    if (set.size === 0) watcherSets.delete(key);
}

/**
 * load 事件详情
 */
export interface FsMediaLoadDetail {
    /** 媒体文件路径 */
    path: string;
    /** 媒体文件对象 */
    file: File | null;
}

/**
 * error 事件详情
 */
export interface FsMediaErrorDetail {
    /** 媒体文件路径 */
    path: string;
    /** 错误信息 */
    message: string;
}

/**
 * 媒体元素基类
 * @description <fs-img> / <fs-audio> / <fs-video> 共用，封装文件读取、ObjectURL、
 * watch 自动刷新、Shadow DOM 渲染与 load / error 事件。
 */
export abstract class FsMedia extends HTMLElement {
    /**
     * 监听的属性列表
     */
    static get observedAttributes(): string[] {
        return OBSERVED_ATTRIBUTES;
    }

    /**
     * 内部媒体标签名（img / audio / video）
     */
    protected abstract readonly mediaTag: string;
    /**
     * 暴露给 ::part() 的名称
     */
    protected abstract readonly partName: string;
    /**
     * 媒体类型名称（用于错误提示）
     */
    protected abstract readonly mediaLabel: string;
    /**
     * 接受的 MIME 前缀（image/ 、audio/ 、video/）
     */
    protected abstract readonly acceptPrefix: string;
    /**
     * 媒体加载完成对应的事件名（img 为 load，音视频为 loadeddata）
     */
    protected abstract readonly loadEventName: string;
    /**
     * Shadow DOM 附加样式
     */
    protected abstract readonly shadowCss: string;
    /**
     * 需要从宿主同步到媒体元素的属性
     */
    protected abstract readonly mediaAttrs: readonly string[];
    /**
     * 默认开启的属性（仅在初始化时应用，如 controls）
     */
    protected readonly defaultAttrs: readonly string[] = [];

    /**
     * 是否已完成首次属性同步（之后严格遵循宿主属性）
     */
    #attrsInitialized = false;

    /**
     * Shadow Root
     */
    #shadow: ShadowRoot | null = null;
    /**
     * 默认插槽（加载失败 / 无路径时的回退内容）
     */
    #slot: HTMLSlotElement | null = null;
    /**
     * 内部媒体元素
     */
    #media: MediaElement | null = null;
    /**
     * 当前媒体的 ObjectURL
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
     * 媒体路径（src 优先，其次 path）
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
     * 是否监听文件变化
     * @description watch="true" 时启用监听，watch="false" 时停止监听；
     * 属性存在且值不为 "false" 时均视为启用（兼容 `<fs-img watch>` 的写法）
     */
    get watch(): boolean {
        const value = this.getAttribute("watch");
        if (value === null) return false;
        return value.toLowerCase() !== "false";
    }
    set watch(value: boolean) {
        this.setAttribute("watch", value ? "true" : "false");
    }

    /**
     * 当前显示的媒体文件对象（未加载或加载失败时为 null）
     */
    get data(): Blob | null {
        return this.#currentFile;
    }

    /**
     * 元素挂载时
     */
    connectedCallback(): void {
        this.#ensureShadow();
        this.#ensureMedia();
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
        if (this.mediaAttrs.includes(name)) {
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
     * 手动刷新：重新读取并显示媒体
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
        if (this.#watchTimer !== null || !this.isConnected || !this.watch) return;
        let attempts = 0;
        const tick = async () => {
            this.#watchTimer = null;
            if (!this.isConnected || !this.watch) return;
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
            this.#clearMedia();
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
        // 无论是否为对应类型的媒体，内容已变化，处理完毕即停止重试
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
     * @param file 媒体文件
     * @returns 是否成功展示
     */
    #display(file: File): boolean {
        if (file.type && !file.type.startsWith(this.acceptPrefix)) {
            this.#fail(`文件不是${this.mediaLabel}: ${this.src}（${file.type}）`);
            return false;
        }
        const media = this.#ensureMedia();
        media.removeAttribute("hidden");
        this.#currentFile = file;
        const url = URL.createObjectURL(file);
        this.#revokeObjectURL();
        this.#objectURL = url;
        media.src = url;
        return true;
    }

    /**
     * 加载失败处理
     * @param message 错误信息
     */
    #fail(message: string): void {
        this.#revokeObjectURL();
        this.#clearMedia();
        this.#setState("error");
        this.dispatchEvent(
            new CustomEvent<FsMediaErrorDetail>("error", {
                detail: { path: this.src, message },
            }),
        );
    }

    /**
     * 确保 Shadow Root 已创建
     */
    #ensureShadow(): ShadowRoot {
        if (!this.#shadow) {
            this.#shadow = this.attachShadow({ mode: "open" });
            const style = document.createElement("style");
            style.textContent = SHADOW_BASE_STYLE + this.shadowCss;
            this.#shadow.appendChild(style);
            this.#slot = document.createElement("slot");
            this.#shadow.appendChild(this.#slot);
        }
        return this.#shadow;
    }

    /**
     * 获取（或创建）内部媒体元素
     */
    #ensureMedia(): MediaElement {
        const shadow = this.#ensureShadow();
        if (!this.#media) {
            const media = document.createElement(this.mediaTag) as MediaElement;
            // 暴露为 part，便于外部通过 ::part() 定制样式
            media.setAttribute("part", this.partName);
            // 无内容时先隐藏
            media.toggleAttribute("hidden", true);
            media.addEventListener(this.loadEventName, () => {
                if (!this.isConnected) return;
                this.#setState("loaded");
                this.dispatchEvent(
                    new CustomEvent<FsMediaLoadDetail>("load", {
                        detail: { path: this.src, file: this.#currentFile },
                    }),
                );
            });
            media.addEventListener("error", () => {
                if (!this.isConnected) return;
                this.#revokeObjectURL();
                this.#setState("error");
                this.dispatchEvent(
                    new CustomEvent<FsMediaErrorDetail>("error", {
                        detail: { path: this.src, message: "媒体加载失败" },
                    }),
                );
            });
            this.#media = media;
        }
        if (this.#media.parentNode === null) {
            shadow.insertBefore(this.#media, this.#slot);
        }
        return this.#media;
    }

    /**
     * 同步 mediaAttrs / defaultAttrs 到内部媒体元素
     */
    #syncAttrs(): void {
        const media = this.#media;
        if (!media) return;
        for (const name of this.mediaAttrs) {
            const value = this.getAttribute(name);
            if (value !== null) media.setAttribute(name, value);
            else if (!this.#attrsInitialized && this.defaultAttrs.includes(name)) {
                media.setAttribute(name, "");
            } else media.removeAttribute(name);
        }
        this.#attrsInitialized = true;
    }

    /**
     * 同步 watch 监听（路径 / 数据库名 / watch 属性变化时调用）
     * @param fs 已解析的 VVVFS 实例（可选）
     */
    #syncWatch(fs?: VVVFS | null): void {
        const dbname = this.dbname;
        const path = this.src;
        const watching = this.watch && path.length > 0;

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
     * 清空内部媒体元素的 src
     */
    #clearMedia(): void {
        this.#currentFile = null;
        if (this.#media) {
            this.#media.removeAttribute("src");
            this.#media.toggleAttribute("hidden", true);
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

/**
 * 自定义音频元素 <fs-audio>
 * @description 直接读取并播放存储在 vvvfs 中的音频文件
 * @attributes
 * - src / path：音频在 vvvfs 中的路径（src 优先，其次 path）
 * - dbname：数据库名，默认 "vvvfs"；未指定且存在全局 vvvfs 实例时直接使用该实例
 * - controls：是否显示控制条（默认显示，可用 removeAttribute("controls") 关闭）
 * - autoplay / loop / muted / preload：透传到内部 <audio> 元素
 * - watch：存在时，文件内容发生变化后自动刷新
 * @events
 * - load：音频数据加载完成（detail: { path, file }）
 * - error：音频加载失败（detail: { path, message }）
 * @example <fs-audio src="/home/user/Music/demo.mp3"></fs-audio>
 */
export class FsAudio extends FsMedia {
    protected readonly mediaTag = "audio";
    protected readonly partName = "audio";
    protected readonly mediaLabel = "音频";
    protected readonly acceptPrefix = "audio/";
    protected readonly loadEventName = "loadeddata";
    protected readonly mediaAttrs = ["controls", "autoplay", "loop", "muted", "preload"] as const;
    protected readonly defaultAttrs = ["controls"] as const;
    protected readonly shadowCss = `
        audio {
            display: block;
            max-width: 100%;
        }
    `;
}

/**
 * 自定义视频元素 <fs-video>
 * @description 直接读取并播放存储在 vvvfs 中的视频文件
 * @attributes
 * - src / path：视频在 vvvfs 中的路径（src 优先，其次 path）
 * - dbname：数据库名，默认 "vvvfs"；未指定且存在全局 vvvfs 实例时直接使用该实例
 * - controls：是否显示控制条（默认显示，可用 removeAttribute("controls") 关闭）
 * - autoplay / loop / muted / preload / width / height：透传到内部 <video> 元素
 * - watch：存在时，文件内容发生变化后自动刷新
 * @events
 * - load：视频数据加载完成（detail: { path, file }）
 * - error：视频加载失败（detail: { path, message }）
 * @example <fs-video src="/home/user/Videos/demo.mp4" width="320"></fs-video>
 */
export class FsVideo extends FsMedia {
    protected readonly mediaTag = "video";
    protected readonly partName = "video";
    protected readonly mediaLabel = "视频";
    protected readonly acceptPrefix = "video/";
    protected readonly loadEventName = "loadeddata";
    protected readonly mediaAttrs = [
        "controls",
        "autoplay",
        "loop",
        "muted",
        "preload",
        "width",
        "height",
    ] as const;
    protected readonly defaultAttrs = ["controls"] as const;
    protected readonly shadowCss = `
        video {
            display: block;
            max-width: 100%;
            height: auto;
        }
    `;
}

// 注册自定义元素（避免重复注册导致报错）
if (typeof customElements !== "undefined" && !customElements.get("fs-audio")) {
    customElements.define("fs-audio", FsAudio);
}
if (typeof customElements !== "undefined" && !customElements.get("fs-video")) {
    customElements.define("fs-video", FsVideo);
}
