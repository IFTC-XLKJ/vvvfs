# VVVFS

一个使用Dexie.js，基于IndexedDB的轻量、简单的浏览器中的Linux虚拟文件系统

## 快速开始

1. 安装依赖

```bash
npm install vvvfs
```

2. 引入

```javascript
import VVVFS from "vvvfs"; // ES6
```

```javascript
const VVVFS = require("vvvfs"); // CommonJS
```

```html
<script src="dist/vvvfs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vvvfs@latest/dist/vvvfs.min.js"></script>
<script src="https://unpkg.com/vvvfs@latest/dist/vvvfs.min.js"></script>
<!-- 浏览器 -->
```

3. 初始化

```javascript
const vvvfs = new VVVFS("vvvfs", {
    throwError: true, // 设置为true后，操作文件失败时，不会返回false，而是会抛出错误
}); // 创建一个名为vvvfs的虚拟文件系统
```

4. 使用

```javascript
// 所有操作都是异步的
(async function () {
    await vvvfs.reset(); // 重置文件系统
    await vvvfs.init("UserName"); // 初始化文件系统
    await vvvfs.watch("/home/user/Desktop/test.txt", (type) => {
        console.log(type); // 打印文件操作的类型
        return true; // 返回true或false，表示是否取消该操作
    });
    await vvvfs.createDir("/home/user/Desktop"); // 创建目录，返回true和false
    await vvvfs.writeText("/home/user/Desktop/test.txt", "Hello World!"); // 写入文本文件，写入文件还包括write(path: string, content: Blob)和writeJson(path: string, content: Record<string, any>)方法，返回true和false
    console.log(await vvvfs.readText("/home/user/Desktop/test.txt")); // 读取文本文件，读取文件还包括read(path: string): Blob | null和readJson(path: string): Record<string, any> | null方法
    await vvvfs.delete("/home/user/Desktop/test.txt"); // 删除文件，返回true和false
    if (await vvvfs.exists("/home/user/Desktop")) {
        // 判断文件或目录是否存在
    }
    console.log(await vvvfs.list("/home/user/Desktop")); // 列出目录下的文件，返回string[] | null
    if (await vvvfs.isDir("/home/user/Desktop")) {
        // 判断是否为目录
    }
    if (await vvvfs.isFile("/home/user/Desktop/test.txt")) {
        // 判断是否为文件
    }
    await vvvfs.rename("/home/user/Desktop/test.txt", "test2.txt"); // 重命名文件，返回true和false
    await vvvfs.move("/home/user/Desktop/test2.txt", "/home/user/Desktop/test.txt"); // 移动文件，返回true和false
    await vvvfs.copy("/home/user/Desktop/test.txt", "/home/user/Desktop/test2.txt"); // 复制文件，返回true和false
    await vvvfs.search("/home/user/Desktop", "test.txt"); // 搜索文件，返回string[] | null
})();
```

使用 `VVVFS.File` 类：

```javascript
(async function () {
    const file = new VVVFS.File("/home/user/Desktop/test.txt");
    // file.options.throwError = true;
    await file.writeText("Hello World!");
    console.log(await file.readText());
    await file.delete();
})();
// 用法与 vvvfs 相当
```

## 更新日志

### 0.1.0

- 修复 `init` 重复初始化时重复写入已存在文件和目录

### 0.0.9

- 更新 `watch` 方法，监听时，返回 `true` 表示取消该操作

### 0.0.8

- 新增 `watch` 方法 (该方法属于实验性功能，后期可能会改变)

### 0.0.7

- AI 了优化一下

### 0.0.6

- `VVVFS.File` 类中新增 `dbname` 和 `options` 属性
- `VVVFS` 新增 `defaultDBName` 属性

### 0.0.5

- 新增 `VVVFS.File` 类

### 0.0.4

- 修复IndexDB弹出一堆警告
- 修复 `search` 搜索时的bug

### 0.0.3

- 添加完整路径和文件名最长值限制，完整路径最长4096字符，文件名最长255字符
- 添加 `init` 方法，用于初始化Linux文件和目录
- 修复 `list` 方法列出根目录时返回的数组中有空字符串的bug，该空字符串是根目录自身

### 0.0.2

- 添加 `throwError` 选项，默认为 `false`

### 0.0.1

- 发布正式版
