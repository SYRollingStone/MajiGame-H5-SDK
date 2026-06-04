# 安全模块文档

`MajiSDK.security` 包含三个子模块：`antiDebug`、`shortcuts`、`domainLock`。

## 完整配置示例

```js
MajiSDK.init({
  gameId: 'your-game-id',
  debug: false,
  security: {
    antiDebug: {
      enabled: true,
      detectors: ['debugger', 'timing', 'console', 'size', 'toString'],
      interval: 1500,
      onDetect: 'freeze+tip',
      tipText: '检测到您打开了开发者工具，请关闭后继续游戏',
      tipTitle: '安全提示',
      autoRecover: true,
      redirectUrl: '',
      reportUrl: '',
      zIndex: 2147483647
    },
    shortcuts: {
      enabled: true,
      blockContextMenu: true,
      blockKeys: true,
      blockSelection: false,
      allowSelector: 'input, textarea, [contenteditable="true"]'
    },
    domainLock: {
      enabled: true,
      allowedHosts: ['majigame.com', '*.majigame.com', 'localhost', '127.0.0.1'],
      checkReferrer: false,
      allowedReferrers: ['majigame.com'],
      onViolation: 'redirect',
      redirectUrl: 'https://majigame.com',
      reportUrl: ''
    }
  }
})
```

每个子模块也可以传 `true`（使用默认配置）/ `false`（关闭）：

```js
security: {
  antiDebug: true,        // 默认开
  shortcuts: false,       // 关闭
  domainLock: { ... }     // 自定义
}
```

---

## antiDebug —— 反调试

### 检测器（detectors）
5 种独立检测器并联运行，任意一个命中即视为 DevTools 打开。

| 名称 | 原理 | 误伤风险 |
|---|---|---|
| `debugger` | `Function('debugger')()` 单次调用 + 时间差检测，DevTools 打开会卡住 100ms+ | 低 |
| `timing` | 同上，但用自适应基线，更严格 | 中（旧机器卡顿可能误判） |
| `console` | `console.log(obj)` 时 DevTools 会读取 `obj` 属性，捕获 getter 触发 | 中（部分浏览器版本无效） |
| `size` | `window.outerHeight - innerHeight > 160` —— DevTools 停靠时尺寸差异常 | 高（外部停靠 DevTools 无效） |
| `toString` | 检测 `Function.prototype.toString` 是否被 hook | 低（一旦触发不可恢复） |

按需裁剪：
```js
antiDebug: { detectors: ['debugger', 'console'] }
```

### 命中动作（onDetect）
| 值 | 行为 |
|---|---|
| `'freeze+tip'`（默认） | 调试器死循环卡住 + 全屏遮罩提示 —— **4399 同款** |
| `'freeze'` | 仅死循环，无遮罩 |
| `'tip'` | 仅遮罩，无 freeze |
| `'blur'` | 同 `'tip'`（保留扩展） |
| `'redirect'` | 跳转到 `redirectUrl` |
| `'reload'` | 刷新页面 |
| `'report'` | 静默上报到 `reportUrl`，玩家无感知 |
| `'noop'` | 仅触发回调，不做任何动作（用于开发期/调试） |

### 自动恢复（autoRecover）
默认 `true`。检测到 DevTools 关闭后，遮罩和 freeze 循环会自动撤掉，游戏恢复。如果想让玩家"打开 F12 一次就强制刷新"，设为 `false`。

### 检测间隔（interval）
默认 1500ms。太低会影响性能，太高用户能短暂瞥到源码。范围建议 1000~3000。

---

## shortcuts —— 快捷键 / 右键拦截

### 默认拦截项
- `F12`
- `Ctrl+Shift+I` / `Ctrl+Shift+J` / `Ctrl+Shift+C`（开发者工具）
- `Ctrl+U`（查看源码）
- `Ctrl+S`（保存页面）
- 右键 `contextmenu` 菜单

### allowSelector —— 局部放行
游戏内的输入框、文本编辑器需要正常右键 / 文本选中，匹配此 CSS 选择器的元素及其子元素会被放行。默认值已经覆盖 `input`、`textarea`、`[contenteditable]`。

### blockSelection
默认 `false`。开启后会禁用文本选中、拖拽、复制（仍受 `allowSelector` 影响）。

### iframe 嵌入下的跨窗口拦截（v0.2.0+）
被 iframe 嵌入时按 F12 通常焦点在父窗口，SDK 内的 keydown 监听收不到。SDK 启动时检测到处于 iframe 会自动 `postMessage` 给父窗口请求协助拦截，父窗口需实现一段桥接监听器。**完整协议和参考实现见 [INTEGRATION.md 5.2](../INTEGRATION.md#52-securityshortcuts--快捷键--右键拦截)**。

---

## domainLock —— 域名 / 来源校验

### allowedHosts
hostname 白名单，支持 `*.example.com` 通配符。`file://` 协议自动跳过（方便本地双击 HTML 调试）。

### checkReferrer + allowedReferrers
如果只允许从特定域名内嵌的 iframe 中加载，开启 `checkReferrer` 并配置 `allowedReferrers`。

### onViolation
违规时的动作，含义同 `antiDebug.onDetect`，默认 `'redirect'`。

> **提示**：要彻底防止其他网站 iframe 嵌入你的游戏，应同时配置 Cloudflare Pages 的 HTTP 响应头 `Content-Security-Policy: frame-ancestors ...`。前端 JS 校验是辅助。

---

## SDK API

```js
MajiSDK.VERSION             // 版本号字符串
MajiSDK.init(options)       // 初始化（重复调用会被忽略）
MajiSDK.destroy()           // 停止所有检测，移除监听
MajiSDK.isReady()           // 是否已 init
MajiSDK.isDetected()        // 当前是否处于"检测到 DevTools"状态
MajiSDK.on(event, fn)       // 监听事件（'ready' / 'destroy'），返回 unsubscribe
MajiSDK.off(event, fn)
```

## 防护边界（务必了解）

**能挡住**：好奇玩家、随手 F12、复制小白、普通脚本党。

**挡不住**：
- 专业逆向 / 反混淆工具（混淆只能延缓，不能阻止）
- Charles / Fiddler 抓包看网络请求
- 浏览器扩展直接读取 Sources 面板
- 外接 Chrome DevTools Protocol（如 Puppeteer）

**真正的安全**是把核心校验（分数提交签名、付费校验、随机数生成）放到服务端 Worker（后续第 5、8 期实现）。前端 SDK 的安全模块只是"提高破解门槛"，不要把它当成最终防线。
