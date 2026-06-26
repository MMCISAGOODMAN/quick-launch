# Quick Launch 用户安装指南

无需安装 Node.js，无需懂代码。下载对应系统的安装包，双击安装即可使用。

## 下载

从 [Releases 发布页](https://github.com/MMCISAGOODMAN/quick-launch/releases) 下载最新版本：

| 系统 | 安装包 | 说明 |
|------|--------|------|
| macOS (Apple 芯片) | `Quick-Launch-*-mac-arm64.dmg` | 拖入「应用程序」文件夹 |
| macOS (Intel) | `Quick-Launch-*-mac-x64.dmg` | 拖入「应用程序」文件夹 |
| Windows | `Quick-Launch-*-win-x64.exe` | 安装向导，按提示完成 |
| Windows 便携版 | `Quick-Launch-*-win-x64-portable.exe` | 免安装，双击即用 |
| Linux | `Quick-Launch-*-linux-x64.AppImage` | 添加执行权限后运行 |
| Linux (Debian/Ubuntu) | `Quick-Launch-*-linux-x64.deb` | 双击或用包管理器安装 |

## 安装步骤

### macOS

1. 打开下载的 `.dmg` 文件
2. 将 **Quick Launch** 拖入 **应用程序** 文件夹
3. 从启动台或应用程序文件夹打开 Quick Launch
4. 若提示「无法验证开发者」，请前往 **系统设置 → 隐私与安全性**，点击 **仍要打开**

**全局热键权限（必做）：**

macOS 需要授权才能使用全局热键（默认 **⌥ Option + ⇧ Shift + 空格**，配置文件中写作 `Alt+Shift+Space`）：

1. 打开 **系统设置 → 隐私与安全性 → 辅助功能**
2. 点击 **+**，添加 **Quick Launch**
3. 确保开关已打开

### Windows

1. 双击 `Quick-Launch-*-win-x64.exe`
2. 选择安装目录，按向导完成安装
3. 安装完成后从桌面或开始菜单启动 **Quick Launch**
4. 应用会在后台运行，按 **⌥ + ⇧ + 空格** 唤出搜索框

便携版：下载 `*-portable.exe`，放到任意文件夹，双击运行即可。

### Linux

**AppImage：**

```bash
chmod +x Quick-Launch-*-linux-x64.AppImage
./Quick-Launch-*-linux-x64.AppImage
```

**Debian / Ubuntu：**

```bash
sudo dpkg -i Quick-Launch-*-linux-x64.deb
```

## 开始使用

Quick Launch **没有传统的主窗口**，这是正常设计——它像 Alfred / Raycast 一样在后台运行，只通过搜索框与你交互。

1. 启动 Quick Launch（macOS 启动后会在后台驻留，Dock 可能看不到图标）
2. 按 **⌥ Option + ⇧ Shift + 空格** 唤出搜索框（这就是全部界面）
3. 输入关键词搜索应用、文件、网页、命令等
4. 按 **`Esc`** 关闭搜索框

### 菜单栏图标（macOS）

Quick Launch 在菜单栏显示图标，点击可打开/关闭搜索，右键菜单提供：

- 打开搜索
- 切换主题
- 打开配置
- 退出 Quick Launch

若 Dock 中看不到应用，可通过菜单栏图标管理或退出。

### 切换主题

任选一种方式：

| 方式 | 操作 |
|------|------|
| 搜索命令 | 输入 `主题` 或 `切换主题`，回车 |
| 快捷键 | 搜索框内按 **`Cmd + T`**（Windows 为 `Ctrl + T`） |
| 底部按钮 | 搜索框右下角点击 **「主题：暗色」** 或 **「主题：亮色」** |

切换后搜索框会保持打开，方便你立即看到效果。

### 常用操作

| 输入 | 效果 |
|------|------|
| `chrome` | 搜索并打开应用 |
| `report` | 搜索本地文件（macOS 使用 Spotlight 索引） |
| `g 关键词` | Google 搜索 |
| `12*34` | 计算器（Enter 复制结果） |
| `clip 关键词` | 搜索剪贴板历史 |
| `snip 关键词` | 搜索并粘贴文本片段 |
| `设置` | 打开可视化设置界面 |

| 按键 | 功能 |
|------|------|
| `⌥ + ⇧ + 空格` | 唤出 / 隐藏 |
| `↑` `↓` | 选择结果 |
| `Tab` / `Cmd+K` | 切换次要动作（打开 / 复制路径等） |
| `Enter` | 执行 |
| `Esc` | 关闭 |

## 修改设置（无需懂代码）

Quick Launch 的配置保存在本地，用系统自带的文本编辑器即可修改：

1. 按 **⌥ + ⇧ + 空格** 打开搜索框
2. 输入 **`设置`** 打开可视化设置，或输入 **`config`** 打开配置文件

配置文件位置：

| 系统 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/quick-launch/config.json` |
| Windows | `%APPDATA%\quick-launch\config.json` |
| Linux | `~/.config/quick-launch/config.json` |

更多配置字段说明见仓库根目录 [README.md](../README.md#修改设置) 中的「常用配置项」。

## 卸载

### macOS

将 **应用程序** 中的 Quick Launch 拖入废纸篓。可选：删除 `~/Library/Application Support/quick-launch/` 清除数据。

### Windows

**设置 → 应用 → 已安装的应用** 中找到 Quick Launch 并卸载。

### Linux

```bash
# AppImage：删除文件即可
# deb：
sudo dpkg -r quick-launch
```

## 常见问题

**按 ⌥ + ⇧ + 空格 没有反应？**

- macOS：检查是否已在「辅助功能」中授权（见上方说明）
- Windows：确认没有其他软件占用 `Alt+Space` 热键
- 确认 Quick Launch 正在运行（查看菜单栏 / 系统托盘）

**macOS 提示「已损坏，无法打开」？**

在终端执行（将路径替换为实际 App 路径）：

```bash
xattr -cr /Applications/Quick\ Launch.app
```

**如何开机自启？**

- macOS：**系统设置 → 通用 → 登录项**，添加 Quick Launch
- Windows：安装时可勾选相关选项，或手动将快捷方式放入启动文件夹
- Linux：在桌面环境的「自启动应用程序」中添加
