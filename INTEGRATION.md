# MajiGame H5 SDK · 接入指南（INTEGRATION GUIDE）

> **本文件的定位**：给**接入方的开发者或 AI agent** 看的"如何在自己的游戏项目里使用本 SDK"权威说明。
>
> **优先级最高，所有跨项目集成都以本文件为准**。
>
> 如果你是修改 SDK 源码的 AI / 开发者，请阅读本文末尾的 [文档维护规则](#文档维护规则给-sdk-开发者ai-看) —— **修改公开 API 时必须同步本文件**。

---

## 0. 这是什么 SDK

MajiGame H5 SDK 是为 [majigame.com](https://majigame.com) 自营 H5 小游戏站提供的 JavaScript SDK，对标 Poki / CrazyGames 的游戏 SDK。让接入的游戏项目快速获得：安全防护、生命周期信号、广告、数据分析、云存档、排行榜等能力。

**适用范围**：浏览器环境 HTML5 游戏。不支持 Node.js / 服务端。

**当前版本**：`v0.1.0`
**最新文档对应版本**：`v0.1.0`

---

## 1. 快速接入（最小可用代码）

复制下面 7 行到游戏 HTML 入口，就能跑：

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.1.0/maji-sdk.min.js"></script>
  <script>
    MajiSDK.init({ gameId: 'your-game-id' })
  </script>
</head>
<body>...game...</body>
</html>
```

这样会启用：默认的反 F12 检测（4399 同款 freeze+tip 效果）、快捷键拦截、右键拦截。

---

## 2. CDN URL 速查

```
https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@<VERSION>/maji-sdk.min.js
```

`<VERSION>` 可以是：

| 形式 | 例子 | 行为 | 推荐场景 |
|---|---|---|---|
| 完整 tag | `v0.1.0` | 锁死该版本，12 个月不可变缓存 | 🌟 生产 |
| 小版本范围 | `v0.1` | 自动跟 v0.1.x 最新 | 想自动拿 bug fix |
| 分支名 | `release` | 总是最新构建，7 天缓存 | 开发测试 |
| commit SHA | `98225ee` | 完全锁定某次构建 | 极端审计场景 |

**重要警告**：`@v0.1.0` 这种锁定版本会被 jsDelivr 缓存 12 个月不可变。**SDK 发出去就改不了**，必须靠发新版本修 bug。所以接入方推荐用 `@v0.1`（跟 patch）平衡稳定性和修复速度。

也可以引 ESM 版本（用于打包工具集成）：
```js
// vite / webpack / rollup 项目
// 不推荐：CDN ESM 性能差，建议 npm install 走本地打包
```

---

## 3. 当前实现状态

接入方 AI **不要推荐没实现的功能**。下表是真相：

| 模块 | 状态 | 说明 |
|---|---|---|
| 安全防护 / 反 F12 | ✅ **已实现** | anti-debug + shortcuts + domain-lock |
| 初始化 / 销毁 / 事件 | ✅ **已实现** | init / destroy / on / off |
| 游戏生命周期信号 | ⏳ 未实现 | gameplayStart / gameplayStop / happyTime 等（第 3 期） |
| 广告 | ⏳ 未实现 | preroll / interstitial / rewarded / banner（第 6 期） |
| 数据分析 / 埋点 | ⏳ 未实现 | analytics.track 队列上报（第 4 期） |
| 用户系统 / 云存档 | ⏳ 未实现 | 第 7 期 |
| 排行榜 / 成就 / 防作弊 | ⏳ 未实现 | 第 8 期 |
| 分享 / 交叉推广 / 本地化 | ⏳ 未实现 | 第 9 期 |

未实现的功能调用会**报 `undefined` 错误**，不会回退到 noop。例如 `MajiSDK.analytics` 当前**不存在**。

完整路线图见 [需求顺序.md](需求顺序.md)。

---

## 4. 公开 API 参考

挂在 `window.MajiSDK` 全局对象上：

| 成员 | 签名 | 说明 |
|---|---|---|
| `VERSION` | `string` | SDK 版本号字符串，如 `"0.1.0"` |
| `init` | `(options?: MajiSDKOptions) => void` | 初始化 SDK。**重复调用会被忽略**，需要重新配置先 `destroy()` |
| `destroy` | `() => void` | 停止所有检测、移除监听、清空事件总线 |
| `isReady` | `() => boolean` | 是否已 init 完成 |
| `isDetected` | `() => boolean` | 当前是否处于"检测到 DevTools"状态（被反调试模块标记） |
| `on` | `(event: string, fn: (...args) => void) => () => void` | 监听事件，返回 unsubscribe 函数 |
| `off` | `(event: string, fn: Function) => void` | 移除监听 |

### 内置事件

| 事件名 | 触发时机 | 回调参数 |
|---|---|---|
| `'ready'` | init 完成时一次性触发 | 无 |
| `'destroy'` | destroy 调用时触发 | 无 |

> 未来会扩展更多事件（生命周期、广告、检测命中等），届时本表同步。

---

## 5. 配置选项完整参考

完整 TS 类型：

```ts
interface MajiSDKOptions {
  gameId?: string           // 默认 'unknown'。建议每个游戏唯一标识
  debug?: boolean           // 默认 false。开启后 SDK 内部 console.log 可见
  security?: SecurityOptions
}

interface SecurityOptions {
  antiDebug?: AntiDebugOptions | boolean
  shortcuts?: ShortcutsOptions | boolean
  domainLock?: DomainLockOptions | boolean
}
```

每个子模块都接受 **三种形态**：
- `true` 或 `undefined` → 用默认配置开启
- `false` → 关闭该模块
- 对象 → 与默认值合并

### 5.1 `security.antiDebug` —— 反调试

```ts
interface AntiDebugOptions {
  enabled?: boolean         // 默认 true
  detectors?: DetectorName[] // 默认全部 5 种
  interval?: number          // 默认 1500（ms）。检测轮询间隔
  onDetect?: DetectAction    // 默认 'freeze+tip'
  tipText?: string           // 默认 '检测到您打开了开发者工具，请关闭后继续游戏'
  tipTitle?: string          // 默认 '安全提示'
  redirectUrl?: string       // onDetect='redirect' 时跳转地址
  reportUrl?: string         // onDetect='report' 时上报地址（POST，body 是 JSON）
  autoRecover?: boolean      // 默认 true。DevTools 关闭后自动撤销动作
  zIndex?: number            // 默认 2147483647（max int）。遮罩层 z-index
}

type DetectorName = 'debugger' | 'timing' | 'console' | 'size' | 'toString'

type DetectAction =
  | 'freeze+tip'  // 默认。debugger 死循环 + 全屏遮罩提示（4399 同款）
  | 'freeze'      // 仅 debugger 死循环
  | 'tip'         // 仅遮罩
  | 'blur'        // 同 tip（保留扩展位）
  | 'redirect'    // 跳转 redirectUrl
  | 'reload'      // 刷新页面
  | 'report'      // 静默上报 reportUrl，玩家无感知
  | 'noop'        // 仅记录，不做任何动作（开发期/调试用）
```

**5 个检测器的特性差异**（接入方需要知道）：

| 检测器 | 可靠性 | 副作用 | 误伤风险 |
|---|---|---|---|
| `debugger` | 高 | 触发会卡住调试器 | 低 |
| `timing` | 中 | 同上，自适应基线 | 中（性能差的机器） |
| `console` | 中 | 无 | 部分浏览器无效 |
| `size` | 中 | 无 | **测不到 undocked DevTools** |
| `toString` | 高 | 无 | **一旦触发不可恢复**（hook 持续存在） |

### 5.2 `security.shortcuts` —— 快捷键 / 右键拦截

```ts
interface ShortcutsOptions {
  enabled?: boolean          // 默认 true
  blockContextMenu?: boolean // 默认 true，拦截右键菜单
  blockSelection?: boolean   // 默认 false，禁用文本选中/拖拽/复制
  blockKeys?: boolean        // 默认 true，拦截 F12/Ctrl+Shift+I/J/C/Ctrl+U/Ctrl+S
  allowSelector?: string     // 默认 'input, textarea, [contenteditable="true"]'
                             // 匹配此 CSS 选择器的元素及其子代会被放行
}
```

### 5.3 `security.domainLock` —— 域名 / 来源校验

```ts
interface DomainLockOptions {
  enabled?: boolean          // 默认 false
  allowedHosts?: string[]    // hostname 白名单，支持 '*.example.com' 通配
  checkReferrer?: boolean    // 默认 false
  allowedReferrers?: string[] // referrer hostname 白名单
  onViolation?: DetectAction // 违规动作，默认 'redirect'
  redirectUrl?: string
  reportUrl?: string
}
```

**注意**：
- `file://` 协议自动跳过（方便本地双击 HTML 调试）
- 域名校验在 `init()` 时执行一次。如果失败，**不会启动 shortcuts 和 antiDebug**

---

## 6. 典型场景代码（Recipes）

### 6.1 最严的安全防护（生产环境推荐）

```js
MajiSDK.init({
  gameId: 'cat-jumper',
  security: {
    antiDebug: {
      onDetect: 'freeze+tip',
      interval: 1500,
      autoRecover: true,
    },
    shortcuts: { blockContextMenu: true, blockKeys: true },
    domainLock: {
      enabled: true,
      allowedHosts: ['majigame.com', '*.majigame.com'],
      onViolation: 'redirect',
      redirectUrl: 'https://majigame.com',
    },
  },
})
```

### 6.2 开发期：关掉所有安全干扰

```js
MajiSDK.init({
  gameId: 'cat-jumper',
  debug: true,
  security: {
    antiDebug: false,
    shortcuts: false,
    domainLock: false,
  },
})
```

### 6.3 只用上报，不打扰玩家

```js
MajiSDK.init({
  gameId: 'cat-jumper',
  security: {
    antiDebug: {
      onDetect: 'report',
      reportUrl: 'https://api.majigame.com/security/report',
    },
  },
})
```

### 6.4 只检测 debugger，跳过窗口尺寸（避免外接显示器误伤）

```js
MajiSDK.init({
  gameId: 'cat-jumper',
  security: {
    antiDebug: {
      detectors: ['debugger', 'console', 'toString'],
    },
  },
})
```

### 6.5 监听 ready 事件

```js
MajiSDK.on('ready', () => {
  console.log('SDK ready, game start')
  startGame()
})
MajiSDK.init({ gameId: 'cat-jumper' })
```

### 6.6 检查当前是否被 DevTools 检测到（用于自定义业务逻辑）

```js
setInterval(() => {
  if (MajiSDK.isDetected()) {
    pauseGame()
  } else {
    resumeGame()
  }
}, 1000)
```

### 6.7 销毁 SDK（场景切换时）

```js
MajiSDK.destroy()
// 之后可以再次 init，配置可以不同
MajiSDK.init({ /* 新配置 */ })
```

---

## 7. 已知边界与限制

接入方需要知道：

### 7.1 安全防护的真实能力
**能挡**：好奇玩家、随手 F12、复制小白、普通脚本党
**挡不住**：专业逆向、Charles/Fiddler 抓包、浏览器扩展直接读 Sources、外接 Chrome DevTools Protocol

真正的护城河是**服务端校验**（计分签名、付费校验、关键随机数）。当前 SDK **没有**服务端联动（第 5 期才加 Cloudflare Workers 后端）。**所以现阶段不要把分数提交、付费校验放在前端做防作弊**，要等后端模块落地。

### 7.2 SDK 初始化是一次性的
`MajiSDK.init()` 第二次调用会被**静默忽略**（除非先 destroy）。

### 7.3 域名锁定失败的影响
如果 `domainLock` 违规，整个 security 模块都不会启动（`antiDebug` 和 `shortcuts` 也不生效）。

### 7.4 toString 检测器不可恢复
一旦 `toString` 检测器触发，由于 hook 持久存在，`autoRecover: true` 也不会撤销动作。这种情况下页面只能刷新恢复。

### 7.5 移动端表现
- `size` 检测器在移动端 `outerHeight`/`outerWidth` 可能为 0 → 直接跳过
- 长按右键菜单会被 `blockContextMenu: true` 阻断
- 移动端没有 F12，`blockKeys` 在移动端几乎无效

### 7.6 SSR / Node 不可用
SDK 完全依赖浏览器 API（`window`、`document`、`location`），不能在 Node.js 或 SSR 环境引入。如果用 Next.js / Nuxt 等框架，只在客户端 `<script>` 引入。

### 7.7 CSP 限制
如果接入方的页面有严格 CSP，需要允许：
- `script-src 'unsafe-eval'`（SDK 用 `new Function('debugger')` 触发反调试，需要 eval）
- 否则反调试会降级为 no-op（但不报错）

---

## 8. 升级 SDK 版本

每个版本的破坏性变更会在 GitHub Release 页面用 `BREAKING CHANGES` 标注：
https://github.com/SYRollingStone/MajiGame-H5-SDK/releases

升级方法：把 HTML 里的 `@v0.1.0` 改成新版本号即可。jsDelivr 缓存 12 个月，**老版本永远可用**，所以可以放心切换。

---

## 9. 故障排除

| 现象 | 可能原因 | 排查 |
|---|---|---|
| `MajiSDK is not defined` | `<script>` 还没加载 / URL 错误 | 检查 Network、确认 URL 200 |
| F12 没被拦截 | shortcuts 关了 / 在 allowSelector 元素里按 | 检查配置 |
| F12 拦截了但没遮罩 | `autoRecover: false` 模式下 DevTools 关了 / `onDetect` 不是 `freeze+tip` | 看 isDetected() 是不是 true |
| 检测一直误报 | 浏览器扩展 / 调试代理工具开着 | 关掉相关扩展验证 |
| 移动端右键长按还能弹菜单 | iOS Safari 个别版本 quirk | 看 webkit-touch-callout CSS |
| 域名锁住进不去 | hostname 不在 allowedHosts | console 看 `domain lock violation` 报错 |

---

## 文档维护规则（给 SDK 开发者/AI 看）

> **如果你是修改 SDK 源码的人或 AI，请遵守本节规则。**

### 必须同步本文件的情况

下面 5 种代码变更**必须**同时改 INTEGRATION.md，否则 PR/commit 不算完成：

1. **新增或删除公开 API**（`MajiSDK.xxx` 上的方法/属性）→ 更新 [第 4 节](#4-公开-api-参考)
2. **修改任何 `*Options` 类型字段、默认值、可选值** → 更新 [第 5 节](#5-配置选项完整参考)
3. **新增/删除事件名** → 更新 [第 4 节 - 内置事件](#内置事件)
4. **新增模块、模块状态从未实现→已实现** → 更新 [第 3 节](#3-当前实现状态)
5. **发现新的浏览器兼容性 / CSP 等限制** → 更新 [第 7 节](#7-已知边界与限制)

### 不需要改本文件的情况
- 修内部 bug、重构、性能优化（不影响公开 API 和行为）
- 改 detector 内部实现但不改 detector 名字和效果
- 修文档错别字、补内部注释

### 同步检查 checklist（发版前）

1. `src/types.ts` 的所有公开 type / interface 字段 ↔ 本文件第 5 节
2. `src/index.ts` 的所有 export ↔ 本文件第 4 节
3. `需求顺序.md` 的模块状态 ↔ 本文件第 3 节
4. 任何新加的事件 emit ↔ 本文件 [内置事件](#内置事件) 表

### 风格约束
- 中文为主
- 代码示例必须可直接复制运行
- 每个 API 必须给 TS 签名
- "默认值"必须明确写出，不要靠读者猜
- **不要承诺没实现的功能**。未实现的写"⏳ 未实现"，不要写"即将到来"

### 文档与代码冲突时
代码为准。本文件落后于代码 = bug，立即修。
