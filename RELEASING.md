# 发版流程 SOP

> 如果你回来发版但忘了怎么做，**只看本文件**就够了。

---

## TL;DR — 90% 的情况

```bash
# 在 main 分支，工作区干净，所有源码改动已 push
npm run release -- 0.2.0
```

完事。等 1~2 分钟，jsDelivr 自动可用：

```html
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.2.0/maji-sdk.min.js"></script>
```

---

## 发版前 checklist

发版前确认下面 5 条，少一条会出问题：

- [ ] 当前在 `main` 分支：`git branch --show-current` → `main`
- [ ] 工作区干净：`git status` → `nothing to commit`
- [ ] 本地 main 和 origin/main 同步：`git fetch && git status` → `up to date`
- [ ] 目标版本 tag 不存在：`git tag -l v0.2.0-src` → 空
- [ ] **[INTEGRATION.md](INTEGRATION.md) 已和当前实现同步**（如果本次有公开 API、配置项、事件、模块状态变更）

前 4 条会被 release 脚本自动校验。**第 5 条必须人工/AI 自己确认** —— 这是接入方的"产品说明书"，落后会让接入方踩坑。

---

## 完整发版步骤

### 1. 跑 release 脚本

```bash
npm run release -- <版本号>
```

例如：
```bash
npm run release -- 0.2.0         # 正常版本
npm run release -- 1.0.0-beta.1  # 预发版本
```

**脚本内部做什么**：
1. 校验上面 checklist 的 4 条
2. 把 `package.json` 的 `version` 改为目标版本（如果已经是目标值就跳过）
3. `git commit -m "release: v0.2.0"`
4. `git tag v0.2.0-src`
5. `git push origin main v0.2.0-src`

### 2. GitHub Actions 自动接力

push tag `v*-src` 触发 [.github/workflows/release.yml](.github/workflows/release.yml)：

1. checkout 源码、装依赖、type-check、build
2. 切换到 `release` 分支（不存在则创建孤儿分支）
3. 把 `dist/*` 替换 release 分支内容
4. commit + 打 `v0.2.0` tag（**无 `-src` 后缀**）
5. 推送 release 分支 + tag
6. 创建 GitHub Release（含自动 changelog 和 CDN URL）

跑完大概 1~2 分钟。

### 3. 验证

打开浏览器或 curl：

```bash
curl -sI "https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.2.0/maji-sdk.min.js" | head -3
```

应该返回 `HTTP/1.1 200 OK`。

监控位置：
- Actions 跑得怎么样：https://github.com/SYRollingStone/MajiGame-H5-SDK/actions
- 发布的 Release：https://github.com/SYRollingStone/MajiGame-H5-SDK/releases
- release 分支内容：https://github.com/SYRollingStone/MajiGame-H5-SDK/tree/release

---

## 演练（不真发，重要！）

发新大版本前，强烈建议先演练一次：

1. 浏览器进 https://github.com/SYRollingStone/MajiGame-H5-SDK/actions
2. 左边选 **Release** 工作流
3. 右上角 **Run workflow** 下拉按钮
4. 填 `version: 0.2.0`
5. 勾 `dry_run: ☑`
6. 点 **Run workflow**

dry-run 会跑完构建、类型检查、打包，但**不推任何东西**到仓库。如果通过了，再正式发版心里有底。

---

## 双 tag 命名规则

| Tag | 在哪个分支 | 指向什么 | 谁用 |
|---|---|---|---|
| `v0.2.0-src` | `main` | 发版时的源码 commit | 你回顾历史 / Actions 触发条件 |
| `v0.2.0` | `release` | 该版本构建产物的 commit | jsDelivr 拉取 |

为什么搞两个？因为 git tag 全局唯一，源码 commit 和产物 commit 是两个不同的对象，不能用同一个 tag 名。

---

## 版本号规则（SemVer）

格式：`MAJOR.MINOR.PATCH`，例如 `1.2.3`。

| 改了什么 | 升哪一位 | 例子 |
|---|---|---|
| 修 bug、性能优化、内部重构 | PATCH | 0.1.0 → 0.1.1 |
| 加新功能、新 API（**不破坏老用法**） | MINOR | 0.1.5 → 0.2.0 |
| 改了 API（破坏老用法、删 API） | MAJOR | 0.9.2 → 1.0.0 |
| 第一个稳定版前的实验 | 0.x.x | 当前阶段 |

预发版后缀：
- `1.0.0-alpha.1` — 早期不稳定，仅内部测试
- `1.0.0-beta.1` — 接近发布，可邀请外部测试
- `1.0.0-rc.1` — 发布候选，理论上是最终版

---

## CDN URL 速查

```html
<!-- 锁死具体版本（生产环境推荐）-->
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.2.0/maji-sdk.min.js"></script>

<!-- 跟随 0.2.x 最新（自动拿 bug fix）-->
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.2/maji-sdk.min.js"></script>

<!-- 总是 release 分支最新（开发测试用，不推荐生产）-->
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@release/maji-sdk.min.js"></script>
```

**jsDelivr 缓存特性（务必了解）**：
- `@v0.2.0`（具体 tag）：缓存 **12 个月不可变**
- `@v0.2`（小版本范围）：jsDelivr 周期性更新
- `@release`（分支）：缓存 **7 天**

⚠️ **tag 发出去之后内容不能改**。jsDelivr 全球节点缓存 12 个月。要修 bug 必须发 patch 版本。

---

## 常见错误处理

### "Working tree is not clean"
有未提交的改动。先 `git status` 看什么文件改了，commit 或 stash 再发版。

### "Must be on main branch, currently on xxx"
你在别的分支。`git checkout main` 切回去。

### "Local main is not in sync with origin/main"
有人（包括你自己别的设备）推过新 commit。`git pull` 同步后再发。

### "Tag v0.X.Y-src already exists"
版本号已经发过了。**不要复用版本号**，按 SemVer 升一位再发。

### Actions 在 push tag 后没触发？
- 确认 tag 是 `v*-src` 格式（不是裸的 `v0.2.0`）
- 进 Actions 页面看是否有错误
- 检查 [release.yml](.github/workflows/release.yml) 的 `on.push.tags` 配置

### Actions 中途失败了
1. 进 Actions 页面看具体哪一步 fail
2. 修复问题
3. 删本地和远程的 `v0.X.Y-src` tag：
   ```bash
   git tag -d v0.2.0-src
   git push origin :refs/tags/v0.2.0-src
   ```
4. 重新跑 `npm run release -- 0.2.0`

### Actions 跑成功了但 jsDelivr 还是 404
jsDelivr 有几分钟的同步延迟。等 5 分钟再试。仍然不行的话：
1. 确认 release 分支真的有这个 tag：访问 https://github.com/SYRollingStone/MajiGame-H5-SDK/tree/v0.2.0
2. 试 jsDelivr purge：访问 `https://purge.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.2.0/maji-sdk.min.js`

---

## 紧急情况

### 发了有 bug 的版本怎么办？
**永远不要回收 tag**。jsDelivr 缓存 12 个月，回收没用。

正确做法：
1. 修 bug
2. 发 patch 版本：`npm run release -- 0.2.1`
3. 让用户把 `@v0.2.0` 改成 `@v0.2.1`，或者用 `@v0.2` 自动跟最新

### 误发版本想撤回？
同上，不要撤，发新版盖过去。如果是预发版本（`-beta.1`），就发正式版本。

### 想回滚老版本？
让用户改 URL 指向老 tag 即可，不需要任何仓库操作。

```html
<!-- 出问题时让用户回退到 v0.1.5 -->
<script src="https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v0.1.5/maji-sdk.min.js"></script>
```

---

## 文件清单

发版相关的所有文件：

| 文件 | 作用 |
|---|---|
| [scripts/release.mjs](scripts/release.mjs) | 本地发版脚本，`npm run release` 调用 |
| [.github/workflows/release.yml](.github/workflows/release.yml) | GitHub Actions 配置 |
| [vite.config.ts](vite.config.ts) | 注入 `__VERSION__` 到产物 |
| [src/globals.d.ts](src/globals.d.ts) | TypeScript 声明 `__VERSION__` |
| [package.json](package.json) | `version` 字段是发版唯一真相之源 |
