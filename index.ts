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
 */
export interface FileRecord {
    id?: number;
    name: string;
    path: string;
    type: string;
    file: File | null;
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
 */
export interface VVVFSOptions {
    throwError: boolean;
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
    async writeJSON(json: Record<string, any>, format: boolean = true) {
        return await this._vvvfs.writeJson(this._path, json, format);
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
    async watch(handler: (type: string) => Promise<boolean>) {
        return await this._vvvfs.watch(this._path, handler);
    }
}

const version = packageJson.version;
class VVVFS {
    static defaultDBName = "vvvfs";
    private db: VVVFSDatabase;
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
     * 虚拟文件系统监听器
     */
    watchers: Record<string, Array<(type: string) => Promise<boolean>>> = {};
    /**
     * 创建虚拟文件系统
     * @param name 虚拟文件系统名称
     * @param options 配置项
     */
    constructor(
        name?: string,
        options = {
            throwError: false,
        },
    ) {
        this.options = options;
        try {
            this.db = new Dexie(name || VVVFS.defaultDBName) as VVVFSDatabase;
            this.db.version(1).stores({
                files: "++id, name, path, type, file, [name+path+type]",
            });
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
        const linuxInitFiles = [
            {
                name: "root",
                path: "/",
                type: "dir",
                file: new File([], "root"),
            },
            {
                name: "boot",
                path: "/",
                type: "dir",
                file: new File([], "boot"),
            },
            {
                name: "bin",
                path: "/",
                type: "dir",
                file: new File([], "bin"),
            },
            {
                name: "dev",
                path: "/",
                type: "dir",
                file: new File([], "dev"),
            },
            {
                name: "etc",
                path: "/",
                type: "dir",
                file: new File([], "etc"),
            },
            {
                name: "home",
                path: "/",
                type: "dir",
                file: new File([], "home"),
            },
            {
                name: user || "root",
                path: "/home",
                type: "dir",
                file: new File([], "home"),
            },
            {
                name: "lib",
                path: "/",
                type: "dir",
                file: new File([], "lib"),
            },
            {
                name: "lib64",
                path: "/",
                type: "dir",
                file: new File([], "lib64"),
            },
            {
                name: "media",
                path: "/",
                type: "dir",
                file: new File([], "media"),
            },
            {
                name: "mnt",
                path: "/",
                type: "dir",
                file: new File([], "mnt"),
            },
            {
                name: "opt",
                path: "/",
                type: "dir",
                file: new File([], "opt"),
            },
            {
                name: "proc",
                path: "/",
                type: "dir",
                file: new File([], "proc"),
            },
            {
                name: "run",
                path: "/",
                type: "dir",
                file: new File([], "run"),
            },
            {
                name: "sbin",
                path: "/",
                type: "dir",
                file: new File([], "sbin"),
            },
            {
                name: "srv",
                path: "/",
                type: "dir",
                file: new File([], "srv"),
            },
            {
                name: "sys",
                path: "/",
                type: "dir",
                file: new File([], "sys"),
            },
            {
                name: "tmp",
                path: "/",
                type: "dir",
                file: new File([], "tmp"),
            },
            {
                name: "usr",
                path: "/",
                type: "dir",
                file: new File([], "usr"),
            },
            {
                name: "var",
                path: "/",
                type: "dir",
                file: new File([], "var"),
            },
        ];
        try {
            for (const file of linuxInitFiles) {
                if (await this.exists(file.path)) continue;
                await this.db.files.put(file);
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
            await this.db.delete();
            this.db = new Dexie(this.db.name) as VVVFSDatabase;
            this.db.version(1).stores({
                files: "++id, name, path, type, file, [name+path+type]",
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
        const targetPath = joinPath(path);
        try {
            if (this.watchers[targetPath]) {
                for (const handler of this.watchers[targetPath]) {
                    if (await handler("create")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("CreateFile", "创建文件失败：监听器取消了操作");
                        }
                        return false;
                    }
                }
            }
            if (await this.exists(targetPath)) {
                console.warn("文件已存在");
                return true;
            }
            const { name, parent } = parsePath(targetPath);
            if (!(await this.exists(parent))) {
                await this.createDir(parent);
            }
            await this.db.files.add({
                name: name,
                path: parent,
                type: "file",
                file: new File([], name, {
                    type: mime.getType(targetPath) || "application/octet-stream",
                }),
            });
            return true;
        } catch (error) {
            console.error("创建文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("CreateFile", "创建文件失败" + error);
            }
            return false;
        }
    }
    /**
     * 创建目录
     * @param path 目录路径
     */
    async createDir(path: string) {
        const targetPath = joinPath(path);
        try {
            if (this.watchers[targetPath]) {
                for (const handler of this.watchers[targetPath]) {
                    if (await handler("create")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("CreateDir", "创建目录失败：监听器取消了操作");
                        }
                        return false;
                    }
                }
            }
            if (await this.exists(targetPath)) {
                console.warn("目录已存在");
                return true;
            }
            const { name, parent } = parsePath(targetPath);
            if (!(await this.exists(parent))) {
                if (parent == "/") {
                    await this.db.files.add({
                        name: "",
                        path: "/",
                        type: "dir",
                        file: new File([], ""),
                    });
                    if (name == "") return true;
                } else {
                    await this.createDir(parent);
                }
            }
            await this.db.files.add({
                name: name,
                path: parent,
                type: "dir",
                file: new File([], name),
            });
            return true;
        } catch (error) {
            console.error("创建目录失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("CreateDir", "创建目录失败" + error);
            }
            return false;
        }
    }
    /**
     * 判断文件是否存在
     * @param path 文件路径
     */
    async exists(path: string) {
        try {
            const targetPath = joinPath(path);
            const { name, parent } = parsePath(targetPath);
            return (
                (await this.db.files
                    .where({
                        name: name,
                        path: parent,
                    })
                    .count()) > 0
            );
        } catch (error) {
            console.error("判断文件是否存在失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("Exists", "判断文件是否存在失败" + error);
            }
            return false;
        }
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     */
    async write(path: string, content: Blob) {
        try {
            const targetPath = joinPath(path);
            if (this.watchers[targetPath]) {
                for (const handler of this.watchers[targetPath]) {
                    if (await handler("write")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("Write", "写入文件失败：监听器取消了操作");
                        }
                        return false;
                    }
                }
            }
            if (!(await this.exists(targetPath))) {
                const success = await this.createFile(targetPath);
                if (!success) {
                    console.warn("创建文件失败");
                    if (this.options.throwError) {
                        throw new VVVFSError("Write", "创建文件失败");
                    }
                    return false;
                }
            }
            if (await this.isDir(targetPath)) {
                console.warn("路径已存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Write", "路径已存在");
                }
                return false;
            }
            const { name, parent } = parsePath(targetPath);
            const file = new File([content], name, {
                type: mime.getType(targetPath) || "application/octet-stream",
            });
            const fileRecord = await this.db.files.where({ name, path: parent }).first();
            if (fileRecord) {
                await this.db.files.put({
                    ...fileRecord,
                    file: file,
                });
                return true;
            } else {
                console.warn("文件记录未找到，无法写入内容");
                if (this.options.throwError) {
                    throw new VVVFSError("Write", "文件记录未找到，无法写入内容");
                }
                return false;
            }
        } catch (error) {
            console.error("写入文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("Write", "写入文件失败" + error);
            }
            return false;
        }
    }
    /**
     * 写入文本内容
     * @param path 文件路径
     * @param content 文本内容
     */
    async writeText(path: string, content: string) {
        try {
            const blob = new Blob([content], { type: "text/plain" });
            return await this.write(path, blob);
        } catch (error) {
            console.error("写入文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("Write", "写入文件失败" + error);
            }
            return false;
        }
    }
    /**
     * 写入JSON内容
     * @param path 文件路径
     * @param content JSON内容
     * @param format 是否格式化
     */
    async writeJson(path: string, content: Record<string, any>, format: boolean = true) {
        try {
            return await this.writeText(
                path,
                JSON.stringify(content, null, format ? 4 : undefined),
            );
        } catch (error) {
            console.error("写入文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("Write", "写入文件失败" + error);
            }
            return false;
        }
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     */
    async read(path: string) {
        try {
            const targetPath = joinPath(path);
            if (this.watchers[targetPath]) {
                for (const handler of this.watchers[targetPath]) {
                    if (await handler("read")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("Read", "读取文件失败：监听器取消了操作");
                        }
                        return null;
                    }
                }
            }
            if (!(await this.exists(targetPath))) {
                console.warn("文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Read", "文件不存在");
                }
                return null;
            }
            const { name, parent } = parsePath(targetPath);
            return (await this.db.files.where({ name, path: parent }).first())?.file;
        } catch (error) {
            console.error("读取文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("Read", "读取文件失败" + error);
            }
            return null;
        }
    }
    /**
     * 读取文件内容
     * @param path 文件路径
     */
    async readText(path: string) {
        try {
            const file = await this.read(path);
            if (file) {
                return await file.text();
            } else {
                console.warn("文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Read", "文件不存在");
                }
                return null;
            }
        } catch (error) {
            console.error("读取文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("Read", "读取文件失败" + error);
            }
            return null;
        }
    }
    /**
     * 读取JSON内容
     * @param path 文件路径
     */
    async readJson(path: string) {
        try {
            const text = await this.readText(path);
            if (text) {
                try {
                    return JSON.parse(text);
                } catch (error) {
                    console.error("解析JSON失败", error);
                    if (this.options.throwError) {
                        throw new VVVFSError("Read", "解析JSON失败" + error);
                    }
                    return null;
                }
            } else {
                return null;
            }
        } catch (error) {
            console.error("读取文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("Read", "读取文件失败" + error);
            }
            return null;
        }
    }
    /**
     * 判断是否是文件
     * @param path 文件路径
     */
    async isFile(path: string) {
        try {
            const targetPath = joinPath(path);
            const { name, parent } = parsePath(targetPath);
            return (await this.db.files.where({ name, path: parent, type: "file" }).count()) > 0;
        } catch (error) {
            console.error("判断文件类型失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("IsFile", "判断文件类型失败" + error);
            }
            return false;
        }
    }
    /**
     * 判断是否是目录
     * @param path 文件路径
     */
    async isDir(path: string) {
        try {
            const targetPath = joinPath(path);
            const { name, parent } = parsePath(targetPath);
            return (await this.db.files.where({ path: parent, name, type: "dir" }).count()) > 0;
        } catch (error) {
            console.error("判断文件类型失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("IsDir", "判断文件类型失败" + error);
            }
            return false;
        }
    }
    /**
     * 列出目录下的文件
     * @param path 目录路径
     */
    async list(path: string) {
        try {
            const targetPath = joinPath(path);
            if (this.watchers[targetPath]) {
                for (const handler of this.watchers[targetPath]) {
                    if (await handler("list")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("List", "列出目录下的文件失败：监听器取消了操作");
                        }
                        return [];
                    }
                }
            }
            if (!(await this.exists(targetPath))) {
                console.warn("路径不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("List", "路径不存在");
                }
                return [];
            }
            if (!(await this.isDir(targetPath))) {
                console.warn("路径不是目录");
                if (this.options.throwError) {
                    throw new VVVFSError("List", "路径不是目录");
                }
                return [];
            }
            return (await this.db.files.where({ path: targetPath }).toArray())
                .map((file) => file.name)
                .filter((item) => item != "");
        } catch (error) {
            console.error("列出目录下的文件失败", error);
            if (this.options.throwError) {
                throw new VVVFSError("List", "列出目录下的文件失败" + error);
            }
            return [];
        }
    }
    /**
     * 重命名文件
     * @param path 文件路径
     * @param newName 新文件名
     */
    async rename(path: string, newName: string) {
        try {
            const sourcePath = joinPath(path);
            const { name, parent } = parsePath(sourcePath);
            if (this.watchers[sourcePath]) {
                for (const handler of this.watchers[sourcePath]) {
                    if (await handler("rename")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("Rename", "重命名文件失败：监听器取消了操作");
                        }
                        return false;
                    }
                }
            }
            if (!(await this.exists(sourcePath))) {
                console.warn("文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Rename", "文件不存在");
                }
                return false;
            }
            const newPath = joinPath(parent, newName);
            if (newPath === sourcePath) {
                return true;
            }
            if (await this.exists(newPath)) {
                console.warn("目标文件已存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Rename", "目标文件已存在");
                }
                return false;
            }
            const fileRecord = await this.db.files.where({ path: parent, name }).first();
            if (!fileRecord) {
                console.warn("文件记录未找到");
                if (this.options.throwError) {
                    throw new VVVFSError("Rename", "文件记录未找到");
                }
                return false;
            }
            if (fileRecord.type === "dir") {
                const descendants = await this.db.files
                    .filter(
                        (file) =>
                            file.path === sourcePath || file.path.startsWith(sourcePath + "/"),
                    )
                    .toArray();
                for (const descendant of descendants) {
                    const relativePath = descendant.path.slice(sourcePath.length);
                    const updatedPath = joinPath(newPath + relativePath);
                    await this.db.files.update(descendant.id!, { path: updatedPath });
                }
            }
            await this.db.files.update(fileRecord.id!, {
                name: newName,
                path: parent,
            });
            return true;
        } catch (e) {
            console.error(e);
            if (this.options.throwError) {
                throw new VVVFSError("Rename", "重命名文件失败" + e);
            }
            return false;
        }
    }
    /**
     * 删除文件
     * @param path 文件路径
     */
    async delete(path: string) {
        try {
            const targetPath = joinPath(path);
            if (this.watchers[targetPath]) {
                for (const handler of this.watchers[targetPath]) {
                    if (await handler("delete")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("Delete", "删除文件失败：监听器取消了操作");
                        }
                        return false;
                    }
                }
            }
            if (!(await this.exists(targetPath))) {
                console.warn("文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Delete", "文件不存在");
                }
                return false;
            }
            const { name, parent } = parsePath(targetPath);
            if (await this.isDir(targetPath)) {
                const files = await this.list(targetPath);
                for (const file of files) {
                    await this.delete(joinPath(targetPath, file));
                }
                const dirRecord = await this.db.files
                    .where({ name, path: parent, type: "dir" })
                    .first();
                if (dirRecord) {
                    await this.db.files.delete(dirRecord.id!);
                }
                return true;
            } else {
                const fileRecord = await this.db.files
                    .where({ name, path: parent, type: "file" })
                    .first();
                if (fileRecord) {
                    await this.db.files.delete(fileRecord.id!);
                }
                return true;
            }
        } catch (e) {
            console.error(e);
            if (this.options.throwError) {
                throw new VVVFSError("Delete", "删除文件失败" + e);
            }
            return false;
        }
    }
    /**
     * 移动文件
     * @param path 文件路径
     * @param newPath 新路径
     */
    async move(path: string, newPath: string) {
        try {
            const sourcePath = joinPath(path);
            const destinationPath = joinPath(newPath);
            if (this.watchers[sourcePath]) {
                for (const handler of this.watchers[sourcePath]) {
                    if (await handler("move")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("Move", "移动文件失败：监听器取消了操作");
                        }
                        return false;
                    }
                }
            }
            if (sourcePath === destinationPath) {
                return true;
            }
            if (await this.exists(destinationPath)) {
                console.warn("目标文件已存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Move", "目标文件已存在");
                }
                return false;
            }
            if (!(await this.exists(sourcePath))) {
                console.warn("源文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Move", "源文件不存在");
                }
                return false;
            }
            if (destinationPath.startsWith(sourcePath + "/")) {
                console.warn("目标路径是源路径的子路径");
                if (this.options.throwError) {
                    throw new VVVFSError("Move", "目标路径是源路径的子路径");
                }
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
                const dirRecord = await this.db.files
                    .where({ name, path: parent, type: "dir" })
                    .first();
                if (dirRecord) {
                    await this.db.files.delete(dirRecord.id!);
                }
                return true;
            } else {
                await this.createDir(newParent);
                const fileRecord = await this.db.files
                    .where({ name, path: parent, type: "file" })
                    .first();
                if (fileRecord) {
                    await this.db.files.update(fileRecord.id!, { name: newName, path: newParent });
                    return true;
                }
                return false;
            }
        } catch (e) {
            console.error(e);
            if (this.options.throwError) {
                throw new VVVFSError("Move", "移动文件失败" + e);
            }
            return false;
        }
    }
    /**
     * 复制文件
     * @param path 文件路径
     * @param newPath 新路径
     */
    async copy(path: string, newPath: string) {
        try {
            const sourcePath = joinPath(path);
            const destinationPath = joinPath(newPath);
            if (this.watchers[sourcePath]) {
                for (const handler of this.watchers[sourcePath]) {
                    if (await handler("copy")) {
                        if (this.options.throwError) {
                            throw new VVVFSError("Copy", "复制文件失败：监听器取消了操作");
                        }
                        return false;
                    }
                }
            }
            if (await this.exists(destinationPath)) {
                console.warn("目标文件已存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Copy", "目标文件已存在");
                }
                return false;
            }
            if (!(await this.exists(sourcePath))) {
                console.warn("源文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Copy", "源文件不存在");
                }
                return false;
            }
            if (destinationPath.startsWith(sourcePath + "/")) {
                console.warn("目标路径是源路径的子路径");
                if (this.options.throwError) {
                    throw new VVVFSError("Copy", "目标路径是源路径的子路径");
                }
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
            } else {
                const fileRecord = await this.db.files
                    .where({ name, path: parent, type: "file" })
                    .first();
                if (fileRecord) {
                    await this.db.files.add({
                        name: newName,
                        path: newParent,
                        type: fileRecord.type,
                        file: fileRecord.file,
                    });
                    return true;
                }
                return false;
            }
        } catch (e) {
            console.error(e);
            if (this.options.throwError) {
                throw new VVVFSError("Copy", "复制文件失败" + e);
            }
            return false;
        }
    }
    /**
     * 搜索文件
     * @param basePath 基础路径
     * @param query 查询字符串
     */
    async search(basePath: string, query: string) {
        try {
            if (!(await this.isDir(basePath))) {
                console.warn("基础路径不是目录");
                if (this.options.throwError) {
                    throw new VVVFSError("Search", "基础路径不是目录");
                }
                return null;
            }
            const that = this;
            const dirs = await this.list(basePath);
            return await search(basePath, dirs);
            async function search(parent: string, files: string[]) {
                const result: string[] = [];
                console.log(files);
                for (const file of files) {
                    if (file == "") continue;
                    console.log(file);
                    if (await that.isDir(joinPath(parent, file))) {
                        if (file.includes(query)) {
                            result.push(joinPath(parent, file) + "/");
                        }
                        result.push(
                            ...(await search(
                                joinPath(parent, file),
                                await that.list(joinPath(parent, file)),
                            )),
                        );
                    } else if (await that.isFile(joinPath(parent, file))) {
                        if (file.includes(query)) {
                            console.log(joinPath(parent, file));
                            result.push(joinPath(parent, file));
                        }
                    }
                }
                return result;
            }
        } catch (e) {
            console.error(e);
            if (this.options.throwError) {
                throw new VVVFSError("Search", "搜索文件失败" + e);
            }
            return null;
        }
    }
    async watch(path: string, handler: (type: string) => Promise<boolean>) {
        path = joinPath(path);
        if (!this.watchers[path]) {
            this.watchers[path] = [];
        }
        this.watchers[path].push(handler);
    }
}
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
function joinPath(...paths: string[]) {
    const segments = paths.map((p) => String(p)).filter((p) => p.length > 0);
    if (segments.length === 0) return ".";
    const isAbsolute = segments[0].startsWith("/");
    const parts = segments.join("/").split("/");
    const stack = [];
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
(globalThis as any).VVVFS = VVVFS;
