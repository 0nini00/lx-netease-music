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

//- 更新设置
dd
  h3#update {{ $t('setting__update') }}
  div
    .gap-top
      base-checkbox(id="setting__update_tryAutoUpdate" :model-value="appSetting['common.tryAutoUpdate']" :label="$t('setting__update_try_auto_update')" @update:model-value="updateSetting({'common.tryAutoUpdate': $event})")
    .gap-top
      base-checkbox(id="setting__update_showChangeLog" :model-value="appSetting['common.showChangeLog']" :label="$t('setting__update_show_change_log')" @update:model-value="updateSetting({'common.showChangeLog': $event})")
    .gap-top
      .gap-top
        .p.small(@click="handleOpenDevTools") {{ $t('setting__update_current_label') }}{{ versionInfo.version }}
        .p.small(v-if="commit_id")
          | {{ $t('setting__update_commit_id') }}
          span.select {{ commit_id }}
        .p.small(v-if="commit_date") {{ $t('setting__update_commit_date') }}{{ commit_date }}
      .p.small.gap-top
        | {{ $t('setting__update_latest_label') }}{{ versionInfo.newVersion && versionInfo.newVersion.version != '0.0.0' ? versionInfo.newVersion.version : $t('setting__update_unknown') }}
      .p.small(v-if="downloadProgress" style="line-height: 1.5;")
        | {{ $t('setting__update_downloading') }}
        br
        | {{ $t('setting__update_progress') }}{{ downloadProgress }}
      template(v-if="versionInfo.newVersion")
        .p(v-if="versionInfo.isLatest")
          span {{ $t('setting__update_latest') }}
        .p(v-else-if="versionInfo.isUnknown")
          span {{ $t('setting__update_unknown_tip') }}
        .p(v-else-if="versionInfo.status != 'downloading'")
          span {{ $t('setting__update_new_version') }}
        .p
          base-btn.btn.gap-left(min @click="showUpdateModal") {{ $t('setting__update_open_version_modal_btn') }}
      .p.small(v-else-if="versionInfo.status =='checking'") {{ $t('setting__update_checking') }}
</template>

<script>
import { computed } from '@common/utils/vueTools'
import { isShowPact, versionInfo } from '@renderer/store'
import { openUrl, clipboardWriteText } from '@common/utils/electron'
import { openDevTools } from '@renderer/utils/ipc'
import { dateFormat, sizeFormate } from '@common/utils/common'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingAbout',
  setup() {
    const t = useI18n()
    let lastClickTime = 0
    let clickNum = 0
    const commit_id = COMMIT_ID
    const commit_date = dateFormat(COMMIT_DATE)

    const handleShowPact = () => {
      isShowPact.value = true
    }

    const handleOpenDevTools = () => {
      if (window.performance.now() - lastClickTime > 1000) {
        if (clickNum > 0) clickNum = 0
      } else {
        if (clickNum > 4) {
          openDevTools()
          clickNum = 0
          return
        }
      }
      clickNum++
      lastClickTime = window.performance.now()
    }

    const downloadProgress = computed(() => {
      return versionInfo.status == 'downloading'
        ? versionInfo.downloadProgress
          ? `${versionInfo.downloadProgress.percent.toFixed(2)}% - ${sizeFormate(versionInfo.downloadProgress.transferred)}/${sizeFormate(versionInfo.downloadProgress.total)} - ${sizeFormate(versionInfo.downloadProgress.bytesPerSecond)}/s`
          : t('setting__update_init')
        : ''
    })

    const showUpdateModal = () => {
      versionInfo.showModal = true
    }

    return {
      openUrl,
      clipboardWriteText,
      handleShowPact,
      appSetting,
      updateSetting,
      versionInfo,
      downloadProgress,
      handleOpenDevTools,
      showUpdateModal,
      commit_id,
      commit_date,
    }
  },
}
</script>
