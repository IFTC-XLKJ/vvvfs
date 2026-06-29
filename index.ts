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
        if (await this.exists(path)) {
            console.warn("文件已存在");
            return true;
        }
        try {
            const { name, parent } = parsePath(path);
            if (!(await this.exists(parent))) {
                await this.createDir(parent);
            }
            // console.log(name, parent);
            await this.db.files.add({
                name: name,
                path: parent,
                type: "file",
                file: new File([], name, {
                    type: mime.getType(path) || "application/octet-stream",
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
        if (await this.exists(path)) {
            console.warn("目录已存在");
            return true;
        }
        try {
            const { name, parent } = parsePath(path);
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
            console.log(name, parent);
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
            const { name, parent } = parsePath(path);
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
            if (!(await this.exists(path))) {
                const success = await this.createFile(path);
                if (!success) {
                    console.warn("创建文件失败");
                    if (this.options.throwError) {
                        throw new VVVFSError("Write", "创建文件失败");
                    }
                    return false;
                }
            }
            const { name, parent } = parsePath(path);
            console.log(name, parent);
            if (await this.isDir(parent + "/" + name)) {
                console.warn("路径已存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Write", "路径已存在");
                }
                return false;
            }
            const file = new File([content], name, {
                type: mime.getType(path) || "application/octet-stream",
            });
            console.log(file);
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
            if (!(await this.exists(path))) {
                console.warn("文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Read", "文件不存在");
                }
                return null;
            }
            const { name, parent } = parsePath(path);
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
            const { name, parent } = parsePath(path);
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
            const { name, parent } = parsePath(path);
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
            const { name, parent } = parsePath(path);
            return (await this.db.files.where({ path: parent }).toArray())
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
            if (!(await this.exists(path))) {
                console.warn("文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Rename", "文件不存在");
                }
                return false;
            }
            const { name, parent } = parsePath(path);
            const file = await this.db.files.get({ path, name });
            await this.db.files.put({
                name: newName,
                path: parent,
                type: "file",
                file: file!.file,
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
            if (!(await this.exists(path))) {
                console.warn("文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Delete", "文件不存在");
                }
                return false;
            }
            const { name, parent } = parsePath(path);
            if (await this.isDir(path)) {
                const files = await this.list(path);
                for (const file of files) {
                    if (await this.isDir(joinPath(path, file))) {
                        const fileRecord = await this.db.files
                            .where({ name, path: parent })
                            .first();
                        await this.db.files.delete(fileRecord!.id!);
                    }
                    await this.delete(joinPath(parent, file));
                }
                return true;
            } else {
                const fileRecord = await this.db.files.where({ name, path: parent }).first();
                await this.db.files.delete(fileRecord!.id!);
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
            if (await this.exists(newPath)) {
                console.warn("目标文件已存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Move", "目标文件已存在");
                }
                return false;
            }
            if (!(await this.exists(path))) {
                console.warn("源文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Move", "源文件不存在");
                }
                return false;
            }
            const { name, parent } = parsePath(path);
            const { name: newName, parent: newParent } = parsePath(newPath);
            await this.createDir(newParent);
            if (await this.isDir(path)) {
                const dirs = await this.list(path);
                for (const dir of dirs) {
                    await this.move(path + "/" + dir, newPath + "/" + dir);
                }
            } else {
                const fileRecord = await this.db.files.where({ name, path: parent }).first();
                await this.db.files.update(fileRecord!.id!, { name: newName, path: newParent });
            }
            await this.delete(path);
            return true;
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
            if (await this.exists(newPath)) {
                console.warn("目标文件已存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Copy", "目标文件已存在");
                }
                return false;
            }
            if (!(await this.exists(path))) {
                console.warn("源文件不存在");
                if (this.options.throwError) {
                    throw new VVVFSError("Copy", "源文件不存在");
                }
                return false;
            }
            const { name, parent } = parsePath(path);
            const { name: newName, parent: newParent } = parsePath(newPath);
            await this.createDir(newParent);
            if (await this.isDir(path)) {
                const dirs = await this.list(path);
                for (const dir of dirs) {
                    await this.move(path + "/" + dir, newPath + "/" + dir);
                }
            } else {
                const fileRecord = await this.db.files.where({ name, path: parent }).first();
                await this.db.files.update(fileRecord!.id!, { name: newName, path: newParent });
            }
            return true;
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
