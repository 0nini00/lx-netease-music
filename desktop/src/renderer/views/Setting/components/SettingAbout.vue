<template lang="pug">
dt#about {{ $t('setting__about') }}
dd
  .p.small
    | 当前项目名称：
    strong lx-netease-music-desktop
  .p.small
    | 本项目基于
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/lyswhut/lx-music-desktop')") lyswhut/lx-music-desktop
    |  与
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/souvenp/lx-netease-music-mobile')") souvenp/lx-netease-music-mobile
    |  构建，并在其基础上进行定制开发。
  .p.small
    | 当前桌面端工程的核心技术栈仍为 Electron 与 Vue 3。
  .p.small
    | 桌面端参考项目源码地址：
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/lyswhut/lx-music-desktop')") https://github.com/lyswhut/lx-music-desktop
  .p.small
    | 移动端参考项目源码地址：
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/souvenp/lx-netease-music-mobile')") https://github.com/souvenp/lx-netease-music-mobile
  .p.small
    | 参考项目常见问题文档：
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/faq')") 桌面版常见问题
  .p.small 当前项目额外加入了网易云账号歌单、音乐 API 网关、WebDAV 同步等定制能力。
  br
  .p.small
    | 当前项目仓库地址：
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/0nini00/lx-netease-music-desktop')") https://github.com/0nini00/lx-netease-music-desktop
  .p.small
    | 当前项目 Issue 地址：
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/0nini00/lx-netease-music-desktop/issues')") https://github.com/0nini00/lx-netease-music-desktop/issues
  .p.small
    | 如果你正在使用当前仓库的二次开发版本，请以当前维护者仓库中的说明与发布信息为准。

  .p.small
    | 你已签署本软件的
    base-btn(min @click="handleShowPact") 许可协议
    | ，参考项目协议说明在
    strong.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/lyswhut/lx-music-desktop#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE')") 这里
    | 。
</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { isShowPact } from '@renderer/store'
import { openUrl, clipboardWriteText } from '@common/utils/electron'

export default {
  name: 'SettingAbout',
  setup() {
    const handleShowPact = () => {
      isShowPact.value = true
    }
    return {
      openUrl,
      clipboardWriteText,
      handleShowPact,
    }
  },
}
</script>
