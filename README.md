# VVVFS

一个使用Dexie.js，基于IndexedDB的轻量、简单的浏览器中的Linux虚拟文件系统

GitHub仓库: https://github.com/IFTC-XLKJ/vvvfs

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
<!-- GitHub Release: https://github.com/IFTC-XLKJ/vvvfs/releases -->
```

3. 初始化

```javascript
const vvvfs = new VVVFS("vvvfs", {
  throwError: true, // 设置为true后，操作文件失败时，不会返回false，而是会抛出错误
  init: "IFTC", // 自动初始化，用户名为 IFTC
}); // 创建一个名为vvvfs的虚拟文件系统
```

4. 使用

```javascript
// 所有操作都是异步的
(async function () {
  await vvvfs.reset(); // 重置文件系统
  await vvvfs.init("UserName"); // 初始化文件系统
  vvvfs.watch("/home/user/Desktop/test.txt", (type) => {
    console.log(type); // 打印文件操作的类型
    return true; // 返回true或false，表示是否取消该操作
  });
  await vvvfs.lock("/home/user/Desktop/test.txt"); // 锁定文件，防止其他代码访问该文件
  await vvvfs.unlock("/home/user/Desktop/test.txt"); // 解锁文件
  await vvvfs.createDir("/home/user/Desktop"); // 创建目录，返回true和false
  await vvvfs.writeText("/home/user/Desktop/test.txt", "Hello World!"); // 写入文本文件，写入文件还包括write(path: string, content: Blob)和writeJson(path: string, content: Record<string, any>)方法，返回true和false
  await vvvfs.appendText("/home/user/Desktop/test.txt", "Hello World!"); // 追加文本文件，返回true和false
  console.log(await vvvfs.readText("/home/user/Desktop/test.txt")); // 读取文本文件，读取文件还包括read(path: string): Blob | null和readJson(path: string): Record<string, any> | null方法
  console.log(await vvvfs.readChunkText("/home/user/Desktop/test.txt", 0, 5)); // 读取文件块，返回string | null
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
  await vvvfs.move(
    "/home/user/Desktop/test2.txt",
    "/home/user/Desktop/test.txt",
  ); // 移动文件，返回true和false
  await vvvfs.copy(
    "/home/user/Desktop/test.txt",
    "/home/user/Desktop/test2.txt",
  ); // 复制文件，返回true和false
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

### 0.1.8

- 新增 `writeJsonValue` 和 `readJsonValue` 方法，用于读取和写入JSON值（键支持字符串、数字数组下标以及嵌套路径，如 `["a", "b"]`）

### 0.1.7

- 新增 `init` 选项，用于是否自动初始化，传入字符串时，则为初始化的用户名，传入true时，则为默认用户名。

### 0.1.6

- 新增 `VVVFS.path` ，用法与 NodeJS 的 `path` 模块类似。

### 0.1.5

- 重新 `lock` 和 `unlock` 方法

### 0.1.4

- 使用 AI 优化代码

### 0.1.3

- 新增 `lock` 和 `unlock` 方法，可以锁定文件，防止其他代码访问该文件

### 0.1.2

- 新增 `readChunk` 和 `readChunkText` 方法，用于读取文件块

### 0.1.1

- 新增 `append` 和 `appendText` 方法，用于追加内容

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

---

# English

# VVVFS

A lightweight and simple Linux virtual file system in the browser, based on IndexedDB, built with Dexie.js

GitHub repository: https://github.com/IFTC-XLKJ/vvvfs

## Quick Start

1. Install the dependency

```bash
npm install vvvfs
```

2. Import

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
<!-- Browser -->
```

3. Initialize

```javascript
const vvvfs = new VVVFS("vvvfs", {
  throwError: true, // When set to true, failed file operations throw an error instead of returning false
  init: "IFTC", // Automatically initialize with the username IFTC
}); // Create a virtual file system named vvvfs
```

4. Usage

```javascript
// All operations are asynchronous
(async function () {
  await vvvfs.reset(); // Reset the file system
  await vvvfs.init("UserName"); // Initialize the file system
  vvvfs.watch("/home/user/Desktop/test.txt", (type) => {
    console.log(type); // Log the type of the file operation
    return true; // Return true or false to indicate whether to cancel the operation
  });
  await vvvfs.lock("/home/user/Desktop/test.txt"); // Lock the file to prevent other code from accessing it
  await vvvfs.unlock("/home/user/Desktop/test.txt"); // Unlock the file
  await vvvfs.createDir("/home/user/Desktop"); // Create a directory, returns true and false
  await vvvfs.writeText("/home/user/Desktop/test.txt", "Hello World!"); // Write a text file. Writing also includes write(path: string, content: Blob) and writeJson(path: string, content: Record<string, any>), returns true and false
  await vvvfs.appendText("/home/user/Desktop/test.txt", "Hello World!"); // Append text to a file, returns true and false
  console.log(await vvvfs.readText("/home/user/Desktop/test.txt")); // Read a text file. Reading also includes read(path: string): Blob | null and readJson(path: string): Record<string, any> | null
  console.log(await vvvfs.readChunkText("/home/user/Desktop/test.txt", 0, 5)); // Read a file chunk, returns string | null
  await vvvfs.delete("/home/user/Desktop/test.txt"); // Delete a file, returns true and false
  if (await vvvfs.exists("/home/user/Desktop")) {
    // Check whether a file or directory exists
  }
  console.log(await vvvfs.list("/home/user/Desktop")); // List the files in a directory, returns string[] | null
  if (await vvvfs.isDir("/home/user/Desktop")) {
    // Check whether it is a directory
  }
  if (await vvvfs.isFile("/home/user/Desktop/test.txt")) {
    // Check whether it is a file
  }
  await vvvfs.rename("/home/user/Desktop/test.txt", "test2.txt"); // Rename a file, returns true and false
  await vvvfs.move(
    "/home/user/Desktop/test2.txt",
    "/home/user/Desktop/test.txt",
  ); // Move a file, returns true and false
  await vvvfs.copy(
    "/home/user/Desktop/test.txt",
    "/home/user/Desktop/test2.txt",
  ); // Copy a file, returns true and false
  await vvvfs.search("/home/user/Desktop", "test.txt"); // Search for files, returns string[] | null
})();
```

Using the `VVVFS.File` class:

```javascript
(async function () {
  const file = new VVVFS.File("/home/user/Desktop/test.txt");
  // file.options.throwError = true;
  await file.writeText("Hello World!");
  console.log(await file.readText());
  await file.delete();
})();
// The usage is equivalent to vvvfs
```

## Changelog

### 0.1.8

- Added the `writeJsonValue` and `readJsonValue` methods for reading and writing JSON values (keys support strings, numeric array indexes, and nested paths such as `["a", "b"]`)

### 0.1.7

- Added the `init` option to control automatic initialization: when passed a string, it is used as the username for initialization; when passed `true`, the default username is used.

### 0.1.6

- Added `VVVFS.path`, which works in a similar way to the `path` module in NodeJS.

### 0.1.5

- Redesigned the `lock` and `unlock` methods

### 0.1.4

- Optimized the code with AI

### 0.1.3

- Added the `lock` and `unlock` methods, which can lock files to prevent other code from accessing them

### 0.1.2

- Added the `readChunk` and `readChunkText` methods for reading file chunks

### 0.1.1

- Added the `append` and `appendText` methods for appending content

### 0.1.0

- Fixed `init` rewriting existing files and directories when initialized repeatedly

### 0.0.9

- Updated the `watch` method: while watching, returning `true` cancels the operation

### 0.0.8

- Added the `watch` method (this is an experimental feature and may change in the future)

### 0.0.7

- Optimized a bit with AI

### 0.0.6

- Added the `dbname` and `options` properties to the `VVVFS.File` class
- Added the `defaultDBName` property to `VVVFS`

### 0.0.5

- Added the `VVVFS.File` class

### 0.0.4

- Fixed IndexedDB spamming a bunch of warnings
- Fixed a bug in `search`

### 0.0.3

- Added maximum length limits: 4096 characters for full paths and 255 characters for file names
- Added the `init` method for initializing Linux files and directories
- Fixed a bug where `list` returned an empty string (the root directory itself) in the array when listing the root directory

### 0.0.2

- Added the `throwError` option, which defaults to `false`

### 0.0.1

- Initial release
