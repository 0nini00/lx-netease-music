# NetEase 功能矩阵（Sprint 1 基线冻结）

本文档用于冻结移动端 NetEase 功能迁移边界，后续 sprint 以此作为保留、补齐、移除依据。本 sprint 只做代码基线盘点，不修改运行时行为。

## 依据与盘点范围

已读取并对照以下文件：

- 移动端 `package.json`：确认当前项目为 React Native + TypeScript/JavaScript，使用 `react-native-navigation`、`react-native-pager-view`、现有 store/core/utils 分层。
- 移动端 `src/navigation/screenNames.ts`、`src/navigation/registerScreens.tsx`、`src/navigation/navigation.ts`：确认当前已注册 Home、播放详情、歌单详情、评论、艺人详情、专辑详情、下载管理、相似歌曲等 screen。
- 移动端 `src/screens/Home`：确认 Home 当前主入口包含搜索、歌单广场、排行榜、本地列表、每日推荐、关注歌手、收藏专辑、我的网易云歌单、OneDrive、设置；竖屏仍通过 DrawerNav/PagerView 组织入口。
- 移动端 `src/config/constant.ts`：确认 `NAV_MENUS` 中包含 `nav_followed_artists`、`nav_subscribed_albums`，默认搜索类型仍包含 `singer`、`album`。
- 移动端 `src/utils/musicSdk/wy`：确认已有搜索、歌曲详情、歌词、封面、歌单、账号歌单、每日推荐、相似/心动、专辑、艺人、MV 等 SDK 文件或导出。
- 桌面端 `../lx-netease-music-desktop-port/MIGRATION_PLAN.md`：以“当前进度 / 2026-05-27”中已完成且已验证的能力作为本次移动端对齐依据。

桌面端 `MIGRATION_PLAN.md` 已完成能力摘要：Cookie 与账号检查、网易云播放 URL 与回退、喜欢歌曲列表、我的歌单、收藏歌单、歌单详情、每日推荐歌曲、每日推荐歌单、相似歌曲/心动模式、账号歌单内存缓存、新建歌单、编辑/删除自建歌单、添加/移除自建歌单歌曲、收藏/取消收藏在线歌单，并已通过 ESLint / 验证脚本 / build。该计划同时把“专辑详情与收藏、歌手详情与收藏、MV 地址获取”放在第四阶段扩展能力与后续方向中，不属于当前已完成迁移边界。

## 功能矩阵

状态说明：

- 保留：移动端已有且属于本次产品范围，后续可继续清理体验但不删除能力。
- 补齐：桌面端已完成或产品规格要求保留，但移动端入口、行为或边界仍需在后续 sprint 对齐。
- 移除：移动端当前存在入口、路由或 SDK 能力，但桌面端未作为已完成基线，且产品规格明确不扩展。

| 能力 | 移动端当前入口 / 代码位置 | 桌面端已完成依据 | Sprint 1 冻结结论 | 差异与后续边界 |
| --- | --- | --- | --- | --- |
| 网易云单曲搜索 | `src/screens/Home/Views/Search`；`src/utils/musicSdk/wy/musicSearch.js`；默认 `search.source = 'wy'` | MIGRATION_PLAN “网易云搜索接入” | 保留 | 后续只保留歌曲与歌单搜索方向；不继续扩展歌手/专辑搜索入口。 |
| 网易云歌单搜索 / 歌单广场 / 歌单详情 | `src/screens/Home/Views/SongList`；`src/screens/SonglistDetail`；`src/utils/musicSdk/wy/songList.js` | MIGRATION_PLAN “网易云歌单详情读取能力”“在线歌单详情页的收藏按钮” | 保留 | 歌单详情、播放、添加到本地歌单属于核心范围。 |
| 歌曲播放 URL（Cookie 优先与回退） | `src/utils/musicSdk/wy/api-cookie.js`；`src/utils/musicSdk/wy/index.js#getMusicUrl` | MIGRATION_PLAN “Cookie 播放 URL 获取逻辑”“自定义源 API 回退路径” | 保留 | 后续需验证移动端失败提示与回退链路，但不扩大到 MV 播放。 |
| 歌词、封面、歌曲详情、音质补全 | `src/utils/musicSdk/wy/lyric.js`、`musicInfo.js`、`musicDetail.js`、`quality_detail.js` | MIGRATION_PLAN “歌词与封面补全”“音质信息补全”“歌曲详情数据转换” | 保留 | 属于歌曲上下文能力，可继续对齐数据转换与缓存。 |
| Cookie 设置与账号状态检查 | `src/screens/Home/Views/Setting/settings/Basic/WyCookie.tsx`；`src/utils/musicSdk/wy/user.js`；`src/utils/musicSdk/wy/api-cookie.js` | MIGRATION_PLAN “Cookie 设置与持久化”“Cookie 有效性检查”“UID 与 VIP 状态识别” | 保留 | 设置页保留配置与检查，不作为所有 NetEase 功能主入口。 |
| 网易云账号歌单：我的歌单 / 收藏歌单 | `src/screens/Home/Views/MyPlaylist`；`src/utils/musicSdk/wy/user.js#getUserPlaylists` | MIGRATION_PLAN “左侧‘网易云歌单’读取账号歌单，并区分自建歌单与收藏歌单” | 补齐 | 移动端已有入口 `nav_my_playlist`，后续需与桌面端自建/收藏区分、只读规则和缓存边界对齐。 |
| 网易云账号歌单详情 | `src/screens/Home/Views/MyPlaylist`；`src/screens/SonglistDetail`；`src/utils/musicSdk/wy/songList.js#getListDetail` | MIGRATION_PLAN “动态读取歌单详情歌曲”“专用内存缓存，不写入本地 userLists” | 补齐 | 后续重点验证移动端是否避免在线数据污染本地歌单。 |
| 新建网易云歌单 | `src/screens/Home/Views/MyPlaylist/PlaylistEditModal.tsx`；`src/utils/musicSdk/wy/user.js#createPlaylist` | MIGRATION_PLAN “迁移网易云新建歌单能力” | 补齐 | 后续需统一入口文案与失败提示。 |
| 编辑 / 删除自建网易云歌单 | `src/screens/Home/Views/MyPlaylist/PlaylistEditModal.tsx`；`user.js#updatePlaylist`、`deletePlaylist` | MIGRATION_PLAN “编辑/删除自建歌单能力” | 补齐 | 仅限自建歌单；收藏歌单保持只读或取消收藏。 |
| 添加 / 移除自建网易云歌单歌曲 | `src/components/MusicAddModal`；`src/screens/SonglistDetail`；`user.js#manipulatePlaylistTracks` | MIGRATION_PLAN “添加网易云歌曲到自建歌单”“移除自建歌单歌曲” | 补齐 | 仅限来源为网易云歌曲与自建歌单目标。 |
| 收藏 / 取消收藏在线歌单 | `src/screens/SonglistDetail`；`user.js#subPlaylist` | MIGRATION_PLAN “收藏/取消收藏歌单能力” | 补齐 | 保留歌单收藏，不扩展专辑收藏或歌手收藏。 |
| 每日推荐歌曲 | `src/screens/Home/Views/DailyRec/RecSongs.tsx`；`src/utils/musicSdk/wy/dailyRec.js#getList` | MIGRATION_PLAN “每日推荐歌曲读取能力”“左侧每日推荐歌曲入口” | 保留 | 后续保持为歌曲列表能力，可复用播放与添加到歌单。 |
| 每日推荐歌单 | `src/screens/Home/Views/DailyRec/RecPlaylists.tsx`；`dailyRec.js#getRecPlaylists` | MIGRATION_PLAN “每日推荐歌单读取能力” | 保留 | 后续只能跳转歌单详情，不引入专辑、艺人、MV 跳转。 |
| 相似歌曲 / 心动模式 | `src/components/SimilarSongsModal.tsx`；`src/screens/SimilarSongs`；`dailyRec.js#getSimilarSongs`、`getHeartbeatModeList`；`MUSIC_TOGGLE_MODE.heartbeat` | MIGRATION_PLAN “相似歌曲与心动模式列表读取能力” | 保留 | 限定为歌曲上下文能力；不是视频/MV 扩展入口。 |
| 本地歌单、播放历史、设置 | `src/screens/Home/Views/Mylist`、`PlayHistory`、`Setting`；`NAV_MENUS` | 产品规格要求保留移动端既有基础能力 | 保留 | 非 NetEase 迁移重点，但继续作为移动端基础能力保留。 |
| 排行榜 | `src/screens/Home/Views/Leaderboard`；`src/utils/musicSdk/wy/leaderboard.js` | 桌面端 MIGRATION_PLAN 未列为新增完成项；移动端既有在线音乐基础入口 | 保留 | 可保留移动端既有能力；不作为本次 NetEase 账号迁移补齐重点。 |
| OneDrive / WebDAV 同步 | `src/screens/Home/Views/OneDrive`；`src/utils/webdav.ts`；`src/core/sync/webdavSync.ts` | MIGRATION_PLAN 第五阶段为评估方向，非当前已完成能力 | 保留 | 属于移动端既有基础能力或后续评估项，本 sprint 不新增。 |
| 关注歌手列表 / 歌手详情 / 歌手收藏 | `NAV_MENUS.nav_followed_artists`；`src/screens/Home/Views/FollowedArtists`；`ARTIST_DETAIL_SCREEN`；`src/screens/ArtistDetail`；`src/utils/musicSdk/wy/artist.js`；`user.js#getSublist/followSinger`；播放页歌手点击路由 | MIGRATION_PLAN 仅把“歌手详情与收藏”列为第四阶段扩展/后续方向，未列入已完成当前进度 | 移除 | 当前移动端入口必须在后续 sprint 标为待移除；本次不新增、不补齐歌手详情或收藏能力。 |
| 收藏专辑列表 / 专辑详情 / 专辑收藏 | `NAV_MENUS.nav_subscribed_albums`；`src/screens/Home/Views/SubscribedAlbums`；`ALBUM_DETAIL_SCREEN`；`src/screens/AlbumDetail`；`src/utils/musicSdk/wy/album.js`；`user.js#getSubAlbumList/subAlbum`；播放页专辑点击路由 | MIGRATION_PLAN 仅把“专辑详情与收藏”列为第四阶段扩展/后续方向，未列入已完成当前进度 | 移除 | 当前移动端入口必须在后续 sprint 标为待移除；不得列入本次新增范围。 |
| MV / 视频入口与地址获取 | `src/utils/musicSdk/wy/mv.js`；`src/components/OnlineList`；`src/components/player/PlayerPlaylist.tsx`；`src/screens/PlayDetail/Vertical/Player/components/MoreBtn` | MIGRATION_PLAN 仅把“MV 地址获取”列为第四阶段扩展/后续方向，未列入已完成当前进度 | 移除 | 当前移动端入口必须在后续 sprint 标为待移除；不新增视频播放、MV 地址或 MV 跳转。 |
| 搜索类型：歌手 / 专辑 | `src/config/constant.ts` 默认 `search.type` 类型包含 `singer`、`album`；`musicSearch.js#searchSinger/searchAlbum`；`SearchTypeSelector` | 桌面端已完成基线为搜索接入，未完成歌手/专辑详情产品化 | 移除 | 后续搜索范围应收敛到歌曲与歌单；歌手/专辑搜索入口如存在需清理。 |

## 移动端当前入口与桌面端已完成能力差异

1. 移动端暴露了桌面端当前已完成基线之外的专辑、艺人、MV 能力：
   - 主导航包含 `nav_followed_artists`、`nav_subscribed_albums`。
   - 路由注册包含 `ARTIST_DETAIL_SCREEN`、`ALBUM_DETAIL_SCREEN`。
   - 播放详情和在线列表存在进入艺人详情、专辑详情、MV 地址获取的交互。
   - `src/utils/musicSdk/wy` 中存在 `artist.js`、`album.js`、`mv.js`，且 `user.js` 包含歌手关注与专辑收藏接口。
   - 结论：这些能力均不进入新增范围，后续标为待移除。

2. 桌面端已完成的账号歌单能力在移动端已有基础代码，但仍需要后续对齐边界：
   - 移动端已有 `MyPlaylist`、`PlaylistEditModal`、`user.js` 歌单操作接口。
   - 桌面端明确完成“账号歌单专用内存缓存，不写入本地 `userLists`”。移动端后续应重点核对是否存在在线歌单污染本地列表的路径。

3. 桌面端已完成的每日推荐、每日推荐歌单、相似歌曲/心动模式在移动端已有入口和 SDK：
   - 移动端 `DailyRec` 已分为推荐歌曲与推荐歌单。
   - 相似歌曲/心动模式已有 `SimilarSongs` screen / modal 和 `dailyRec.js` API。
   - 结论：保留，但只作为歌曲上下文能力，不允许导向 MV、艺人、专辑扩展。

4. 移动端导航形态与产品规格存在差异：
   - 竖屏仍有 `DrawerNav`，`Main` 使用 `PagerView` 根据 `NAV_MENUS` 生成页面。
   - 产品规格要求后续改为底部主导航，并过滤非主导航项。
   - 结论：本 sprint 只记录，不改运行时行为，后续 Sprint 3 处理。

5. 桌面端已完成能力不包含 Electron/Vue UI 复制或新 UI 框架：
   - 移动端继续保留 React Native、`react-native-navigation`、`react-native-pager-view` 和现有组件体系。
   - 结论：后续实现不引入新导航库或 UI 框架。

## 冻结结论

- 本次保留/补齐主线：搜索歌曲与歌单、播放 URL、歌词/封面/歌曲详情、Cookie 与账号检查、网易云账号歌单全链路、每日推荐歌曲、每日推荐歌单、相似歌曲/心动模式、本地基础能力。
- 本次明确移除主线：专辑详情、专辑收藏/收藏专辑列表、艺人详情、歌手关注/关注歌手列表、MV/视频入口、歌手/专辑搜索入口。
- 后续 sprint 如果发现上述移除项仍有 UI 入口、路由注册、菜单项或交互按钮，应删除或隐藏；不得把它们作为新增能力继续补齐。
