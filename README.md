# Quick Launch

跨平台快捷指令启动器 — 类似 Alfred / Raycast 的桌面效率工具。

通过全局热键 **⌥ + ⇧ + 空格**（Mac）或 `Alt+Shift+Space`（Windows/Linux）唤出搜索框，快速启动应用、搜索文件、执行计算、搜索网页、运行自定义命令。

---

## 下载安装（普通用户）

**无需 Node.js，无需命令行。** 下载对应系统的安装包，双击安装即可。

| 系统 | 下载 | 安装方式 |
|------|------|----------|
| **macOS** | `.dmg` | 打开 DMG，拖入「应用程序」 |
| **Windows** | `.exe` | 双击安装向导 |
| **Windows 便携版** | `-portable.exe` | 双击即用，免安装 |
| **Linux** | `.AppImage` / `.deb` | 见下方说明 |

> 安装包请从 [Releases 发布页](https://github.com/MMCISAGOODMAN/quick-launch/releases) 下载。

**详细图文安装步骤、权限设置、常见问题** → [用户安装指南](docs/user-guide.md)

### 快速上手

1. 安装并打开 Quick Launch
2. 按 **⌥ Option + ⇧ Shift + 空格**（Mac）或 **Alt + Shift + Space**（Windows）唤出搜索框
3. 输入应用名、`g 关键词`（Google 搜索）、`12*34`（计算）等
4. **`Enter`** 执行，**`Esc`** 关闭

| 输入示例 | 效果 |
|----------|------|
| `chrome` | 打开应用 |
| `report` | 搜索本地文件 |
| `g electron` | Google 搜索 |
| `12*34+56` | 计算器 |
| `clip 文字` | 搜索剪贴板 |
| `设置` | 打开可视化设置 |

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 全局热键 | Mac：`⌥⇧空格` · Win：`Alt+Shift+Space` 唤出/隐藏 |
| 应用搜索 | 跨平台扫描已安装应用，拼音首字母 + 模糊匹配 |
| 文件搜索 | macOS 使用 Spotlight 全盘索引 |
| Web 搜索 | `g 关键词` 搜索 Google，可配置多个引擎 |
| 计算器 | 输入表达式直接出结果 |
| 自定义命令 | 配置系统命令一键执行 |
| 剪贴板历史 | 最近 50 条，`clip 关键词` 搜索粘贴 |
| 暗色/亮色主题 | 搜索 `主题` 或界面右下角切换 |

---

## 修改设置

任选一种方式：

| 方式 | 操作 |
|------|------|
| 可视化设置 | 搜索框输入 **`设置`** |
| 编辑配置文件 | 搜索框输入 **`config`** 或 **`Open Config`** |

### 配置文件位置

| 系统 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/quick-launch/config.json` |
| Windows | `%APPDATA%\quick-launch\config.json` |
| Linux | `~/.config/quick-launch/config.json` |

首次启动时会从内置模板自动生成。

### 常用配置项

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `hotkey` | 全局热键（Mac 上 `Alt` = ⌥ Option） | `"Alt+Shift+Space"` |
| `theme` | 主题：`dark` / `light` / `system` | `"dark"` |
| `maxResults` | 搜索结果最大条数 | `20` |
| `fileSearch.enabled` | 是否启用文件搜索 | `true` |
| `fileSearch.searchPaths` | 搜索范围；`[]` 表示整个磁盘 | `[]` |

在设置界面修改热键后会自动重新注册，无需重启。

---

## 开发者 / 维护者

```bash
npm install
npm run dev          # 本地开发
npm run build:mac    # 打包 macOS .dmg
npm run build:win    # 打包 Windows .exe
npm run build:linux  # 打包 Linux .AppImage
```

产物输出到 `release/` 目录。打 tag `v*` 后 GitHub Actions 会自动构建三平台安装包并发布 Release。

### 技术栈

Electron 34 · Vite 6 · Vue 3 · TypeScript · sql.js · electron-builder

### 项目结构

```
quick-launch/
├── electron/          # 主进程（热键、搜索、存储）
├── src/               # Vue 界面
├── config/            # 默认配置模板
├── plugins/           # 插件示例
├── docs/              # 用户安装指南
└── resources/         # 应用图标
```

---

## License

MIT
