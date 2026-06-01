# 网易云功能桌面端迁移计划

## 目标

以 `lyswhut/lx-music-desktop` 为稳定桌面端基线，逐步移植 `souvenp/lx-netease-music-mobile` 中已经验证过的网易云相关能力。

当前桌面端网易云账号歌单、播放回退、每日推荐与基础同步配置等核心能力已经完成迁移并通过构建验证。后续开发以体验优化、更多网易云扩展能力与移动端适配为主。

## 基本原则

- 先功能，后 UI，最后再考虑 Rust/Tauri 减重。
- 以桌面端现有架构为主，移动端代码只作为业务逻辑参考。
- 每次只移植一个能力，完成后必须能独立验证。
- 优先复用桌面端已有请求、缓存、列表、播放、设置和 IPC 模块。
- 不把 React Native 组件、移动端导航、移动端原生模块直接搬进桌面端。
- 保持改动小而清晰，避免一次性重写底层结构。

## 本地参考仓库

- 桌面端基线：`C:\Users\chenle\Desktop\OH-WorkSpace\lx-music-desktop-ref`
- 移动端功能参考：`C:\Users\chenle\Desktop\OH-WorkSpace\lx-netease-music-mobile`
- 当前迁移工程：`C:\Users\chenle\Desktop\OH-WorkSpace\lx-netease-music-desktop-port`

## 技术栈判断

桌面端是 Electron + Vue 3 + TypeScript，移动端是 React Native + TypeScript/JavaScript。

因此迁移重点不是 UI 组件，而是网易云接口、数据转换、账号状态、列表操作和播放下载相关业务逻辑。

## 功能模块状态

### 第一阶段：账号与基础接口

- 网易云 Cookie 设置与持久化
- Cookie 有效性检查
- 用户 ID 与 VIP 状态识别
- 网易云请求公共方法
- 网易云歌曲详情数据转换

### 第二阶段：播放与搜索

- 网易云搜索接入
- 歌曲播放 URL 获取
- 音质信息补全
- VIP/无版权/试听状态标记
- 歌词与封面补全

### 第三阶段：用户歌单

- 我的歌单读取
- 收藏歌单读取
- 喜欢歌曲列表读取
- 新建歌单
- 编辑歌单信息
- 添加/删除歌单歌曲
- 收藏/取消收藏歌单

### 第四阶段：推荐与扩展能力

- 每日推荐歌曲
- 每日推荐歌单
- 心动模式或相似歌曲
- 专辑详情与收藏
- 歌手详情与收藏
- MV 地址获取

### 第五阶段：同步与下载

- 下载时的网易云特殊请求头
- WebDAV 同步能力评估
- 设置、用户 API、列表数据同步
- 异常重试和冲突处理

### 第六阶段：UI 与减重

- 在功能稳定后再改 UI。
- 在 UI 稳定后再评估 Rust/Tauri。
- Rust 优先考虑局部能力替换，例如本地文件、数据库、下载、元数据解析，不优先重写整个应用。

## 移动端参考源码映射

| 能力 | 移动端参考文件 |
| --- | --- |
| 网易云登录 Cookie | `src/components/WebLoginModal.tsx` |
| Cookie 设置页 | `src/screens/Home/Views/Setting/settings/Basic/WyCookie.tsx` |
| 用户歌单 | `src/screens/Home/Views/MyPlaylist/index.tsx` |
| 歌单编辑 | `src/screens/Home/Views/MyPlaylist/PlaylistEditModal.tsx` |
| 歌单详情操作 | `src/screens/SonglistDetail/index.tsx` |
| 添加/删除歌曲 | `src/components/MusicAddModal/MusicAddModal.tsx` |
| 新建歌单 | `src/components/MusicAddModal/CreateUserList.tsx` |
| 每日推荐 | `src/utils/musicSdk/wy/dailyRec` |
| 歌曲详情 | `src/utils/musicSdk/wy/musicDetail` |
| 专辑详情 | `src/utils/musicSdk/wy/album` |
| 用户接口 | `src/utils/musicSdk/wy/user` |
| MV 地址 | `src/utils/musicSdk/wy/mv.js` |
| WebDAV 基础工具 | `src/utils/webdav.ts` |
| WebDAV 同步流程 | `src/core/sync/webdavSync.ts` |

## 验证策略

每个阶段完成后至少验证：

- `npm run lint`
- `npm run build`
- 核心功能的手动验证记录

涉及登录、播放、下载、WebDAV 的能力，需要额外记录：

- 输入条件
- 成功结果
- 失败结果
- 是否影响原有音乐源

## 当前进度

### 2026-05-27

- 已新增网易云 Cookie 与 SerpApi Key 设置字段。
- 已在基本设置页增加网易云账号配置入口。
- 已新增基于 Cookie 的网易云播放 URL 获取逻辑。
- 已保留原有自定义源 API 作为 Cookie 请求失败后的回退路径。
- 已新增网易云账号检查能力，可在基本设置页验证 Cookie、UID 与 VIP 状态。
- 已新增网易云喜欢歌曲列表读取能力，可在基本设置页读取数量并预览前几首歌曲。
- 已新增网易云我的歌单读取能力，可在基本设置页读取数量并预览前几个歌单。
- 已新增网易云歌单详情读取能力，可读取个人歌单内歌曲并转换为 LX 列表项。
- 已新增网易云每日推荐歌曲读取能力，可在基本设置页读取数量并预览前几首歌曲。
- 已新增网易云每日推荐歌单读取能力，可在基本设置页读取数量并预览前几个歌单。
- 已新增网易云相似歌曲与心动模式列表读取能力，可在基本设置页基于个人歌单歌曲验证。
- 已把网易云账号歌单接入左侧列表，设置页只保留 Cookie 配置与账号检查，不作为网易云功能主入口。
- 左侧“网易云歌单”现在会读取账号歌单，并区分自建歌单与收藏歌单。
- 点击网易云账号歌单后会动态读取歌单详情歌曲，右侧列表复用现有播放、下载、添加到本地歌单等能力。
- 网易云账号歌单详情改为专用内存缓存，不写入本地 `userLists`，避免在线歌单污染本地列表数据。
- 播放器已支持从网易云账号歌单内存缓存读取当前列表，双击播放与上一曲/下一曲可复用现有播放逻辑。
- 已新增脱敏验证脚本 `scripts/verify-wy-account-playlists.cjs`，用于验证账号、自建歌单、收藏歌单与歌单详情，不打印 Cookie 原文。
- 已通过直接调用 ESLint、`node scripts\verify-wy-account-playlists.cjs` 与 `npm run build` 验证。
- 已迁移网易云自建歌单删除歌曲能力，右侧歌曲列表可对自建网易云歌单调用网易云接口移除歌曲，收藏歌单保持只读。
- 已迁移添加网易云歌曲到网易云自建歌单能力，现有“添加到”弹窗会在歌曲来源为网易云时显示网易云自建歌单目标。
- 已迁移网易云新建歌单能力，左侧“网易云歌单”标题区可创建账号自建歌单。
- 已迁移网易云编辑/删除自建歌单能力，自建歌单右键菜单支持重命名与删除。
- 已迁移网易云收藏/取消收藏歌单能力，网易云在线歌单详情页的收藏按钮会收藏到网易云账号，左侧收藏歌单右键菜单支持取消收藏。
- 已新增左侧“每日推荐歌曲”入口，列表读取后可复用现有播放与添加到歌单能力。
- 已通过直接调用 ESLint 与 `npm run build` 验证。

## 后续方向

- 继续补充每日推荐、专辑、歌手、MV 等网易云扩展入口的产品化展示。
- 继续优化播放失败提示、多音源回退链路与账号 Cookie 状态提示。
- 评估 WebDAV 同步的完整数据覆盖范围与冲突处理策略。
- 保持桌面端稳定架构，避免无必要的大规模重构；移动端能力在独立工程中推进。
