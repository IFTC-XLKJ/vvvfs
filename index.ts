import { Dexie, Table } from "dexie";
import packageJson from "./package.json" with { type: "json" };
import mime from "mime";

/**
 * 虚拟文件系统
 * @author IFTC
 * @description 虚拟文件系统
 */

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
 * 虚拟文件系统错误类
 */
class VVVFSError extends Error {
    /**
     * @param type 错误类型
     * @param message 错误信息
     */
    constructor(type: string, message: string) {
        super(message);
        this.name = "VVVFS" + type + "Error";
    }
}

/**
 * 虚拟文件系统文件类
 * @param path 文件路径
 */
class VVVFSFile {
    /**
     * 数据库名称
     */
    private _dbname: string = VVVFS.defaultDBName;
    /**
     * 文件路径
     */
    private _path: string;
    /**
     * 虚拟文件系统实例
     */
    private _vvvfs: VVVFS = new VVVFS(this._dbname);
    /**
     * 获取文件路径
     */
    get path() {
        return this._path;
    }
    /**
     * 设置文件路径
     * @param path 文件路径
     */
    set path(path: string) {
        this._path = joinPath(path);
    }
    /**
     * 设置数据库名称
     * @param dbname 数据库名称
     */
    set dbname(dbname: string) {
        this._dbname = dbname;
        this._vvvfs = new VVVFS(dbname);
    }
    /**
     * 获取数据库名称
     */
    get dbname() {
        return this._dbname;
    }
    set options(options: VVVFSOptions) {
        this._vvvfs.options = options;
    }
    get options() {
        return this._vvvfs.options;
    }
    /**
     * 构造函数
     * @param paths 文件路径
     */
    constructor(...paths: string[]) {
        this._path = joinPath(...paths);
    }
    /**
     * 读取文件
     */
    async read() {
        return await this._vvvfs.read(this._path);
    }
    /**
     * 读取文件文本内容
     */
    async readText() {
        return await this._vvvfs.readText(this._path);
    }
    /**
     * 读取文件JSON内容
     */
    async readJSON() {
        return await this._vvvfs.readJson(this._path);
    }
    /**
     * 读取文件内容
     * @param start 起始位置
     * @param end 结束位置
     */
    async readChunk(start: number, end: number) {
        return await this._vvvfs.readChunk(this._path, start, end);
    }
    /**
     * 读取文件内容
     * @param start 起始位置
     * @param end 结束位置
     */
    async readTextChunk(start: number, end: number) {
        return await this._vvvfs.readTextChunk(this._path, start, end);
    }
    /**
     * 写入文件
     * @param file 文件对象
     */
    async write(file: Blob) {
        return await this._vvvfs.write(this._path, file);
    }
    /**
     * 写入文件文本内容
     * @param text 文件文本内容
     */
    async writeText(text: string) {
        return await this._vvvfs.writeText(this._path, text);
    }
    /**
     * 写入文件JSON内容
     * @param json 文件JSON内容
     */
    async writeJSON(json: Record<string, unknown>, format: boolean = true) {
        return await this._vvvfs.writeJson(this._path, json, format);
    }
    /**
     * 追加文件内容
     * @param file 文件对象
     */
    async append(file: Blob) {
        return await this._vvvfs.append(this._path, file);
    }
    /**
     * 追加文件文本内容
     * @param text 文件文本内容
     */
    async appendText(text: string) {
        return await this._vvvfs.appendText(this._path, text);
    }
    /**
     * 创建文件
     */
    async createFile() {
        return await this._vvvfs.createFile(this._path);
    }
    /**
     * 创建文件夹
     */
    async createDir() {
        return await this._vvvfs.createDir(this._path);
    }
    /**
     * 删除文件
     */
    async delete() {
        return await this._vvvfs.delete(this._path);
    }
    /**
     * 判断文件是否存在
     */
    async exists() {
        return await this._vvvfs.exists(this._path);
    }
    /**
     * 获取文件大小
     */
    async isFile() {
        return await this._vvvfs.isFile(this._path);
    }
    /**
     * 判断文件是否是文件夹
     */
    async isDir() {
        return await this._vvvfs.isDir(this._path);
    }
    /**
     * 列出文件
     */
    async list() {
        return await this._vvvfs.list(this._path);
    }
    /**
     * 重命名文件
     */
    async rename(newName: string) {
        return await this._vvvfs.rename(this._path, newName);
    }
    /**
     * 移动文件
     */
    async move(newPath: string) {
        return await this._vvvfs.move(this._path, newPath);
    }
    /**
     * 复制文件
     */
    async copy(newPath: string) {
        return await this._vvvfs.copy(this._path, newPath);
    }
    /**
     * 搜索文件
     */
    async search(query: string) {
        return await this._vvvfs.search(this._path, query);
    }
    /**
     * 监听文件
     */
    watch(handler: (type: string) => Promise<boolean>) {
        return this._vvvfs.watch(this._path, handler);
    }
    /**
     * 锁定文件
     */
    async lock() {
        return await this._vvvfs.lock(this._path);
    }
    /**
     * 解锁文件
     */
    async unlock() {
        return await this._vvvfs.unlock(this._path);
    }
    /**
     * 判断文件是否已锁定
     */
    async isLocked() {
        return await this._vvvfs.isLocked(this._path);
    }
}

/**
 * path类（类似于NodeJS中的path模块）
 */
class Path {
    /**
     * 路径分隔符
     */
    static readonly sep = "/";
    /**
     * 环境变量PATH的分隔符
     */
    static readonly delimiter = ":";
    /**
     * 内部存储的路径
     */
    private _path: string;
    /**
     * 构造函数
     * @param paths 路径片段
     */
    constructor(...paths: string[]) {
        this._path = Path.resolve(...paths);
    }
    /**
     * 获取路径
     */
    get path() {
        return this._path;
    }
    /**
     * 设置路径
     * @param path 路径
     */
    set path(path: string) {
        this._path = Path.resolve(path);
    }
    /**
     * 获取文件名
     */
    get name() {
        return Path.basename(this._path);
    }
    /**
     * 获取文件所在目录
     */
    get parent() {
        return Path.dirname(this._path);
    }
    /**
     * 获取文件扩展名
     */
    get ext() {
        return Path.extname(this._path);
    }
    /**
     * 获取根目录（"/"或""）
     */
    get root() {
        return Path.parse(this._path).root;
    }
    /**
     * 判断路径是否为绝对路径
     */
    isAbsolute() {
        return Path.isAbsolute(this._path);
    }
    /**
     * 合并路径
     * @param paths 路径片段
     */
    join(...paths: string[]) {
        return Path.join(this._path, ...paths);
    }
    /**
     * 转换为字符串
     */
    toString() {
        return this._path;
    }
    /**
     * 合并路径
     * @param paths 路径片段
     */
    static join(...paths: string[]) {
        return joinPath(...paths);
    }
    /**
     * 解析路径为绝对路径
     * @param paths 路径片段
     */
    static resolve(...paths: string[]) {
        return paths.length === 0 ? "/" : joinPath(...paths);
    }
    /**
     * 规范化路径（清除"."、解析".."）
     * @param path 路径
     */
    static normalize(path: string) {
        if (path.length === 0) return ".";
        const isAbsolute = path.startsWith("/");
        const trailingSlash = path.length > 1 && path.endsWith("/");
        const stack: string[] = [];
        for (const part of path.split("/")) {
            if (part === "" || part === ".") {
                continue;
            } else if (part === "..") {
                if (stack.length > 0 && stack[stack.length - 1] !== "..") {
                    stack.pop();
                } else if (!isAbsolute) {
                    stack.push("..");
                }
            } else {
                stack.push(part);
            }
        }
        let result = stack.join("/");
        if (isAbsolute) {
            result = "/" + result;
        } else if (result.length === 0) {
            result = ".";
        }
        if (trailingSlash && result !== "/" && result !== "." && !result.endsWith("/")) {
            result += "/";
        }
        return result;
    }
    /**
     * 判断路径是否为绝对路径
     * @param path 路径
     */
    static isAbsolute(path: string) {
        return path.length > 0 && path.startsWith("/");
    }
    /**
     * 获取文件名（可去除后缀）
     * @param path 路径
     * @param suffix 后缀（如扩展名）
     */
    static basename(path: string, suffix?: string) {
        if (path.length === 0) return "";
        const normalized = Path.normalize(path);
        if (normalized === "/") return "/";
        let base = normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
        base = base.slice(base.lastIndexOf("/") + 1);
        if (suffix && base !== suffix && base.endsWith(suffix)) {
            base = base.slice(0, base.length - suffix.length);
        }
        return base;
    }
    /**
     * 获取文件所在目录
     * @param path 路径
     */
    static dirname(path: string) {
        const normalized = Path.normalize(path);
        if (normalized === "/" || normalized === ".") return normalized;
        const parts = normalized.split("/");
        parts.pop();
        const result = parts.join("/");
        if (result.length === 0) {
            return Path.isAbsolute(normalized) ? "/" : ".";
        }
        return result;
    }
    /**
     * 获取文件扩展名
     * @param path 路径
     */
    static extname(path: string) {
        const base = Path.basename(path);
        const lastDot = base.lastIndexOf(".");
        if (lastDot <= 0) return "";
        return base.slice(lastDot);
    }
    /**
     * 解析路径
     * @param path 路径
     */
    static parse(path: string) {
        const base = Path.basename(path);
        const ext = Path.extname(base);
        return {
            root: Path.isAbsolute(path) ? "/" : "",
            dir: Path.dirname(path),
            base,
            ext,
            name: ext.length > 0 ? base.slice(0, base.length - ext.length) : base,
        };
    }
    /**
     * 计算从from到to的相对路径
     * @param from 起始路径
     * @param to 目标路径
     */
    static relative(from: string, to: string) {
        const fromParts = Path.resolve(from).split("/").filter((part) => part.length > 0);
        const toParts = Path.resolve(to).split("/").filter((part) => part.length > 0);
        let i = 0;
        while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
            i++;
        }
        const up = new Array<string>(Math.max(0, fromParts.length - i)).fill("..").join("/");
        const down = toParts.slice(i).join("/");
        if (up.length > 0 && down.length > 0) return up + "/" + down;
        if (up.length > 0) return up;
        return down;
    }
}

const version = packageJson.version;

class VVVFS {
    static defaultDBName = "vvvfs";
    #db: VVVFSDatabase;
    options: VVVFSOptions;
    /**
     * 虚拟文件系统版本
     */
    static version: string;
    /**
     * 虚拟文件系统文件类
     */
    static File = VVVFSFile;
    /**
     * path类（类似于NodeJS中的path模块）
     */
    static path = Path;
    /**
     * 虚拟文件系统监听器
     */
    #watchers: Record<string, Array<(type: string) => Promise<boolean>>> = {};

    /**
     * 检查文件访问权限（监听器和锁定状态）
     * @param path 文件路径
     * @param operation 操作类型
     * @returns 是否允许访问
     */
    async #checkAccess(path: string, operation: string): Promise<boolean> {
        if (this.#watchers[path]) {
            for (const handler of this.#watchers[path]) {
                if (await handler(operation)) {
                    if (this.options.throwError) {
                        throw new VVVFSError(
                            operation.charAt(0).toUpperCase() + operation.slice(1),
                            `${operation}操作被监听器取消`,
                        );
                    }
                    return false;
                }
            }
        }
        if (await this.#isLocked(path)) {
            if (this.options.throwError) {
                throw new VVVFSError(
                    operation.charAt(0).toUpperCase() + operation.slice(1),
                    "文件已被锁定",
                );
            }
            return false;
        }
        return true;
    }

    /**
     * 内部判断是否锁定（跳过错误包装）
     */
    async #isLocked(path: string): Promise<boolean> {
        const { name, parent } = parsePath(path);
        const fileRecord = await this.#db.files.where({ name, path: parent }).first();
        return !!fileRecord?.locked;
    }

    /**
     * 错误处理包装器
     * @param operation 操作名称
     * @param fn 操作函数
     * @param fallback 失败时的默认返回值
     */
    async #withErrorHandling<T>(
        operation: string,
        fn: () => Promise<T>,
        fallback: T,
    ): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (error instanceof VVVFSError) throw error;
            console.error(`${operation}失败`, error);
            if (this.options.throwError) {
                throw new VVVFSError(
                    operation.charAt(0).toUpperCase() + operation.slice(1),
                    `${operation}失败${error}`,
                );
            }
            return fallback;
        }
    }

    /**
     * 创建虚拟文件系统
     * @param name 虚拟文件系统名称
     * @param options 配置项
     */
    constructor(
        name?: string,
        options = {
            throwError: false,
            init: false,
        },
    ) {
        this.options = options;
        try {
            this.#db = new Dexie(name || VVVFS.defaultDBName) as VVVFSDatabase;
            this.#db.version(1).stores({
                files: "++id, name, path, type, file, [name+path+type]",
            });
            this.#db.version(2).stores({
                files: "++id, name, path, type, file, locked, [name+path+type]",
            }).upgrade(async (tx) => {
                await tx.table("files").toCollection().modify((file: FileRecord) => {
                    if (file.locked === undefined) {
                        file.locked = false;
                    }
                });
            });
            this.options.init ? this.init(this.options.init == true ? "root" : this.options.init) : void 0;
        } catch (error) {
            console.error("创建数据库失败", error);
            throw new VVVFSError("CreateDatabase", "创建数据库失败");
        }
    }
    /**
     * 初始化虚拟文件系统
     * @description 将Linux的系统初始文件初始化到数据库中
     */
    async init(user?: string) {
        const linuxDirs = [
            "root", "boot", "bin", "dev", "etc", "home",
            "lib", "lib64", "media", "mnt", "opt", "proc",
            "run", "sbin", "srv", "sys", "tmp", "usr", "var",
        ];
        const linuxInitFiles = linuxDirs.map((name) => ({
            name,
            path: "/",
            type: "dir" as const,
            file: new File([], name),
            locked: false,
        }));
        linuxInitFiles.push({
            name: user || "root",
            path: "/home",
            type: "dir" as const,
            file: new File([], "home"),
            locked: false,
        });
        try {
            for (const file of linuxInitFiles) {
                if (await this.exists(file.path)) continue;
                await this.#db.files.put(file);
            }
        } catch (error) {
            console.error("初始化文件失败", error);
            throw new VVVFSError("InitFiles", "初始化文件失败" + error);
        }
    }
    /**
     * 重置虚拟文件系统
     */
    async reset() {
        try {
            await this.#db.delete();
            this.#db = new Dexie(this.#db.name) as VVVFSDatabase;
            this.#db.version(1).stores({
                files: "++id, name, path, type, file, [name+path+type]",
            });
            this.#db.version(2).stores({
                files: "++id, name, path, type, file, locked, [name+path+type]",
            });
        } catch (error) {
            console.error("重置数据库失败", error);
            throw new VVVFSError("ResetDatabase", "重置数据库失败" + error);
        }
    }
    /**
     * 创建文件
     * @param path 文件路径
     */
    async createFile(path: string) {
        return this.#withErrorHandling("createFile", async () => {
            const targetPath = joinPath(path);
            if (!(await this.#checkAccess(targetPath, "create"))) return false;
            if (await this.exists(targetPath)) {
                console.warn("文件已存在");
                return true;
            }
            const { name, parent } = parsePath(targetPath);
            if (!(await this.exists(parent))) {
                await this.createDir(parent);
            }
            await this.#db.files.add({
                name,
                path: parent,
                type: "file",
                file: new File([], name, {
                    type: mime.getType(targetPath) || "application/octet-stream",
                }),
                locked: false,
            });
            return true;
        }, false);
    }
    /**
     * 创建目录
     * @param path 目录路径
     */
    async createDir(path: string) {
        return this.#withErrorHandling("createDir", async () => {
            const targetPath = joinPath(path);
            if (!(await this.#checkAccess(targetPath, "create"))) return false;
            if (await this.exists(targetPath)) {
                console.warn("目录已存在");
                return true;
            }
            const { name, parent } = parsePath(targetPath);
            if (!(await this.exists(parent))) {
                if (parent === "/") {
                    await this.#db.files.add({
                        name: "",
                        path: "/",
                        type: "dir",
                        file: new File([], ""),
                        locked: false,
                    });
                    if (name === "") return true;
                } else {
                    await this.createDir(parent);
                }
            }
            await this.#db.files.add({
                name,
                path: parent,
                type: "dir",
                file: new File([], name),
                locked: false,
            });
            return true;
        }, false);
    }
    /**
     * 判断文件是否存在
     * @param path 文件路径
     */
    async exists(path: string) {
        return this.#withErrorHandling("exists", async () => {
            const { name, parent } = parsePath(path);
            return (
                (await this.#db.files
                    .where({ name, path: parent })
                    .count()) > 0
            );
        }, false);
    }
    /**
     * 内部写入（跳过访问检查，供内部方法调用）
     */
    async #internalWrite(targetPath: string, content: Blob): Promise<boolean> {
        if (!(await this.exists(targetPath))) {
            const success = await this.createFile(targetPath);
            if (!success) return false;
        }
        if (await this.isDir(targetPath)) {
            console.warn("路径已存在");
            return false;
        }
        const { name, parent } = parsePath(targetPath);
        const file = new File([content], name, {
            type: mime.getType(targetPath) || "application/octet-stream",
        });
        const fileRecord = await this.#db.files.where({ name, path: parent }).first();
        if (fileRecord) {
            await this.#db.files.put({ ...fileRecord, file });
            return true;
        }
        return false;
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     */
    async write(path: string, content: Blob) {
        return this.#withErrorHandling("write", async () => {
            const targetPath = joinPath(path);
            if (!(await this.#checkAccess(targetPath, "write"))) return false;
            return await this.#internalWrite(targetPath, content);
        }, false);
    }
    /**
     * 写入文本内容
     * @param path 文件路径
     * @param content 文本内容
     */
    async writeText(path: string, content: string) {
        return this.#withErrorHandling("writeText", async () => {
            const blob = new Blob([content], { type: "text/plain" });
            return await this.write(path, blob);
        }, false);
    }
    /**
     * 写入JSON内容
     * @param path 文件路径
     * @param content JSON内容
     * @param format 是否格式化
     */
    async writeJson(path: string, content: Record<string, unknown>, format: boolean = true) {
        return this.#withErrorHandling("writeJson", async () => {
            return await this.writeText(
                path,
                JSON.stringify(content, null, format ? 4 : undefined),
            );
        }, false);
    }
    /**
     * 追加内容
     * @param path 文件路径
     * @param content 追加内容
     */
    async append(path: string, content: Blob) {
        return this.#withErrorHandling("append", async () => {
            const targetPath = joinPath(path);
            if (!(await this.#checkAccess(targetPath, "append"))) return false;
            const existingFile = await this.#internalRead(targetPath);
            if (existingFile) {
                const blob = new Blob([existingFile, content], {
                    type: "application/octet-stream",
                });
                return await this.#internalWrite(targetPath, blob);
            }
            return await this.#internalWrite(targetPath, content);
        }, false);
    }
    /**
     * 追加文本内容
     * @param path 文件路径
     * @param content 追加内容
     */
    async appendText(path: string, content: string) {
        return this.#withErrorHandling("appendText", async () => {
            const blob = new Blob([content], { type: "text/plain" });
            return await this.append(path, blob);
        }, false);
    }
    /**
     * 内部读取（跳过访问检查，供内部方法调用）
     */
    async #internalRead(targetPath: string): Promise<File | null> {
        if (!(await this.exists(targetPath))) return null;
        const { name, parent } = parsePath(targetPath);
        return (await this.#db.files.where({ name, path: parent }).first())?.file ?? null;
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     */
    async read(path: string) {
        return this.#withErrorHandling("read", async () => {
            const targetPath = joinPath(path);
            if (!(await this.#checkAccess(targetPath, "read"))) return null;
            return await this.#internalRead(targetPath);
        }, null as File | null);
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     */
    async readText(path: string) {
        return this.#withErrorHandling("readText", async () => {
            const file = await this.read(path);
            return file ? await file.text() : null;
        }, null as string | null);
    }
    /**
     * 读取JSON内容
     * @param path 文件路径
     */
    async readJson(path: string) {
        return this.#withErrorHandling("readJson", async () => {
            const text = await this.readText(path);
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch (error) {
                console.error("解析JSON失败", error);
                if (this.options.throwError) {
                    throw new VVVFSError("Read", "解析JSON失败" + error);
                }
                return null;
            }
        }, null as Record<string, unknown> | null);
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     * @param start 开始位置
     * @param end 结束位置
     */
    async readChunk(path: string, start: number, end: number) {
        return this.#withErrorHandling("readChunk", async () => {
            const file = await this.read(path);
            return file?.slice(start, end) ?? null;
        }, null as Blob | null);
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     * @param start 读取开始位置
     * @param end 读取结束位置
     */
    async readTextChunk(path: string, start: number, end: number) {
        return this.#withErrorHandling("readTextChunk", async () => {
            const chunk = await this.readChunk(path, start, end);
            return chunk ? await chunk.text() : null;
        }, null as string | null);
    }
    /**
     * 判断是否是文件
     * @param path 文件路径
     */
    async isFile(path: string) {
        return this.#withErrorHandling("isFile", async () => {
            const { name, parent } = parsePath(path);
            return (await this.#db.files.where({ name, path: parent, type: "file" }).count()) > 0;
        }, false);
    }
    /**
     * 判断是否是目录
     * @param path 文件路径
     */
    async isDir(path: string) {
        return this.#withErrorHandling("isDir", async () => {
            const { name, parent } = parsePath(path);
            return (await this.#db.files.where({ name, path: parent, type: "dir" }).count()) > 0;
        }, false);
    }
    /**
     * 列出目录下的文件
     * @param path 目录路径
     */
    async list(path: string) {
        return this.#withErrorHandling("list", async () => {
            const targetPath = joinPath(path);
            if (!(await this.#checkAccess(targetPath, "list"))) return [];
            if (!(await this.exists(targetPath))) {
                console.warn("路径不存在");
                return [];
            }
            if (!(await this.isDir(targetPath))) {
                console.warn("路径不是目录");
                return [];
            }
            return (await this.#db.files.where({ path: targetPath }).toArray())
                .map((file) => file.name)
                .filter((item) => item !== "");
        }, [] as string[]);
    }
    /**
     * 重命名文件
     * @param path 文件路径
     * @param newName 新文件名
     */
    async rename(path: string, newName: string) {
        return this.#withErrorHandling("rename", async () => {
            const sourcePath = joinPath(path);
            if (!(await this.#checkAccess(sourcePath, "rename"))) return false;
            if (!(await this.exists(sourcePath))) {
                console.warn("文件不存在");
                return false;
            }
            const { name, parent } = parsePath(sourcePath);
            const newPath = joinPath(parent, newName);
            if (newPath === sourcePath) return true;
            if (await this.exists(newPath)) {
                console.warn("目标文件已存在");
                return false;
            }
            const fileRecord = await this.#db.files.where({ path: parent, name }).first();
            if (!fileRecord) {
                console.warn("文件记录未找到");
                return false;
            }
            if (fileRecord.type === "dir") {
                const descendants = await this.#db.files
                    .filter(
                        (file) =>
                            file.path === sourcePath || file.path.startsWith(sourcePath + "/"),
                    )
                    .toArray();
                for (const descendant of descendants) {
                    const relativePath = descendant.path.slice(sourcePath.length);
                    const updatedPath = joinPath(newPath + relativePath);
                    await this.#db.files.update(descendant.id!, { path: updatedPath });
                }
            }
            await this.#db.files.update(fileRecord.id!, { name: newName, path: parent });
            return true;
        }, false);
    }
    /**
     * 删除文件
     * @param path 文件路径
     */
    async delete(path: string) {
        return this.#withErrorHandling("delete", async () => {
            const targetPath = joinPath(path);
            if (!(await this.#checkAccess(targetPath, "delete"))) return false;
            if (!(await this.exists(targetPath))) {
                console.warn("文件不存在");
                return false;
            }
            const { name, parent } = parsePath(targetPath);
            if (await this.isDir(targetPath)) {
                const files = await this.list(targetPath);
                for (const file of files) {
                    await this.delete(joinPath(targetPath, file));
                }
                const dirRecord = await this.#db.files
                    .where({ name, path: parent, type: "dir" })
                    .first();
                if (dirRecord) {
                    await this.#db.files.delete(dirRecord.id!);
                }
                return true;
            }
            const fileRecord = await this.#db.files
                .where({ name, path: parent, type: "file" })
                .first();
            if (fileRecord) {
                await this.#db.files.delete(fileRecord.id!);
            }
            return true;
        }, false);
    }
    /**
     * 移动文件
     * @param path 文件路径
     * @param newPath 新路径
     */
    async move(path: string, newPath: string) {
        return this.#withErrorHandling("move", async () => {
            const sourcePath = joinPath(path);
            const destinationPath = joinPath(newPath);
            if (!(await this.#checkAccess(sourcePath, "move"))) return false;
            if (sourcePath === destinationPath) return true;
            if (await this.exists(destinationPath)) {
                console.warn("目标文件已存在");
                return false;
            }
            if (!(await this.exists(sourcePath))) {
                console.warn("源文件不存在");
                return false;
            }
            if (destinationPath.startsWith(sourcePath + "/")) {
                console.warn("目标路径是源路径的子路径");
                return false;
            }
            const { name, parent } = parsePath(sourcePath);
            const { name: newName, parent: newParent } = parsePath(destinationPath);
            if (await this.isDir(sourcePath)) {
                await this.createDir(destinationPath);
                const children = await this.list(sourcePath);
                for (const child of children) {
                    await this.move(joinPath(sourcePath, child), joinPath(destinationPath, child));
                }
                const dirRecord = await this.#db.files
                    .where({ name, path: parent, type: "dir" })
                    .first();
                if (dirRecord) {
                    await this.#db.files.delete(dirRecord.id!);
                }
                return true;
            }
            await this.createDir(newParent);
            const fileRecord = await this.#db.files
                .where({ name, path: parent, type: "file" })
                .first();
            if (fileRecord) {
                await this.#db.files.update(fileRecord.id!, { name: newName, path: newParent });
                return true;
            }
            return false;
        }, false);
    }
    /**
     * 复制文件
     * @param path 文件路径
     * @param newPath 新路径
     */
    async copy(path: string, newPath: string) {
        return this.#withErrorHandling("copy", async () => {
            const sourcePath = joinPath(path);
            const destinationPath = joinPath(newPath);
            if (!(await this.#checkAccess(sourcePath, "copy"))) return false;
            if (await this.exists(destinationPath)) {
                console.warn("目标文件已存在");
                return false;
            }
            if (!(await this.exists(sourcePath))) {
                console.warn("源文件不存在");
                return false;
            }
            if (destinationPath.startsWith(sourcePath + "/")) {
                console.warn("目标路径是源路径的子路径");
                return false;
            }
            const { name, parent } = parsePath(sourcePath);
            const { name: newName, parent: newParent } = parsePath(destinationPath);
            if (await this.isDir(sourcePath)) {
                await this.createDir(destinationPath);
                const children = await this.list(sourcePath);
                for (const child of children) {
                    await this.copy(joinPath(sourcePath, child), joinPath(destinationPath, child));
                }
                return true;
            }
            const fileRecord = await this.#db.files
                .where({ name, path: parent, type: "file" })
                .first();
            if (fileRecord) {
                await this.#db.files.add({
                    name: newName,
                    path: newParent,
                    type: fileRecord.type,
                    file: fileRecord.file,
                    locked: false,
                });
                return true;
            }
            return false;
        }, false);
    }
    /**
     * 搜索文件
     * @param basePath 基础路径
     * @param query 查询字符串
     */
    async search(basePath: string, query: string) {
        return this.#withErrorHandling("search", async () => {
            if (!(await this.isDir(basePath))) {
                console.warn("基础路径不是目录");
                return null;
            }
            const that = this;
            const dirs = await this.list(basePath);
            return await searchRecursive(basePath, dirs);
            async function searchRecursive(parent: string, files: string[]) {
                const result: string[] = [];
                for (const file of files) {
                    if (file === "") continue;
                    const fullPath = joinPath(parent, file);
                    if (await that.isDir(fullPath)) {
                        if (file.includes(query)) {
                            result.push(fullPath + "/");
                        }
                        result.push(
                            ...(await searchRecursive(fullPath, await that.list(fullPath))),
                        );
                    } else if (await that.isFile(fullPath)) {
                        if (file.includes(query)) {
                            result.push(fullPath);
                        }
                    }
                }
                return result;
            }
        }, null as string[] | null);
    }
    /**
     * 监听文件
     * @param path 文件路径
     * @param handler 监听器
     */
    watch(path: string, handler: (type: string) => Promise<boolean>) {
        path = joinPath(path);
        if (!this.#watchers[path]) {
            this.#watchers[path] = [];
        }
        this.#watchers[path].push(handler);
    }
    /**
     * 锁定文件
     * @param path 文件路径
     */
    async lock(path: string) {
        return this.#withErrorHandling("lock", async () => {
            const targetPath = joinPath(path);
            if (!(await this.exists(targetPath))) {
                console.warn("文件不存在");
                return false;
            }
            if (await this.#isLocked(targetPath)) {
                console.warn("文件已被锁定");
                return false;
            }
            const { name, parent } = parsePath(targetPath);
            const fileRecord = await this.#db.files.where({ name, path: parent }).first();
            if (!fileRecord?.id) {
                console.warn("文件记录未找到");
                return false;
            }
            await this.#db.files.update(fileRecord.id, { locked: true });
            return true;
        }, false);
    }
    /**
     * 解锁文件
     * @param path 文件路径
     */
    async unlock(path: string) {
        return this.#withErrorHandling("unlock", async () => {
            const targetPath = joinPath(path);
            if (!(await this.exists(targetPath))) {
                console.warn("文件不存在");
                return false;
            }
            if (!(await this.#isLocked(targetPath))) {
                console.warn("文件未被锁定");
                return false;
            }
            const { name, parent } = parsePath(targetPath);
            const fileRecord = await this.#db.files.where({ name, path: parent }).first();
            if (!fileRecord?.id) {
                console.warn("文件记录未找到");
                return false;
            }
            await this.#db.files.update(fileRecord.id, { locked: false });
            return true;
        }, false);
    }
    /**
     * 判断文件是否已锁定
     * @param path 文件路径
     */
    async isLocked(path: string) {
        return this.#withErrorHandling("isLocked", async () => {
            const targetPath = joinPath(path);
            if (!(await this.exists(targetPath))) {
                return false;
            }
            return await this.#isLocked(targetPath);
        }, false);
    }
}
/**
 * 解析路径
 * @param path 路径
 */
function parsePath(path: string) {
    path = joinPath(path);
    const oldParts = path.split("/");
    const parts: string[] = [];
    for (let i = 0; i < oldParts.length; i++) {
        if (oldParts[i].length > 255) throw new VVVFSError("ParsePath", "文件名过长");
        if (oldParts[i]) parts.push(oldParts[i]);
    }
    const name = parts.pop() || "";
    const parent = "/" + parts.join("/");
    if (joinPath(parent, name).length > 4096) throw new VVVFSError("ParsePath", "文件路径过长");
    return { name, parent };
}

/**
 * 合并路径
 * @param paths 路径
 */
function joinPath(...paths: string[]) {
    const segments = paths.map((p) => String(p)).filter((p) => p.length > 0);
    if (segments.length === 0) return ".";
    const isAbsolute = segments[0].startsWith("/");
    const parts = segments.join("/").split("/");
    const stack: string[] = [];
    for (const part of parts) {
        if (part === "" || part === ".") {
            continue;
        } else if (part === "..") {
            if (stack.length > 0 && stack[stack.length - 1] !== "..") {
                stack.pop();
            } else if (!isAbsolute) {
                stack.push("..");
            }
        } else {
            stack.push(part);
        }
    }
    let result = stack.join("/");
    if (isAbsolute) {
        result = "/" + result;
    }
    return result.startsWith("/") ? result : "/" + result || (isAbsolute ? "/" : ".");
}
Object.defineProperty(VVVFS, "version", {
    value: version,
    writable: false,
    enumerable: true,
    configurable: false,
});
Object.defineProperty(VVVFS, "author", {
    value: "IFTC",
    writable: false,
    enumerable: true,
    configurable: false,
});
(globalThis as any).VVVFS = VVVFS;