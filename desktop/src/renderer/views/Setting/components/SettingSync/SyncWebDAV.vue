<template lang="pug">
dd
  h3 {{ $t('setting__sync_webdav_title') }}
  div
    .gap-top
      base-checkbox(id="setting_sync_webdav_enable" :model-value="appSetting['sync.webdav.enable']" :label="$t('setting__sync_webdav_enable')" @update:model-value="updateSetting({ 'sync.webdav.enable': $event })")

    .p.gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_sync_webdav_url") {{ $t('setting__sync_webdav_url') }}
      base-input(id="setting_sync_webdav_url" :class="$style.input" :model-value="appSetting['sync.webdav.url']" :disabled="!appSetting['sync.webdav.enable'] || isProcessing" :placeholder="$t('setting__sync_webdav_url_tip')" @update:model-value="setWebDAVUrl")

    .p.gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_sync_webdav_username") {{ $t('setting__sync_webdav_username') }}
      base-input(id="setting_sync_webdav_username" :class="$style.input" :model-value="appSetting['sync.webdav.username']" :disabled="!appSetting['sync.webdav.enable'] || isProcessing" @update:model-value="setWebDAVUsername")

    .p.gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_sync_webdav_password") {{ $t('setting__sync_webdav_password') }}
      base-input(id="setting_sync_webdav_password" :class="$style.input" type="password" :trim="false" :model-value="appSetting['sync.webdav.password']" :disabled="!appSetting['sync.webdav.enable'] || isProcessing" @update:model-value="setWebDAVPassword")

    .p.gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_sync_webdav_path") {{ $t('setting__sync_webdav_path') }}
      base-input(id="setting_sync_webdav_path" :class="$style.input" :model-value="appSetting['sync.webdav.path']" :disabled="!appSetting['sync.webdav.enable'] || isProcessing" :placeholder="$t('setting__sync_webdav_path_tip')" @update:model-value="setWebDAVPath")

    .p.gap-top(:class="$style.actionLine")
      base-btn.btn(min :disabled="isActionDisabled" @click="handleTestConnection") {{ isProcessing ? $t('setting__sync_webdav_processing') : $t('setting__sync_webdav_test') }}

      //- sources (User API)
      base-btn.btn.gap-left(min :disabled="isActionDisabled" @click="handleUploadSources") {{ $t('setting__sync_webdav_upload_all') }}
      base-btn.btn.gap-left(min :disabled="isActionDisabled" @click="handleDownloadSources") {{ $t('setting__sync_webdav_download_all') }}

      //- playlists
      base-btn.btn.gap-left(min :disabled="isActionDisabled" @click="handleUploadLists") {{ $t('setting__sync_webdav_upload_lists') }}
      base-btn.btn.gap-left(min :disabled="isActionDisabled" @click="handleDownloadLists") {{ $t('setting__sync_webdav_download_lists') }}

      //- music api gateway
      base-btn.btn.gap-left(min :disabled="isActionDisabled" @click="handleUploadMusicApiGateway") {{ $t('setting__sync_webdav_upload_music_api_gateway') }}
      base-btn.btn.gap-left(min :disabled="isActionDisabled" @click="handleDownloadMusicApiGateway") {{ $t('setting__sync_webdav_download_music_api_gateway') }}

      span(v-if="status.message" :class="[$style.status, status.isError ? $style.statusError : $style.statusSuccess]") {{ status.message }}
</template>

<script>
import { computed, reactive, ref } from '@common/utils/vueTools'
import { debounce } from '@common/utils/common'
import { dialog } from '@renderer/plugins/Dialog'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import {
  checkWebDAVConnection,
  downloadWebDAVAllData,
  downloadWebDAVLists,
  downloadWebDAVMusicApiGateway,
  uploadWebDAVAllData,
  uploadWebDAVLists,
  uploadWebDAVMusicApiGateway,
} from '@renderer/core/webdavSync'

export default {
  name: 'SettingSyncWebDAV',
  setup() {
    const t = useI18n()
    const isProcessing = ref(false)
    const status = reactive({
      message: '',
      isError: false,
    })

    const isConfigured = computed(() => {
      return !!(appSetting['sync.webdav.enable'] &&
        appSetting['sync.webdav.url'].trim() &&
        appSetting['sync.webdav.username'].trim())
    })
    const isActionDisabled = computed(() => isProcessing.value || !isConfigured.value)

    const setStatus = (message, isError = false) => {
      status.message = message
      status.isError = isError
    }

    const runAction = async(action, successKey, failedKey) => {
      if (isActionDisabled.value) return
      isProcessing.value = true
      setStatus('')
      try {
        await action()
        setStatus(t(successKey))
      } catch (err) {
        setStatus(t(failedKey, { message: err.message || String(err) }), true)
      } finally {
        isProcessing.value = false
      }
    }

    const confirmAction = async(messageKey) => {
      return dialog.confirm({
        message: t(messageKey),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
    }

    const handleTestConnection = () => {
      void runAction(checkWebDAVConnection, 'setting__sync_webdav_test_success', 'setting__sync_webdav_test_failed')
    }

    // Only sync sources (User API). Never sync app settings.
    const handleUploadSources = async() => {
      if (!await confirmAction('setting__sync_webdav_upload_all_confirm')) return
      void runAction(uploadWebDAVAllData, 'setting__sync_webdav_upload_all_success', 'setting__sync_webdav_upload_all_failed')
    }

    const handleDownloadSources = async() => {
      if (!await confirmAction('setting__sync_webdav_download_all_confirm')) return
      void runAction(downloadWebDAVAllData, 'setting__sync_webdav_download_all_success', 'setting__sync_webdav_download_all_failed')
    }

    const handleUploadLists = async() => {
      if (!await confirmAction('setting__sync_webdav_upload_lists_confirm')) return
      void runAction(uploadWebDAVLists, 'setting__sync_webdav_upload_lists_success', 'setting__sync_webdav_upload_lists_failed')
    }

    const handleDownloadLists = async() => {
      if (!await confirmAction('setting__sync_webdav_download_lists_confirm')) return
      void runAction(downloadWebDAVLists, 'setting__sync_webdav_download_lists_success', 'setting__sync_webdav_download_lists_failed')
    }

    const handleUploadMusicApiGateway = async() => {
      if (!await confirmAction('setting__sync_webdav_upload_music_api_gateway_confirm')) return
      void runAction(uploadWebDAVMusicApiGateway, 'setting__sync_webdav_upload_music_api_gateway_success', 'setting__sync_webdav_upload_music_api_gateway_failed')
    }

    const handleDownloadMusicApiGateway = async() => {
      if (!await confirmAction('setting__sync_webdav_download_music_api_gateway_confirm')) return
      void runAction(downloadWebDAVMusicApiGateway, 'setting__sync_webdav_download_music_api_gateway_success', 'setting__sync_webdav_download_music_api_gateway_failed')
    }

    return {
      appSetting,
      updateSetting,
      isProcessing,
      status,
      isActionDisabled,
      setWebDAVUrl: debounce(url => {
        updateSetting({ 'sync.webdav.url': url.trim() })
      }, 500),
      setWebDAVUsername: debounce(username => {
        updateSetting({ 'sync.webdav.username': username.trim() })
      }, 500),
      setWebDAVPassword: debounce(password => {
        updateSetting({ 'sync.webdav.password': password })
      }, 500),
      setWebDAVPath: debounce(path => {
        updateSetting({ 'sync.webdav.path': path.trim() || '/LX_Music/' })
      }, 500),
      handleTestConnection,
      handleUploadSources,
      handleDownloadSources,
      handleUploadLists,
      handleDownloadLists,
      handleUploadMusicApiGateway,
      handleDownloadMusicApiGateway,
    }
  },
}
</script>

<style lang="less" module>
.inputLine {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.inputLabel {
  min-width: 110px;
}

.input {
  width: min(520px, 100%);
}

.actionLine {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status {
  line-height: 1.5;
  word-break: break-all;
}

.statusSuccess {
  color: var(--color-primary-font-active);
}

.statusError {
  color: var(--color-btn-close);
}
</style>
