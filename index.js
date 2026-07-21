/// <reference path="./types/index.d.ts" />
/**
 * @class VVVFS
 * @description VVVFS 虚拟文件系统
 */
(async () => {
    try {
        globalThis.vvvfs = new VVVFS();
        vvvfs.options.throwError = true;
        await vvvfs.reset();
        await vvvfs.init("IFTC");
        console.log(vvvfs);
        vvvfs.watch("/test.txt", (type) => {
            console.log(type);
            // return true;
        });
        console.log("创建文件", await vvvfs.createFile("/test.txt"));
        console.log("写入文件", await vvvfs.writeText("/test.txt", "Hello World"));
        console.log("追加文件", await vvvfs.appendText("/test.txt", " - Appended"));
        // await vvvfs.lock("/test.txt");
        console.log("文件是否存在", await vvvfs.exists("/test.txt"));
        console.log("文件是否存在", await vvvfs.exists("/test2.txt"));
        console.log("读取文件", await vvvfs.readText("/test.txt"));
        console.log("读取文件块", await vvvfs.readTextChunk("/test.txt", 0, 5));
        console.log("复制文件", await vvvfs.copy("/test.txt", "/test2.txt"));
        console.log("搜索文件", await vvvfs.search("/", "t"));
        console.log("移动文件", await vvvfs.move("/test2.txt", "/test3.txt"));
        console.log("删除文件", await vvvfs.delete("/test.txt"));
        const file = new VVVFS.File("test.txt");
        console.log("写入文件", await file.writeText("Hello World"));
    } catch (error) {
        console.error(error);
    }
})();