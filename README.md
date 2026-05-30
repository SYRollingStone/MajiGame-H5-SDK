# MajiGame H5 SDK

为 [majigame.com](https://majigame.com) 自营 H5 小游戏站打造的 SDK，对标 Poki / CrazyGames。

当前版本：`v0.1.0`（**第 1 期：安全防护模块**）

完整开发计划见 [需求顺序.md](./需求顺序.md)。

---

## 通过 CDN 引入（生产推荐）

发版后 jsDelivr 自动从 release 分支拉取产物：

```html
<!-- 锁定具体版本（推荐生产环境）-->
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.1.0/maji-sdk.min.js"></script>

<!-- 跟随 v0.1.x 最新 -->
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.1/maji-sdk.min.js"></script>

<!-- 总是最新（不推荐生产）-->
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@release/maji-sdk.min.js"></script>
```

| URL 模式 | 含义 | jsDelivr 缓存 | 推荐场景 |
|---|---|---|---|
| `@v0.1.0` | 锁死该版本 | 12 个月 | 🌟 生产 |
| `@v0.1` | 跟随小版本 | 12 个月（变更新缓存） | 想自动拿 bug 修复 |
| `@release` | 跟随最新 | 7 天 | 开发测试 |
| `@<commit-sha>` | 锁定 commit | 12 个月 | 极端审计场景 |

---

## 快速开始

```bash
# 克隆仓库
git clone git@github.com:SYRollingStone/MajiGame-H5-SDK.git
cd MajiGame-H5-SDK

# 安装依赖并打包
npm install
npm run build

# 启动本地测试服务器
npm run serve
# → http://localhost:5173/examples/security-demo.html
# → http://localhost:5173/test-consumer/index.html
```

---

## 当前已实现功能

### 安全防护（`security`）
- ✅ **反调试**（5 类检测器：`debugger` 陷阱 / 时间差 / `console` getter / 窗口尺寸 / `toString` 篡改）
- ✅ **命中动作**：`freeze+tip`（4399 同款 —— 调试器卡死 + 全屏遮罩提示），关闭 DevTools 后自动恢复
- ✅ **快捷键拦截**：F12、Ctrl+Shift+I/J/C、Ctrl+U、Ctrl+S、右键菜单
- ✅ **域名锁定**：hostname 白名单 + referrer 校验

---

## 接入方式（CDN `<script>`）

```html
<script src="https://cdn.majigame.com/sdk/maji-sdk.min.js"></script>
<script>
  MajiSDK.init({
    gameId: 'cat-jumper',
    security: {
      antiDebug: { enabled: true, onDetect: 'freeze+tip' },
      shortcuts: { enabled: true },
      domainLock: {
        enabled: true,
        allowedHosts: ['majigame.com', '*.majigame.com'],
        onViolation: 'redirect',
        redirectUrl: 'https://majigame.com'
      }
    }
  })
</script>
```

完整配置见 [docs/security.md](./docs/security.md)。

---

## 开发与构建

```bash
# 安装依赖
npm install

# 类型检查
npm run type-check

# 打包（产出 dist/maji-sdk.min.js，已混淆）
npm run build

# 启动本地静态服务器（开发/接入测试用）
npm run serve
# 然后访问：
#   http://localhost:5173/examples/security-demo.html
#   http://localhost:5173/test-consumer/index.html
```

构建产物：
- `dist/maji-sdk.min.js` — UMD，浏览器 `<script>` 直接引（推荐）
- `dist/maji-sdk.js` — ESM，供 npm/构建工具使用
- `dist/*.d.ts` — TypeScript 类型声明

---

## 发版流程

```bash
npm run release -- 0.2.0
```

剩下交给 [GitHub Actions](.github/workflows/release.yml)：自动 build → 推 release 分支 → 打 tag → 创建 GitHub Release。1~2 分钟后 jsDelivr `@v0.2.0` 即可用。

**详细 SOP、常见错误处理、紧急情况见 → [RELEASING.md](./RELEASING.md)**

---

## 本仓库的两种验证场景

### 1. SDK 仓库内自测（`examples/`）
- 文件：[examples/security-demo.html](./examples/security-demo.html)
- 用途：SDK 开发期间快速验证安全模块各项功能
- 通过相对路径 `../dist/maji-sdk.min.js` 引入

### 2. 模拟第三方游戏接入（`test-consumer/`）
- 文件：[test-consumer/index.html](./test-consumer/index.html)
- 用途：模拟"第三方游戏通过 `<script src>` 引入 SDK"的真实接入流程
- 验证完整发布链路：打包 → CDN 引入 → 调用 API → 功能正常
- 包含一个最简点击得分小游戏作为载体

### 全链路验证步骤
1. `npm run build` —— SDK 打包出 `dist/maji-sdk.min.js`
2. `npm run serve` —— 启动本地 HTTP 服务器
3. 浏览器访问 `http://localhost:5173/test-consumer/index.html`
4. 验证清单：
   - [ ] 页面正常加载，右上角显示 SDK 版本号
   - [ ] 点击屏幕可以正常得分（不被安全模块影响）
   - [ ] 按 F12 → 调试器被卡住，全屏遮罩出现
   - [ ] 关闭 DevTools → 遮罩自动消失，游戏恢复
   - [ ] 右键点击 → 菜单不弹出
   - [ ] 按 Ctrl+U / Ctrl+S → 无反应
5. **生产部署时**：把 `dist/maji-sdk.min.js` 上传到 CDN（Cloudflare Pages / R2），把 `<script src>` 改成 CDN 地址即可

---

## 项目结构

```
MajiGame-H5-SDK/
├── src/
│   ├── core/                   # 基础设施
│   │   ├── config.ts           # 配置合并 + 默认值
│   │   ├── event-bus.ts        # 事件总线
│   │   └── logger.ts           # debug 日志
│   ├── modules/
│   │   └── security/           # 第 1 期：安全模块
│   │       ├── anti-debug/
│   │       │   ├── detectors.ts   # 5 类检测器
│   │       │   ├── overlay.ts     # 提示遮罩
│   │       │   ├── manager.ts     # 主调度 + 恢复机制
│   │       │   └── index.ts
│   │       ├── shortcuts.ts    # F12/右键/快捷键拦截
│   │       ├── domain-lock.ts  # 域名 + referrer 校验
│   │       └── index.ts
│   ├── types.ts                # 全部对外类型
│   └── index.ts                # SDK 统一入口
├── examples/
│   └── security-demo.html
├── test-consumer/
│   └── index.html              # 模拟第三方游戏接入
├── dist/                       # 构建产物（git 忽略）
├── docs/
│   └── security.md             # 安全模块详细文档
├── 需求顺序.md                  # 总开发计划
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 安全模块防护边界（坦白说）

| 类型 | 是否能挡 |
|---|---|
| 好奇玩家、随手 F12 | ✅ |
| 复制黏贴源码 | ✅ |
| 简单脚本党 | ✅ |
| 专业逆向 / 反混淆 | ❌ |
| Charles / Fiddler 抓包 | ❌ |
| 浏览器扩展直接读 Sources | ❌ |
| 外接 Chrome DevTools Protocol | ❌ |

**真正的护城河**是把关键校验逻辑放后端（计划在第 5/8 期由 Cloudflare Workers 实现）。前端 SDK 的安全模块只是"提高门槛"，不要把它当成最终防线。
