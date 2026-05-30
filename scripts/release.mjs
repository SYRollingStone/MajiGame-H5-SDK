#!/usr/bin/env node
/**
 * 本地发版脚本 —— 用法：
 *   npm run release -- 0.1.0
 *
 * 它会：
 *   1. 校验工作区干净 + 在 main 分支
 *   2. 把 package.json 的 version 改为 <version>
 *   3. 提交 "release: v<version>"
 *   4. 打 tag v<version>-src
 *   5. push origin main 和 tag
 * 之后剩下交给 GitHub Actions：构建 → 推到 release 分支 → 打 v<version> tag → 创建 GitHub Release。
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

const version = process.argv[2]
if (!version) {
  console.error('Usage: npm run release -- <version>')
  console.error('Example: npm run release -- 0.1.0')
  process.exit(1)
}
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error(`Invalid version "${version}". Expected SemVer like 0.1.0 or 1.2.3-beta.1`)
  process.exit(1)
}

const tag = `v${version}-src`

function sh(cmd, opts = {}) {
  console.log(`> ${cmd}`)
  return execSync(cmd, { stdio: 'inherit', cwd: repoRoot, ...opts })
}
function shCapture(cmd) {
  return execSync(cmd, { cwd: repoRoot, encoding: 'utf-8' }).trim()
}

// 1. Clean working tree
const status = shCapture('git status --porcelain')
if (status) {
  console.error('\n✗ Working tree is not clean. Commit or stash changes first:\n')
  console.error(status)
  process.exit(1)
}

// 2. On main
const branch = shCapture('git rev-parse --abbrev-ref HEAD')
if (branch !== 'main') {
  console.error(`✗ Must be on main branch, currently on "${branch}"`)
  process.exit(1)
}

// 3. Up to date with remote
sh('git fetch origin main --quiet')
const local = shCapture('git rev-parse HEAD')
const remote = shCapture('git rev-parse origin/main')
if (local !== remote) {
  console.error('✗ Local main is not in sync with origin/main. Pull or push first.')
  process.exit(1)
}

// 4. Tag doesn't exist
try {
  execSync(`git rev-parse ${tag}`, { stdio: 'pipe', cwd: repoRoot })
  console.error(`✗ Tag ${tag} already exists locally. Delete it or pick a new version.`)
  process.exit(1)
} catch {
  // good - tag does not exist
}
try {
  const remoteTag = shCapture(`git ls-remote --tags origin ${tag}`)
  if (remoteTag) {
    console.error(`✗ Tag ${tag} already exists on remote.`)
    process.exit(1)
  }
} catch {
  // ignored
}

// 5. Bump package.json (skip if already at target version)
const pkgPath = resolve(repoRoot, 'package.json')
const raw = readFileSync(pkgPath, 'utf-8')
const pkg = JSON.parse(raw)
const oldVersion = pkg.version
const needsBump = oldVersion !== version

if (needsBump) {
  pkg.version = version
  const trailingNl = raw.endsWith('\n') ? '\n' : ''
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + trailingNl)
  console.log(`\n✓ Bumped package.json: ${oldVersion} → ${version}`)

  sh('git add package.json')
  sh(`git commit -m "release: v${version}"`)
} else {
  console.log(`\n✓ package.json already at ${version}, skipping bump`)
}

// 6. Tag + push
sh(`git tag ${tag}`)
sh(`git push origin main ${tag}`)

console.log('\n────────────────────────────────────────────')
console.log(`✓ Pushed tag ${tag}`)
console.log('────────────────────────────────────────────')
console.log('\nGitHub Actions is now building and publishing.')
console.log('Watch:  https://github.com/SYRollingStone/MajiGame-H5-SDK/actions')
console.log(`\nWhen done, the CDN URL will be:`)
console.log(
  `  https://cdn.jsdelivr.net/gh/SYRollingStone/MajiGame-H5-SDK@v${version}/maji-sdk.min.js`,
)
