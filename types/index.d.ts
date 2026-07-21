import { Dexie, Table } from "dexie";

/**
 * 虚拟文件系统
 */
declare global {
    // 扩展 Window 接口
    interface window {
        VVVFS: typeof VVVFS; // 如果 VVFS 是个类，这里可能需要调整，或者直接定义 vvfs 实例
    }

    // 扩展 GlobalThis (针对你在 index.js 里的 globalThis.vvfs 写法)
    // 注意：GlobalThis 和 Window 往往指向同一个对象，但在 TS 类型中有时需要分别处理
    // var VVVFS: typeof VVVFS; 
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
declare interface FileRecord {
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
declare interface VVVFSDatabase extends Dexie {
    files: Table<FileRecord, number>;
}

/**
 * 虚拟文件系统配置项
 * @param throwError 是否抛出错误
 */
declare interface VVVFSOptions {
    throwError: boolean;
}

/**
 * 虚拟文件系统错误类
 */
declare class VVVFSError extends Error {
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
declare class VVVFSFile {
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
}

/**
 * 虚拟文件系统
 * @author IFTC
 * @description 虚拟文件系统
 */
declare class VVVFS {
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
}

/**
 * 解析路径
 * @param path 路径
 */
declare function parsePath(path: string): { name: string; parent: string };

/**
 * 合并路径
 * @param paths 路径
 */
declare function joinPath(...paths: string[]): string;
