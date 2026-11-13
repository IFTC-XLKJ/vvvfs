# VVVFS

一个使用Dexie.js，基于IndexedDB的轻量、简单的浏览器中的Linux虚拟文件系统

GitHub仓库: https://github.com/IFTC-XLKJ/vvvfs

## 赞助

如果这个项目对你有帮助，欢迎通过爱发电支持我们：

[![爱发电](https://img.shields.io/badge/爱发电-支持我们-ff69b4.svg?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSIjZmY2OWI0IiBkPSJNOCAxNS41cy03LTQuNS03LTkgQTEuNSAxLjUgMCAwIDAgOCAwYTEuNSAxLjUgMCAwIDAgNyA2LjVjMCA0LjUtNyA5LTcgOXoiLz48L3N2Zz4=)](https://afdian.com/a/IFTCCEO)

**爱发电主页：** https://afdian.com/a/IFTCCEO

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

### 使用 `<fs-img>` / `<fs-audio>` / `<fs-video>` 自定义元素

库加载后会自动注册这三个元素，可直接显示 / 播放 vvvfs 中的媒体文件：

```html
<fs-img src="/home/user/Pictures/logo.png" alt="Logo" width="120"></fs-img>
<fs-audio src="/home/user/Music/demo.mp3"></fs-audio>
<fs-video src="/home/user/Videos/demo.mp4" width="320"></fs-video>
<!-- src 也支持 http(s) 云端地址，会先下载到本地缓存再显示 -->
<fs-img src="https://example.com/Pictures/logo.png"></fs-img>
```

```javascript
// 也可通过 JS 动态创建
const img = document.createElement("fs-img");
img.src = "/home/user/Pictures/logo.png";
document.body.appendChild(img);
```

`src` 除了 vvvfs 内的路径，也支持 `http(s)` 云端地址。文件会缓存到 `/home/.cache/cloud/<hostname>/<pathname>`，再从缓存显示 / 播放：

```html
<fs-img src="https://example.com/Pictures/logo.png"></fs-img>
<fs-video src="https://example.com/Videos/demo.mp4" width="320"></fs-video>
```

- **缓存优先**：已有缓存时先直接展示缓存，再发送 HEAD 校验远端文件大小；大小不一致、HEAD 未返回 Content-Type 或缓存不可显示时，自动重新下载并刷新
- **多线程下载**：默认使用 4 线程按 Range 分片并行下载（`vvvfs.downloadFile(url, path, { threads })` 可调整，1-8）；文件过小、服务器不支持 Range 或分片失败时自动回退单线程
- `vvvfs.head(url)` 可单独获取远端文件的 `Content-Length` / `Content-Type`，用于自定义校验
- 下载使用 `fetch`，目标服务器需允许跨域（CORS）
- 云端文件同样支持 `watch`，监听的是本地缓存路径

三者共有的属性：

- `src` / `path`：媒体路径（`src` 优先），支持 vvvfs 内的路径与 `http(s)` 云端地址
- `dbname`：数据库名，默认 `vvvfs`；未指定且存在全局 `vvvfs` 实例时直接使用该实例
- `watch`：`true` 时启用文件监听，`false` 时停止监听；启用后文件内容发生变化会自动刷新（缺省或空值视为 `true`，兼容 `<fs-img watch>` 的写法）

各自的属性：

- `<fs-img>`：`alt` / `width` / `height` 透传到内部 `<img>` 元素
- `<fs-audio>`：`autoplay` / `loop` / `muted` / `preload` 透传到内部 `<audio>` 元素；`controls` 默认开启，移除该属性即可关闭
- `<fs-video>`：`autoplay` / `loop` / `muted` / `preload` / `width` / `height` 透传到内部 `<video>` 元素；`controls` 默认开启，移除该属性即可关闭

事件：`load`（加载完成）、`error`（加载失败），`detail` 中包含 `path` 与 `file`（或 `message`）；`path` 为媒体文件在 vvvfs 中的实际路径，云端文件即本地缓存路径。元素上还会写入 `data-state` 属性（`loading` / `loaded` / `error`），便于 CSS 定制。

此外提供 `data` 属性（JS 属性），返回当前媒体文件的 Blob 对象（未加载或加载失败时为 `null`），可用于上传、二次处理等场景。

内部使用 Shadow DOM 渲染：媒体元素分别暴露为 `part="img"` / `part="audio"` / `part="video"`，可用 `fs-img::part(img) { ... }` 等定制样式；默认插槽内容会在加载失败或未设置路径时显示（如 `<fs-audio src="/a.mp3">加载失败</fs-audio>`）。

## 更新日志

### 0.2.5
- 优化代码

### 0.2.4
- `<fs-img>` / `<fs-audio>` / `<fs-video>` 的 `src` 支持 `http(s)` 云端地址：文件缓存到 `/home/.cache/cloud/<hostname>/<pathname>` 后显示 / 播放
- 云端文件改为**缓存优先**：先展示已有缓存，再发送 HEAD 校验远端文件大小；大小不一致、HEAD 未返回 Content-Type 或缓存不可显示时自动重新下载并刷新
- `downloadFile` 支持多线程下载（默认 4 线程，`threads` 可配置 1-8，按 Range 分片并行）；文件过小、服务器不支持 Range 或分片失败时自动回退单线程
- 新增 `vvvfs.head(url)` 方法，返回远端文件的 `Content-Length` / `Content-Type` / `acceptRanges`

### 0.2.3

- 新增 `<fs-audio>` 自定义元素，可直接播放 vvvfs 中的音频文件
- 新增 `<fs-video>` 自定义元素，可直接播放 vvvfs 中的视频文件
- `<fs-img>` / `<fs-audio>` / `<fs-video>` 新增 `data` 属性，返回当前媒体文件的 Blob 对象（未加载时为 `null`）
- `<fs-img>` / `<fs-audio>` / `<fs-video>` 的 `watch` 属性支持 `true` / `false`，为 `false` 时停止文件监听

### 0.2.2

- 新增 `<fs-img>` 自定义元素，可直接显示 vvvfs 中的图片文件
- `<fs-img>` 新增 `src` / `path` / `dbname` / `alt` / `width` / `height` / `watch` 属性
- `<fs-img>` 新增 `load` / `error` 事件与 `data-state` 状态属性
- `<fs-img>` 使用 Shadow DOM 渲染，支持 `::part(img)` 样式定制与默认插槽回退内容

### 0.2.1

- 新增 `setHide` 方法，用于设置文件或文件夹的隐藏属性
- 新增 `getHide` 方法，用于获取文件或文件夹的隐藏属性
- `FileRecord` 新增 `hidden` 字段
- 数据库新增 version 3 迁移，自动为已有记录填充 `hidden: false`

### 0.2.0

- 新增 `registerMIMEType` 静态方法，用于注册自定义MIME类型

### 0.1.9

- 新增 `saveFile` 方法，用于保存文件
- 新增 `downloadFile` 方法，用于下载文件并保存到IndexedDB（支持`fetch`和`xhr`两种模式，以及下载进度、错误和成功事件）
- `VVVFS.File` 类新增 `save` 和 `download` 方法

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

## Sponsor

If this project is helpful to you, please consider supporting us on Afdian:

[![Afdian](https://img.shields.io/badge/Afdian-Support%20us-ff69b4.svg?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSIjZmY2OWI0IiBkPSJNOCAxNS41cy03LTQuNS03LTkgQTEuNSAxLjUgMCAwIDAgOCAwYTEuNSAxLjUgMCAwIDAgNyA2LjVjMCA0LjUtNyA5LTcgOXoiLz48L3N2Zz4=)](https://afdian.com/a/IFTCCEO)

**Afdian homepage:** https://afdian.com/a/IFTCCEO

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

### Using the `<fs-img>` / `<fs-audio>` / `<fs-video>` Custom Elements

Once the library is loaded, these three elements are registered automatically and can display / play media files stored in vvvfs directly:

```html
<fs-img src="/home/user/Pictures/logo.png" alt="Logo" width="120"></fs-img>
<fs-audio src="/home/user/Music/demo.mp3"></fs-audio>
<fs-video src="/home/user/Videos/demo.mp4" width="320"></fs-video>
<!-- src also accepts http(s) URLs; the file is downloaded to the local cache first -->
<fs-img src="https://example.com/Pictures/logo.png"></fs-img>
```

```javascript
// They can also be created dynamically
const img = document.createElement("fs-img");
img.src = "/home/user/Pictures/logo.png";
document.body.appendChild(img);
```

Besides paths inside vvvfs, `src` also accepts `http(s)` URLs. The file is cached into `/home/.cache/cloud/<hostname>/<pathname>` and then displayed / played from the cache:

```html
<fs-img src="https://example.com/Pictures/logo.png"></fs-img>
<fs-video src="https://example.com/Videos/demo.mp4" width="320"></fs-video>
```

- **Cache first**: when a cache entry exists it is displayed immediately, then a HEAD request validates the remote file size; if the size differs, the HEAD response has no Content-Type, or the cache cannot be displayed, the file is downloaded again and the element refreshes
- **Multi-threaded download**: downloads run in 4 parallel Range-based chunks by default (configurable via `vvvfs.downloadFile(url, path, { threads })`, 1-8); it falls back to a single thread when the file is too small, the server ignores Range, or a chunk fails
- `vvvfs.head(url)` returns the remote `Content-Length` / `Content-Type` on its own for custom validation
- Downloads use `fetch`, so the target server must allow cross-origin requests (CORS)
- Cloud files support `watch` as well; the local cache path is what gets watched

Attributes shared by all three:

- `src` / `path`: media path (`src` takes precedence), either inside vvvfs or an `http(s)` URL
- `dbname`: database name, defaults to `vvvfs`; when omitted and a global `vvvfs` instance exists, that instance is used directly
- `watch`: `true` enables file watching and `false` disables it; when enabled, the media is refreshed automatically after the file content changes (a missing or empty value is treated as `true`, for compatibility with `<fs-img watch>`)

Element-specific attributes:

- `<fs-img>`: `alt` / `width` / `height` are passed through to the inner `<img>` element
- `<fs-audio>`: `autoplay` / `loop` / `muted` / `preload` are passed through to the inner `<audio>` element; `controls` is enabled by default and can be turned off by removing the attribute
- `<fs-video>`: `autoplay` / `loop` / `muted` / `preload` / `width` / `height` are passed through to the inner `<video>` element; `controls` is enabled by default and can be turned off by removing the attribute

Events: `load` (media loaded) and `error` (loading failed); `detail` contains `path` plus `file` (or `message`), where `path` is the actual vvvfs path of the media file (the local cache path for cloud files). A `data-state` attribute (`loading` / `loaded` / `error`) is also written to the element for CSS customization.

A `data` property (JS property) is also available, returning the Blob object of the current media file (`null` before loading or after a failure), which is useful for uploading or further processing.

Rendering happens inside a Shadow DOM: the media element is exposed as `part="img"` / `part="audio"` / `part="video"`, so it can be styled with `fs-img::part(img) { ... }` and friends; the default slot content is shown when loading fails or no path is set (e.g. `<fs-audio src="/a.mp3">failed</fs-audio>`).

## Changelog

### 0.2.5
- Optimized code

### 0.2.4
- The `src` attribute of `<fs-img>` / `<fs-audio>` / `<fs-video>` now accepts `http(s)` URLs: the file is cached into `/home/.cache/cloud/<hostname>/<pathname>` and then displayed / played
- Cloud files are now **cache-first**: the existing cache is shown immediately, then a HEAD request validates the remote file size; a size mismatch, a missing Content-Type, or an undisplayable cache triggers a fresh download and refresh
- `downloadFile` supports multi-threaded downloads (4 threads by default, configurable via `threads`, 1-8, using parallel Range chunks); it falls back to a single thread when the file is too small, the server ignores Range, or a chunk fails
- Added `vvvfs.head(url)`, returning the remote `Content-Length` / `Content-Type` / `acceptRanges`

### 0.2.3

- Added the `<fs-audio>` custom element to play audio files stored in vvvfs directly
- Added the `<fs-video>` custom element to play video files stored in vvvfs directly
- Added the `data` property to `<fs-img>` / `<fs-audio>` / `<fs-video>`, returning the Blob object of the current media file (`null` before loading)
- The `watch` attribute of `<fs-img>` / `<fs-audio>` / `<fs-video>` now accepts `true` / `false`; `false` stops the file watching

### 0.2.2

- Added the `<fs-img>` custom element to display image files stored in vvvfs directly
- Added the `src` / `path` / `dbname` / `alt` / `width` / `height` / `watch` attributes to `<fs-img>`
- Added the `load` / `error` events and the `data-state` attribute to `<fs-img>`
- `<fs-img>` renders inside a Shadow DOM, supporting `::part(img)` styling and a default slot fallback

### 0.2.1

- Added the `setHide` method to set the hidden attribute of a file or directory
- Added the `getHide` method to get the hidden attribute of a file or directory
- Added the `hidden` field to `FileRecord`
- Added database version 3 migration to automatically fill `hidden: false` for existing records

### 0.2.0

- Added the `registerMIMEType` static method for registering custom MIME types

### 0.1.9

- Added the `saveFile` method for saving files
- Added the `downloadFile` method for downloading files to IndexedDB (supports both `fetch` and `xhr` modes, as well as progress, error, and success callbacks)
- Added the `save` and `download` methods to the `VVVFS.File` class

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
