import { Dexie, Table } from "dexie";

/**
 * VVVFS 类构造签名（避免在内 declare global 中自引用）
 */
type VVVFSConstructor = typeof VVVFS;

/**
 * VVVFS 类实例类型
 */
type VVVFSInstance = VVVFS;

/**
 * 虚拟文件系统
 */
declare global {
    // 扩展 Window 接口
    interface Window {
        VVVFS: VVVFSConstructor;
        vvvfs: VVVFSInstance;
    }

    // 扩展 GlobalThis (针对你在 index.js 里的 globalThis.vvfs 写法)
    var VVVFS: VVVFSConstructor;
    var vvvfs: VVVFSInstance;
}


/**
 * 文件记录
 * @param id 文件id
 * @param name 文件名
 * @param path 文件路径
 * @param type 文件类型(file或dir)
 * @param file 文件对象
 * @param locked 是否锁定
 */
export interface FileRecord {
    id?: number;
    name: string;
    path: string;
    type: string;
    file: File | null;
    locked?: boolean;
}

/**
 * 虚拟文件系统数据库
 * @param files 文件存储数据表
 */
export interface VVVFSDatabase extends Dexie {
    files: Table<FileRecord, number>;
}

/**
 * 虚拟文件系统配置项
 * @param throwError 是否抛出错误
 * @param init 是否自动初始化，传入字符串时，为用户名，传入true时，使用默认用户名
 */
export interface VVVFSOptions {
    throwError: boolean;
    init: boolean | string;
}

/**
 * 虚拟文件系统下载配置项
 * @param headers 请求头
 * @param mode 下载模式（fetch或xhr）
 * @param onProgress 下载进度事件
 * @param onError 下载出错事件
 * @param onSuccess 下载成功事件
 */
export interface VVVFSDownloadOptions {
    headers?: Record<string, string>;
    mode?: "fetch" | "xhr";
    onProgress?: (progress: number) => void;
    onError?: (error: any) => void;
    onSuccess?: (success: boolean) => void;
}

/**
 * 虚拟文件系统错误类
 */
export class VVVFSError extends Error {
    /**
     * @param type 错误类型
     * @param message 错误信息
     */
    constructor(type: string, message: string);
}

/**
 * 虚拟文件系统文件类
 * @param path 文件路径
 */
export class VVVFSFile {
    /**
     * 获取文件路径
     */
    get path(): string;
    /**
     * 设置文件路径
     * @param path 文件路径
     */
    set path(path: string);
    /**
     * 设置数据库名称
     * @param dbname 数据库名称
     */
    set dbname(dbname: string);
    /**
     * 获取数据库名称
     */
    get dbname(): string;
    set options(options: VVVFSOptions);
    get options(): VVVFSOptions;

    /**
     * 构造函数
     * @param paths 文件路径
     */
    constructor(...paths: string[]);

    /**
     * 读取文件
     */
    read(): Promise<File | null>;
    /**
     * 读取文件文本内容
     */
    readText(): Promise<string | null>;
    /**
     * 读取文件JSON内容
     */
    readJSON(): Promise<Record<string, unknown> | null>;
    /**
     * 读取文件内容
     * @param start 起始位置
     * @param end 结束位置
     */
    readChunk(start: number, end: number): Promise<Blob | null>;
    /**
     * 读取文件内容
     * @param start 起始位置
     * @param end 结束位置
     */
    readTextChunk(start: number, end: number): Promise<string | null>;
    /**
     * 写入文件
     * @param file 文件对象
     */
    write(file: Blob): Promise<boolean>;
    /**
     * 写入文件文本内容
     * @param text 文件文本内容
     */
    writeText(text: string): Promise<boolean>;
    /**
     * 写入文件JSON内容
     * @param json 文件JSON内容
     */
    writeJSON(json: Record<string, unknown>, format?: boolean): Promise<boolean>;
    /**
     * 写入文件JSON值
     * @param key 键名
     * @param value 键值
     */
    writeJsonValue(key: string | number | Array<string | number>, value: any): Promise<boolean>;
    /**
     * 读取文件JSON值
     * @param key 键名
     */
    readJsonValue(key: string | number | Array<string | number>): Promise<any>;
    /**
     * 追加文件内容
     * @param file 文件对象
     */
    append(file: Blob): Promise<boolean>;
    /**
     * 追加文件文本内容
     * @param text 文件文本内容
     */
    appendText(text: string): Promise<boolean>;
    /**
     * 创建文件
     */
    createFile(): Promise<boolean>;
    /**
     * 创建文件夹
     */
    createDir(): Promise<boolean>;
    /**
     * 删除文件
     */
    delete(): Promise<boolean>;
    /**
     * 判断文件是否存在
     */
    exists(): Promise<boolean>;
    /**
     * 获取文件大小
     */
    isFile(): Promise<boolean>;
    /**
     * 判断文件是否是文件夹
     */
    isDir(): Promise<boolean>;
    /**
     * 列出文件
     */
    list(): Promise<string[]>;
    /**
     * 重命名文件
     */
    rename(newName: string): Promise<boolean>;
    /**
     * 移动文件
     */
    move(newPath: string): Promise<boolean>;
    /**
     * 复制文件
     */
    copy(newPath: string): Promise<boolean>;
    /**
     * 搜索文件
     */
    search(query: string): Promise<string[] | null>;
    /**
     * 监听文件
     */
    watch(handler: (type: string) => Promise<boolean>): void;
    /**
     * 锁定文件
     */
    lock(): Promise<boolean>;
    /**
     * 解锁文件
     */
    unlock(): Promise<boolean>;
    /**
     * 判断文件是否已锁定
     */
    isLocked(): Promise<boolean>;
    /**
     * 保存文件
     * @param name 文件名
     */
    save(name: string): Promise<boolean>;
    /**
     * 下载文件
     * @param url 文件链接
     * @param options 下载配置项
     */
    download(url: string | URL | Request, options?: VVVFSDownloadOptions): Promise<boolean>;
}

/**
 * path类（类似于NodeJS中的path模块）
 */
export class Path {
    /**
     * 路径分隔符
     */
    static readonly sep: string;
    /**
     * 环境变量PATH的分隔符
     */
    static readonly delimiter: string;
    /**
     * 构造函数
     * @param paths 路径片段
     */
    constructor(...paths: string[]);
    /**
     * 获取路径
     */
    get path(): string;
    /**
     * 设置路径
     * @param path 路径
     */
    set path(path: string);
    /**
     * 获取文件名
     */
    get name(): string;
    /**
     * 获取文件所在目录
     */
    get parent(): string;
    /**
     * 获取文件扩展名
     */
    get ext(): string;
    /**
     * 获取根目录（"/"或""）
     */
    get root(): string;
    /**
     * 判断路径是否为绝对路径
     */
    isAbsolute(): boolean;
    /**
     * 合并路径
     * @param paths 路径片段
     */
    join(...paths: string[]): string;
    /**
     * 转换为字符串
     */
    toString(): string;
    /**
     * 合并路径
     * @param paths 路径片段
     */
    static join(...paths: string[]): string;
    /**
     * 解析路径为绝对路径
     * @param paths 路径片段
     */
    static resolve(...paths: string[]): string;
    /**
     * 规范化路径（清除"."、解析".."）
     * @param path 路径
     */
    static normalize(path: string): string;
    /**
     * 判断路径是否为绝对路径
     * @param path 路径
     */
    static isAbsolute(path: string): boolean;
    /**
     * 获取文件名（可去除后缀）
     * @param path 路径
     * @param suffix 后缀（如扩展名）
     */
    static basename(path: string, suffix?: string): string;
    /**
     * 获取文件所在目录
     * @param path 路径
     */
    static dirname(path: string): string;
    /**
     * 获取文件扩展名
     * @param path 路径
     */
    static extname(path: string): string;
    /**
     * 解析路径
     * @param path 路径
     */
    static parse(path: string): { root: string; dir: string; base: string; ext: string; name: string };
    /**
     * 计算从from到to的相对路径
     * @param from 起始路径
     * @param to 目标路径
     */
    static relative(from: string, to: string): string;
}

/**
 * 虚拟文件系统
 * @author IFTC
 * @description 虚拟文件系统
 */
export class VVVFS {
    static defaultDBName: string;
    /**
     * 虚拟文件系统版本
     */
    static readonly version: string;
    /**
     * 虚拟文件系统作者
     */
    static readonly author: string;
    /**
     * 虚拟文件系统文件类
     */
    static File: typeof VVVFSFile;
    /**
     * path类（类似于NodeJS中的path模块）
     */
    static path: typeof Path;

    options: VVVFSOptions;

    /**
     * 创建虚拟文件系统
     * @param name 虚拟文件系统名称
     * @param options 配置项
     */
    constructor(name?: string, options?: VVVFSOptions);

    /**
     * 初始化虚拟文件系统
     * @description 将Linux的系统初始文件初始化到数据库中
     */
    init(user?: string): Promise<void>;
    /**
     * 重置虚拟文件系统
     */
    reset(): Promise<void>;
    /**
     * 创建文件
     * @param path 文件路径
     */
    createFile(path: string): Promise<boolean>;
    /**
     * 创建目录
     * @param path 目录路径
     */
    createDir(path: string): Promise<boolean>;
    /**
     * 判断文件是否存在
     * @param path 文件路径
     */
    exists(path: string): Promise<boolean>;
    /**
     * 读取文件内容
     * @param path 文件路径
     */
    read(path: string): Promise<File | null>;
    /**
     * 读取文件文本内容
     * @param path 文件路径
     */
    readText(path: string): Promise<string | null>;
    /**
     * 读取JSON内容
     * @param path 文件路径
     */
    readJson(path: string): Promise<Record<string, unknown> | null>;
    /**
     * 写入文件
     * @param path 文件路径
     * @param content 文件内容
     */
    write(path: string, content: Blob): Promise<boolean>;
    /**
     * 写入文本内容
     * @param path 文件路径
     * @param content 文本内容
     */
    writeText(path: string, content: string): Promise<boolean>;
    /**
     * 写入JSON内容
     * @param path 文件路径
     * @param content JSON内容
     * @param format 是否格式化
     */
    writeJson(path: string, content: Record<string, unknown>, format?: boolean): Promise<boolean>;
    /**
     * 写入 JSON 值
     * @param path 文件路径
     * @param key 键名
     * @param value 键值
     * @example await vvvfs.writeJsonValue("/example.json", "a", { b: "example"});
     * @example await vvvfs.writeJsonValue("/example.json", ["a", "b"], "example2");
     * @example await vvvfs.writeJsonValue("/example.json", 0, "example");
     */
    writeJsonValue(path: string, key: string | number | Array<string | number>, value: any): Promise<boolean>;
    /**
     * 读取 JSON 值
     * @param path 文件路径
     * @param key 键名
     * @example await vvvfs.readJsonValue("/example.json", "a");
     * @example await vvvfs.readJsonValue("/example.json", ["a", "b"]);
     * @example await vvvfs.readJsonValue("/example.json", 0);
     */
    readJsonValue(path: string, key: string | number | Array<string | number>): Promise<any>;
    /**
     * 追加内容
     * @param path 文件路径
     * @param content 追加内容
     */
    append(path: string, content: Blob): Promise<boolean>;
    /**
     * 追加文本内容
     * @param path 文件路径
     * @param content 追加内容
     */
    appendText(path: string, content: string): Promise<boolean>;
    /**
     * 读取文件内容
     * @param path 文件路径
     * @param start 开始位置
     * @param end 结束位置
     */
    readChunk(path: string, start: number, end: number): Promise<Blob | null>;
    /**
     * 读取文件内容
     * @param path 文件路径
     * @param start 读取开始位置
     * @param end 读取结束位置
     */
    readTextChunk(path: string, start: number, end: number): Promise<string | null>;
    /**
     * 判断是否是文件
     * @param path 文件路径
     */
    isFile(path: string): Promise<boolean>;
    /**
     * 判断是否是目录
     * @param path 文件路径
     */
    isDir(path: string): Promise<boolean>;
    /**
     * 列出目录下的文件
     * @param path 目录路径
     */
    list(path: string): Promise<string[]>;
    /**
     * 重命名文件
     * @param path 文件路径
     * @param newName 新文件名
     */
    rename(path: string, newName: string): Promise<boolean>;
    /**
     * 删除文件
     * @param path 文件路径
     */
    delete(path: string): Promise<boolean>;
    /**
     * 移动文件
     * @param path 文件路径
     * @param newPath 新路径
     */
    move(path: string, newPath: string): Promise<boolean>;
    /**
     * 复制文件
     * @param path 文件路径
     * @param newPath 新路径
     */
    copy(path: string, newPath: string): Promise<boolean>;
    /**
     * 搜索文件
     * @param basePath 基础路径
     * @param query 查询字符串
     */
    search(basePath: string, query: string): Promise<string[] | null>;
    /**
     * 监听文件
     * @param path 文件路径
     * @param handler 监听器
     */
    watch(path: string, handler: (type: string) => Promise<boolean>): void;
    /**
     * 锁定文件
     * @param path 文件路径
     */
    lock(path: string): Promise<boolean>;
    /**
     * 解锁文件
     * @param path 文件路径
     */
    unlock(path: string): Promise<boolean>;
    /**
     * 判断文件是否已锁定
     * @param path 文件路径
     */
    isLocked(path: string): Promise<boolean>;
    /**
     * 保存文件
     * @param path 文件路径
     * @param name 文件名
     */
    saveFile(path: string, name?: string): Promise<boolean>;
    /**
     * 下载文件
     * @param url 文件链接
     * @param path 保存路径
     * @param options 下载配置项
     */
    downloadFile(
        url: string | URL | Request,
        path: string,
        options?: VVVFSDownloadOptions,
    ): Promise<boolean>;
}

/**
 * 解析路径
 * @param path 路径
 */
export function parsePath(path: string): { name: string; parent: string };

/**
 * 合并路径
 * @param paths 路径
 */
export function joinPath(...paths: string[]): string;
