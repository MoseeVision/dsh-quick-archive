# dsh-quick-archive

**English** · [中文](#中文-dsh-quick-archive)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web plugin: every session row in the
sidebar gains a one-click **Archive** icon button in its trailing action area, right beside the `⋯` menu, so
archiving a session takes one click instead of a menu detour.

## Features

- One archive icon button per session row, revealed on hover exactly like the shipped `⋯` button.
- One click archives that session — no menu to open, no dialog to confirm.
- The click goes through the declared Client service `ctx.uiWorkspace.archiveSession(sessionId)`, the same
  call the shipped `⋯` → *Archive session* item makes. Archiving the **current** session therefore still
  clears the main panel into the New Session state; no behaviour is re-implemented here.
- Labels come from the Client locale service (zh / en) and the icon inherits the active theme through the
  `--dsw-alias-*` tokens, so light and dark both stay correct.
- Only session rows are touched: workspace rows, search-result rows and the blank "new session" placeholder
  row are left as they are.
- Uninstalling the plugin removes every control it added (listeners, stylesheet and buttons are disposed
  with the Client run).

## Install

Requires the DSH Web profile (`dsh web`).

```sh
# from npm
dsh plugin --profile web add dsh-quick-archive

# or straight from this repository
dsh plugin --profile web add github:MoseeVision/dsh-quick-archive

# or from the prebuilt bundle asset attached to each release
dsh plugin --profile web add https://github.com/MoseeVision/dsh-quick-archive/releases/latest/download/dsh-quick-archive.tgz
```

You can also install it from the **插件 / Plugins** page of the Web GUI, or from the
[dshmarket](https://github.com/dshmarket/dshmarket) storefront once the entry is listed. After installing,
reload the page once: a newly added Client module is served in the boot table, it does not hot-patch into an
already-open tab.

## Usage

Hover any session row in the sidebar → the archive icon appears to the left of `⋯` → click it. The row
disappears from the list.

Restoring a session stays where DSH already put it: **Settings → Archived sessions → Unarchive**
(设置 → 已归档会话 → 取消归档). This plugin adds no second restore surface.

## How it works

The shipped browsing region (`sidebar.workspaces`) exposes no extension hole under a session row — its only
child seat is the directory-flow hole — so this plugin does not claim a slot and does not replace the list.
Instead it contributes into the row's own action span:

1. On `pointerover` / `focusin`, the nearest `div[role="treeitem"]` is resolved and walked up the React fiber
   chain until the session-row props (`node.id` plus the row's `onArchive` action) appear. That is what makes
   workspace rows and search-result rows fall through untouched, and it means a DOM node reused for another
   session can never archive the wrong one — the id is re-read at click time.
2. A plain `<button>` with an inline SVG glyph is inserted as the first child of the row's action span, so it
   sits left of `⋯` and shares the row's hover reveal and `gap: 12px` rhythm.
3. The click calls `ctx.uiWorkspace.archiveSession(id)`, disables the button while the write is in flight,
   and re-enables it only if the Host rejects (the rejection is logged, matching the shipped menu's
   behaviour).

Everything it registers — the locale namespace, the stylesheet, the two document listeners and the injected
buttons — is torn down in the effect clean-up.

## Compatibility

Written against `@deepseek-ai/dsh` 0.1.6-alpha.2 (Web profile). The plugin owns no Host service, no setting
and no storage; the Host half is an empty `apply()`.

## Related

- [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — the host this plugin extends.
- [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) — the curated plugin list
  this package is submitted to (`catalog/awesome-dsh-plugin.yml` holds the ready-to-paste entry).

## License

[MIT](LICENSE)

---

## 中文 (`dsh-quick-archive`)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 端插件：给侧边栏的每一个会话行
加一个**一键归档**图标按钮，位置就在行尾 `⋯` 菜单的左边，归档一个会话从「点开菜单再选一项」变成「一次点击」。

### 功能

- 每个会话行一个归档图标按钮，和原生 `⋯` 一样在悬停该行时出现。
- 点一下立即归档该会话：不展开菜单，也没有确认弹窗。
- 调用的是已声明的 Client 服务 `ctx.uiWorkspace.archiveSession(sessionId)`，与原生 `⋯` → *归档会话* 走的是同
  一条路。因此归档**当前会话**时依然会按原生语义清空主区域回到新会话状态——这里没有重复实现任何归档逻辑。
- 文案走 Client locale 服务（中 / 英），图标用 `--dsw-alias-*` 主题令牌取色，明暗主题都跟随。
- 只处理会话行：工作区行、搜索结果行、空白的「新会话」占位行都不动。
- 卸载插件即收回它加的一切：监听器、样式表和按钮全部随 Client run 释放。

### 安装

需要 DSH 的 Web profile（`dsh web`）。

```sh
# 从 npm 安装
dsh plugin --profile web add dsh-quick-archive

# 或直接从本仓库安装
dsh plugin --profile web add github:MoseeVision/dsh-quick-archive

# 或用每次 Release 附带的预构建 tarball
dsh plugin --profile web add https://github.com/MoseeVision/dsh-quick-archive/releases/latest/download/dsh-quick-archive.tgz
```

也可以在 Web GUI 的**插件**页面安装，条目收录后还能从 [dshmarket](https://github.com/dshmarket/dshmarket)
市场里一键安装。装完请把页面刷新一次：新加入的 Client 模块要出现在启动模块表里，不会热插进已经打开的页面。

### 使用

鼠标移到侧边栏任意会话行 → `⋯` 左侧出现归档图标 → 点一下，该行从列表消失。

恢复入口保持在 DSH 原来的位置：**设置 → 已归档会话 → 取消归档**。本插件不另加第二个恢复入口。

### 实现说明

原生浏览区（`sidebar.workspaces`）在会话行下面没有开放任何扩展位——它唯一的子席位是目录选择流程的 hole——
所以本插件不占 slot、也不替换整个列表，而是往这一行自己的动作区里追加内容：

1. 在 `pointerover` / `focusin` 时找到最近的 `div[role="treeitem"]`，沿 React fiber 向上走到会话行的 props
   （`node.id` 加上这一行的 `onArchive`）出现为止。这一步让工作区行和搜索结果行自然被跳过；也正因为 id 是在
   点击那一刻重新读取的，被复用的 DOM 节点不可能归档错会话。
2. 造一个普通 `<button>`（内联 SVG 图标），插到该行动作区的第一个子节点位置，于是它落在 `⋯` 左边，共享该行
   的悬停显隐与 `gap: 12px` 间距。
3. 点击调用 `ctx.uiWorkspace.archiveSession(id)`，请求在途时禁用按钮；只有 Host 拒绝时才恢复可点，并把拒绝
   记进 console——与原生菜单项的行为一致。

它注册的一切（locale 命名空间、样式表、两个 document 监听器、注入的按钮）都在 effect 的清理函数里回收。

### 兼容性

针对 `@deepseek-ai/dsh` 0.1.6-alpha.2（Web profile）编写。插件不持有 Host 服务、设置项和存储，Host 半边是一
个空的 `apply()`。

### 许可

[MIT](LICENSE)
