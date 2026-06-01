# lx-netease-music-desktop

`lx-netease-music-desktop` 是一个基于 `Electron`、`Vue 3`，并综合参考 [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 与 [souvenp/lx-netease-music-mobile](https://github.com/souvenp/lx-netease-music-mobile) 构建的桌面音乐项目。

## 项目来源

- 本项目以 `lyswhut/lx-music-desktop` 为主要桌面端工程基础。
- 同时参考了 `souvenp/lx-netease-music-mobile` 的部分网易云能力与交互思路，用于补充当前桌面端定制能力。
- 当前仓库是在上述两个项目基础之上进行定制开发的派生版本。
- 如果你要了解原始实现思路、历史背景和上游能力，请优先参考上游项目仓库与文档。

上游项目地址：

- <https://github.com/lyswhut/lx-music-desktop>
- <https://github.com/souvenp/lx-netease-music-mobile>

## 技术栈

- Electron
- Vue 3
- Webpack
- electron-builder

## 当前项目名称

- 应用名：`lx-netease-music-desktop`
- 包名：`lx-netease-music-desktop`
- 仓库地址：<https://github.com/0nini00/lx-netease-music-desktop>

## 说明

- 当前仓库默认保留了参考项目的大部分工程结构与开发方式。
- 如果你要继续二次开发，建议先熟悉 `src/main`、`src/renderer` 与 `build-config` 目录。
- 原项目相关协议、使用限制与版权说明仍然需要认真阅读并遵守。

## 当前定制功能

- 新增网易云账号歌单能力，包括自建歌单与收藏歌单加载、创建、重命名、增删歌曲等能力。
- 新增音乐 API 网关配置，可在主音源失败后通过自定义网关补充播放地址。
- 新增 WebDAV 同步配置入口，用于扩展列表与配置同步方案。
- 增强网易云相关回退逻辑，包括收藏歌单完整加载与多音源轮询修复。

## 开发启动

```bash
npm run dev
```

## 参考项目

- 桌面端上游仓库：<https://github.com/lyswhut/lx-music-desktop>
- 桌面端上游文档：<https://lyswhut.github.io/lx-music-doc/desktop/use-source-code>
- 移动端参考仓库：<https://github.com/souvenp/lx-netease-music-mobile>
