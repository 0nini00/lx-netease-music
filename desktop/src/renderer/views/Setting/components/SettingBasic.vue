<template lang="pug">
dt#basic {{ $t('setting__basic') }}
dd
  div
    .gap-top
      base-checkbox(id="setting_show_animate" :model-value="appSetting['common.isShowAnimation']" :label="$t('setting__basic_show_animation')" @update:model-value="updateSetting({'common.isShowAnimation': $event})")
    .gap-top
      base-checkbox(id="setting_animate" :disabled="!appSetting['common.isShowAnimation']" :model-value="appSetting['common.randomAnimate']" :label="$t('setting__basic_animation')" @update:model-value="updateSetting({'common.randomAnimate': $event})")
    .gap-top
      base-checkbox(id="setting_start_in_fullscreen" :model-value="appSetting['common.startInFullscreen']" :label="$t('setting__basic_start_in_fullscreen')" @update:model-value="updateSetting({'common.startInFullscreen': $event})")
    .gap-top
      base-checkbox(id="setting_to_tray" :model-value="appSetting['tray.enable']" :label="$t('setting__basic_to_tray')" @update:model-value="updateSetting({'tray.enable': $event})")
    .p.gap-top
      base-btn.btn(min @click="isShowPlayTimeoutModal = true") {{ $t('setting__play_timeout')}} {{ timeLabel ? ` (${timeLabel})` : '' }}

dd
  h3#basic_theme {{ $t('setting__basic_theme') }}
  div
    ul(:class="$style.theme")
      li(v-for="theme in themeList" :key="theme.id" :aria-label="theme.name" :style="theme.styles" :class="[$style.themeItem, {[$style.active]: themeId == theme.id}]" @click="toggleTheme(theme)" @contextmenu="handleEditTheme(theme)")
        div(:class="$style.bg")
        span(:class="$style.label") {{ theme.name }}
      li(v-if="showAllTheme || themeId == 'auto'" :aria-label="$t('theme_auto_tip')" :style="autoTheme" :class="[$style.themeItem, $style.auto, {[$style.active]: themeId == 'auto'}]" @click="handleSetThemeAuto" @contextmenu="isShowThemeSelectorModal = true")
        div(:class="$style.bg")
          div(:class="$style.bgContent")
            div(:class="$style.light")
            div(:class="$style.dark")
        span(:class="$style.label") {{ $t('theme_auto') }}
      li(v-if="showAllTheme" :aria-label="$t('theme_add')" :class="[$style.themeItem, $style.add]" @click="handleEditTheme()")
        div(:class="$style.bg")
          div(:class="$style.bgContent")
            svg-icon(:class="$style.icon" name="plus")
        span(:class="$style.label") {{ $t('theme_add') }}
      li(v-if="!showAllTheme" :aria-label="$t('theme_more_btn_show')" :class="[$style.themeItem, $style.moreThme]" @click="showAllTheme = true")
        span(:class="$style.label") {{ $t('theme_more_btn_show') }}
        svg-icon(name="angle-right-solid" :class="$style.activeIcon")

dd
  h3#basic_source {{ $t('setting__basic_source') }}
  div
    .gap-top(v-for="item in apiSources" :key="item.id")
      base-checkbox(
        :id="`setting_api_source_${item.id}`" name="setting_api_source"
        need :model-value="appSetting['common.apiSource']" :disabled="item.disabled" :value="item.id" :aria-label="item.label" @update:model-value="updateSetting({'common.apiSource': $event})")
        span(:class="$style.sourceLabel")
          | {{ item.name }}
          span(v-if="item.desc" :class="$style.desc") {{ item.desc }}
          span(v-if="item.statusLabel" :class="$style.status") {{ item.statusLabel }}
    .p.gap-top
      base-btn.btn(min @click="isShowUserApiModal = true") {{ $t('setting__basic_source_user_api_btn') }}

dd
  h3#basic_wy_account {{ $t('setting__basic_wy_account') }}
  div
    .gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_wy_cookie") {{ $t('setting__basic_wy_cookie') }}
      base-input(
        id="setting_wy_cookie"
        :class="$style.accountInput"
        :model-value="appSetting['common.wy_cookie']"
        :placeholder="$t('setting__basic_wy_cookie_placeholder')"
        @update:model-value="setWyCookie")
    .gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_wy_serpapi_key") {{ $t('setting__basic_wy_serpapi_key') }}
      base-input(
        id="setting_wy_serpapi_key"
        :class="$style.accountInput"
        :model-value="appSetting['common.wy_serpapi_key']"
        :placeholder="$t('setting__basic_wy_serpapi_key_placeholder')"
        @update:model-value="setWySerpApiKey")
    .gap-top(:class="$style.accountActionLine")
      base-btn.btn(min :disabled="isCheckingWyAccount || !appSetting['common.wy_cookie']" @click="checkWyAccount") {{ isCheckingWyAccount ? $t('setting__basic_wy_checking') : $t('setting__basic_wy_check') }}
      span(v-if="wyAccountStatus.message" :class="[$style.accountStatus, wyAccountStatus.isError ? $style.accountStatusError : $style.accountStatusSuccess]") {{ wyAccountStatus.message }}

dd
  h3#basic_music_api_gateway {{ $t('setting__basic_music_api_gateway') }}
  div
    .gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_music_api_gateway_url") {{ $t('setting__basic_music_api_gateway_url') }}
      base-input(
        id="setting_music_api_gateway_url"
        :class="$style.accountInput"
        :model-value="appSetting['common.music_api_gateway_url']"
        :disabled="isTestingMusicApiGateway"
        :placeholder="$t('setting__basic_music_api_gateway_url_placeholder')"
        @update:model-value="setMusicApiGatewayUrl")
    .gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_music_api_gateway_key") {{ $t('setting__basic_music_api_gateway_key') }}
      base-input(
        id="setting_music_api_gateway_key"
        :class="$style.accountInput"
        type="password"
        :trim="false"
        :model-value="appSetting['common.music_api_gateway_key']"
        :disabled="isTestingMusicApiGateway"
        :placeholder="$t('setting__basic_music_api_gateway_key_placeholder')"
        @update:model-value="setMusicApiGatewayKey")
    .gap-top(:class="$style.inputLine")
      label(:class="$style.inputLabel" for="setting_music_api_gateway_key_header") {{ $t('setting__basic_music_api_gateway_key_header') }}
      base-input(
        id="setting_music_api_gateway_key_header"
        :class="$style.accountInput"
        :model-value="appSetting['common.music_api_gateway_key_header']"
        :disabled="isTestingMusicApiGateway"
        :placeholder="$t('setting__basic_music_api_gateway_key_header_placeholder')"
        @update:model-value="setMusicApiGatewayKeyHeader")
    .gap-top
      base-checkbox(
        id="setting_music_api_gateway_allow_insecure_https"
        :model-value="appSetting['common.music_api_gateway_allow_insecure_https']"
        :label="$t('setting__basic_music_api_gateway_allow_insecure')"
        @update:model-value="updateSetting({ 'common.music_api_gateway_allow_insecure_https': $event })")
      svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__basic_music_api_gateway_allow_insecure_tip')")

    .gap-top(:class="$style.accountActionLine")
      base-btn.btn(min :disabled="isTestingMusicApiGateway || !appSetting['common.music_api_gateway_url']" @click="checkMusicApiGateway") {{ isTestingMusicApiGateway ? $t('setting__basic_music_api_gateway_testing') : $t('setting__basic_music_api_gateway_test') }}

      span(v-if="musicApiGatewayStatus.message" :class="[$style.accountStatus, musicApiGatewayStatus.isError ? $style.accountStatusError : $style.accountStatusSuccess]") {{ musicApiGatewayStatus.message }}

dd
  h3#basic_window_size {{ $t('setting__basic_window_size') }}
  div
    base-checkbox.gap-left(
      v-for="item in windowSizeList" :id="`setting_window_size_${item.id}`" :key="item.id"
      name="setting_window_size" need :model-value="appSetting['common.windowSizeId']" :disabled="isFullscreen" :value="item.id" :label="$t('setting__basic_window_size_' + item.name)"
      @update:model-value="updateSetting({'common.windowSizeId': $event})")

dd
  h3#basic_font_size {{ $t('setting__basic_font_size') }}
  div
    //- base-selection.gap-teft(:list="fontSizeList" :model-value="appSetting['common.fontSize']" @update:model-value="updateSetting({'common.fontSize': $event})")
    base-checkbox.gap-left(
      v-for="item in fontSizeList" :id="`setting_basic_font_size_${item.id}`" :key="item.id"
      name="setting_basic_font_size" need :model-value="appSetting['common.fontSize']" :value="item.id"
      :label="item.label" :disabled="isFullscreen" @update:model-value="updateSetting({'common.fontSize': $event})")

dd
  h3#basic_font {{ $t('setting__basic_font') }}
  div(style="--selection-width: 12rem;")
    base-selection.gap-left(:list="fontList" :model-value="fonts[0]" item-key="id" item-name="label" @update:model-value="updateFonts($event, fonts[1])")
    base-selection.gap-left(v-if="fonts[0]" :list="fontList" :model-value="fonts[1]" item-key="id" item-name="label" @update:model-value="updateFonts(fonts[0], $event)")
    //- base-selection.gap-teft(:list="fontList" :model-value="appSetting['common.font']" item-key="id" item-name="label" @update:model-value="updateSetting({'common.font': $event})")

dd
  h3#basic_lang {{ $t('setting__basic_lang') }}
  div
    base-checkbox.gap-left(
      v-for="item in langList" :id="`setting_lang_${item.locale}`" :key="item.locale" name="setting_lang"
      need :model-value="appSetting['common.langId']" :value="item.locale" :label="item.name" @update:model-value="updateSetting({'common.langId': $event})")

dd
  h3#basic_sourcename {{ $t('setting__basic_sourcename') }}
  div
    base-checkbox.gap-left(
      v-for="item in sourceNameTypes" :id="`setting_abasic_sourcename_${item.id}`" :key="item.id"
      name="setting_basic_sourcename" need :model-value="appSetting['common.sourceNameType']" :value="item.id" :label="item.label" @update:model-value="updateSetting({'common.sourceNameType': $event})")
dd
  h3#basic_control_btn_position {{ $t('setting__basic_control_btn_position') }}
  div
    base-checkbox.gap-left(
      v-for="item in controlBtnPositionList" :id="`setting_basic_control_btn_position_${item.id}`" :key="item.id"
      name="setting_basic_control_btn_position" need :model-value="appSetting['common.controlBtnPosition']" :value="item.id" :label="item.name" @update:model-value="updateSetting({'common.controlBtnPosition': $event})")
dd
  h3#basic_playbar_progress_style {{ $t('setting__basic_playbar_progress_style') }}
  div
    base-checkbox.gap-left(
      id="setting_basic_playbar_progress_style_mini" name="setting_basic_playbar_progress_style"
      need :model-value="appSetting['common.playBarProgressStyle']" value="mini" :label="$t('setting__basic_playbar_progress_style_mini')" @update:model-value="updateSetting({'common.playBarProgressStyle': $event})")
    base-checkbox.gap-left(
      id="setting_basic_playbar_progress_style_middle" name="setting_basic_playbar_progress_style"
      need :model-value="appSetting['common.playBarProgressStyle']" value="middle" :label="$t('setting__basic_playbar_progress_style_middle')" @update:model-value="updateSetting({'common.playBarProgressStyle': $event})")
    base-checkbox.gap-left(
      id="setting_basic_playbar_progress_style_full" name="setting_basic_playbar_progress_style"
      need :model-value="appSetting['common.playBarProgressStyle']" value="full" :label="$t('setting__basic_playbar_progress_style_full')" @update:model-value="updateSetting({'common.playBarProgressStyle': $event})")

//- 列表设置
dd
  h3#list {{ $t('setting__list') }}
  div
    .gap-top
      base-checkbox(id="setting_list_actionButtonsVisible_enable" :model-value="appSetting['list.actionButtonsVisible']" :label="$t('setting__list_action_btn')" @update:model-value="updateSetting({'list.actionButtonsVisible': $event})")
    .gap-top
      base-checkbox(id="setting_list_showSource_enable" :model-value="appSetting['list.isShowSource']" :label="$t('setting__list_source')" @update:model-value="updateSetting({'list.isShowSource': $event})")
    .gap-top
      base-checkbox(id="setting_list_scroll_enable" :model-value="appSetting['list.isSaveScrollLocation']" :label="$t('setting__list_scroll')" @update:model-value="updateSetting({'list.isSaveScrollLocation': $event})")
    .gap-top
      base-checkbox(id="setting_list_clickAction_enable" :model-value="appSetting['list.isClickPlayList']" :label="$t('setting__list_click_action')" @update:model-value="updateSetting({'list.isClickPlayList': $event})")
dd
  h3#list_addMusicLocationType {{ $t('setting__list_add_music_location_type') }}
  div
    base-checkbox.gap-left(
      id="setting_list_add_music_location_type_top" name="setting_list_add_music_location_type" need
      :model-value="appSetting['list.addMusicLocationType']" value="top" :label="$t('setting__list_add_music_location_type_top')"
      @update:model-value="updateSetting({'list.addMusicLocationType': $event})")
    base-checkbox.gap-left(
      id="setting_list_add_music_location_type_bottom" name="setting_list_add_music_location_type" need
      :model-value="appSetting['list.addMusicLocationType']" value="bottom" :label="$t('setting__list_add_music_location_type_bottom')"
      @update:model-value="updateSetting({'list.addMusicLocationType': $event})")

//- 搜索设置
dd
  h3#search {{ $t('setting__search') }}
  div
    .gap-top
      base-checkbox(id="setting_search_showHot_enable" :model-value="appSetting['search.isShowHotSearch']" :label="$t('setting__search_hot')" @update:model-value="updateSetting({'search.isShowHotSearch': $event})")
    .gap-top
      base-checkbox(id="setting_search_showHistory_enable" :model-value="appSetting['search.isShowHistorySearch']" :label="$t('setting__search_history')" @update:model-value="updateSetting({'search.isShowHistorySearch': $event})")
    .gap-top
      base-checkbox(id="setting_search_focusSearchBox_enable" :model-value="appSetting['search.isFocusSearchBox']" :label="$t('setting__search_focus_search_box')" @update:model-value="updateSetting({'search.isFocusSearchBox': $event})")

ThemeSelectorModal(v-model="isShowThemeSelectorModal")
ThemeEditModal(v-model="isShowThemeEditModal" :theme-id="editThemeId" @submit="handleRefreshTheme")
play-timeout-modal(v-model="isShowPlayTimeoutModal")
user-api-modal(v-model="isShowUserApiModal")
</template>

<script>
import { computed, ref, watch, reactive, shallowReactive } from '@common/utils/vueTools'
import { windowSizeList, userApi, isFullscreen, themeId } from '@renderer/store'
import { langList, useI18n } from '@root/lang'
import { getSystemFonts } from '@renderer/utils/ipc'
import apiSourceInfo from '@renderer/utils/musicSdk/api-source-info'
import { useTimeout } from '@renderer/core/player/timeoutStop'
import { dialog } from '@renderer/plugins/Dialog'

import ThemeSelectorModal from './ThemeSelectorModal.vue'
import ThemeEditModal from './ThemeEditModal/index.vue'
import PlayTimeoutModal from './PlayTimeoutModal.vue'
import UserApiModal from './UserApiModal.vue'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { getThemes, applyTheme, findTheme, buildBgUrl } from '@renderer/store/utils'
import { getAccountStatus } from '@renderer/utils/musicSdk/wy/user'
import { testMusicApiGateway } from '@renderer/core/musicApiGateway'

export default {
  name: 'SettingBasic',
  components: {
    ThemeSelectorModal,
    ThemeEditModal,
    PlayTimeoutModal,
    UserApiModal,
  },
  setup() {
    const t = useI18n()

    const showAllTheme = ref(false)
    const defaultThemesRaw = shallowReactive([])
    const defaultThemes = computed(() => {
      return defaultThemesRaw.map(theme => ({ ...theme, isDefault: true, name: t('theme_' + theme.id) }))
    })
    const userThemes = shallowReactive([])
    const allThemes = computed(() => {
      return [...defaultThemes.value, ...userThemes]
    })
    const themeList = computed(() => {
      if (!allThemes.value.length) return []
      return showAllTheme.value
        ? allThemes.value
        : themeId.value == 'auto'
          ? []
          : [allThemes.value.find(t => t.id == themeId.value) ?? allThemes.value[0]]
    })
    const autoTheme = reactive({})
    const updateAutoTheme = (info) => {
      let light = findTheme(info, appSetting['theme.lightId'])
      light ??= info.themes.find(theme => theme.id == 'green')
      let dark = findTheme(info, appSetting['theme.darkId'])
      dark ??= info.themes.find(theme => theme.id == 'black')
      autoTheme['--color-primary-theme-light'] = light.config.themeColors['--color-theme']
      autoTheme['--background-image-theme-light'] = light.isCustom
        ? light.config.extInfo['--background-image'] == 'none'
          ? 'none'
          : buildBgUrl(light.config.extInfo['--background-image'], info.dataPath)
        : light.config.extInfo['--background-image']
      autoTheme['--color-primary-theme-dark'] = dark.config.themeColors['--color-theme']
      autoTheme['--background-image-theme-dark'] = dark.isCustom
        ? dark.config.extInfo['--background-image'] == 'none'
          ? 'none'
          : buildBgUrl(dark.config.extInfo['--background-image'], info.dataPath)
        : dark.config.extInfo['--background-image']
    }

    let dataPath = ''
    const init = () => {
      getThemes((info) => {
        // console.log(info)
        dataPath = info.dataPath
        defaultThemesRaw.splice(0, defaultThemesRaw.length, ...info.themes.map(t => {
          return {
            id: t.id,
            styles: {
              '--color-primary-theme': t.config.themeColors['--color-theme'],
              '--background-image-theme': t.config.extInfo['--background-image'],
            },
          }
        }))
        userThemes.splice(0, userThemes.length, ...info.userThemes.map(t => {
          return {
            id: t.id,
            name: t.name,
            styles: {
              '--color-primary-theme': t.config.themeColors['--color-theme'],
              '--background-image-theme': t.config.extInfo['--background-image'] == 'none'
                ? 'none'
                : buildBgUrl(t.config.extInfo['--background-image'], info.dataPath),
            },
          }
        }))
        updateAutoTheme(info)
      })
    }
    const editThemeId = ref('')
    const handleEditTheme = (theme) => {
      // console.log(theme)
      if (theme?.isDefault) return
      if (!theme && userThemes.length >= 10) {
        void dialog({
          message: t('theme_max_tip'),
          confirmButtonText: t('alert_button_text'),
        })
        return
      }
      editThemeId.value = theme ? theme.id : ''
      isShowThemeEditModal.value = true
    }
    const handleRefreshTheme = () => {
      init()
    }
    init()
    const toggleTheme = (theme) => {
      if (themeId.value == theme.id) return
      themeId.value = theme.id
      applyTheme(theme.id, appSetting['theme.lightId'], appSetting['theme.darkId'], dataPath)
      updateSetting({ 'theme.id': theme.id })
    }

    watch(() => [appSetting['theme.lightId'], appSetting['theme.darkId']], () => {
      getThemes(updateAutoTheme)
    })
    const isShowThemeSelectorModal = ref(false)
    const handleSetThemeAuto = () => {
      if (themeId.value == 'auto') return
      if (window.localStorage.getItem('theme-auto-tip') != 'true') {
        window.localStorage.setItem('theme-auto-tip', 'true')
        void dialog({
          message: t('setting__basic_theme_auto_tip'),
          confirmButtonText: t('ok'),
        })
      }
      toggleTheme({ id: 'auto' })
    }
    const isShowThemeEditModal = ref(false)

    const isShowPlayTimeoutModal = ref(false)
    const { timeLabel } = useTimeout()

    const isShowUserApiModal = ref(false)
    const getApiStatus = () => {
      let status
      if (userApi.status) status = t('setting__basic_source_status_success')
      else if (userApi.message == 'initing') status = t('setting__basic_source_status_initing')
      else status = `${t('setting__basic_source_status_failed')}`

      return status
    }
    const apiSources = computed(() => {
      return [
        ...apiSourceInfo.map(api => ({
          id: api.id,
          name: api.name,
          label: api.name,
          disabled: api.disabled,
        })),
        ...userApi.list.map(api => ({
          id: api.id,
          name: api.name,
          label: `${api.name}${api.id == appSetting['common.apiSource'] ? `[${getApiStatus()}]` : ''}`,
          desc: [/^\d/.test(api.version) ? `v${api.version}` : api.version].filter(Boolean).join(', '),
          statusLabel: api.id == appSetting['common.apiSource'] ? `[${getApiStatus()}]` : '',
          status: api.status,
          message: api.message,
          disabled: false,
        })),
      ]
    })

    const sourceNameTypes = computed(() => {
      return [
        { id: 'real', label: t('setting__basic_sourcename_real') },
        { id: 'alias', label: t('setting__basic_sourcename_alias') },
      ]
    })


    const controlBtnPositionList = computed(() => {
      return [
        { id: 'left', name: t('setting__basic_control_btn_position_left') },
        { id: 'right', name: t('setting__basic_control_btn_position_right') },
      ]
    })

    const systemFontList = ref([])
    const fontList = computed(() => {
      return [{ id: '', label: t('setting__desktop_lyric_font_default') }, ...systemFontList.value]
    })
    void getSystemFonts().then(fonts => {
      systemFontList.value = fonts.map(f => ({ id: f, label: f.replace(/(^"|"$)/g, '') }))
    })

    const fonts = computed(() => {
      if (!appSetting['common.font']) return ['', '']
      let [f1 = '', f2 = ''] = appSetting['common.font'].split(',')
      return [f1.trim(), f2.trim()]
    })
    const updateFonts = (font1, font2) => {
      let font = []
      if (font1) font.push(font1)
      if (font2) font.push(font2)
      updateSetting({ 'common.font': font.join(', ') })
    }
    const isCheckingWyAccount = ref(false)
    const wyAccountStatus = reactive({
      message: '',
      isError: false,
    })
    const isTestingMusicApiGateway = ref(false)
    const musicApiGatewayStatus = reactive({
      message: '',
      isError: false,
    })
    const setWyCookie = cookie => {
      wyAccountStatus.message = ''
      updateSetting({ 'common.wy_cookie': cookie.trim() })
    }
    const setWySerpApiKey = key => {
      updateSetting({ 'common.wy_serpapi_key': key.trim() })
    }
    const setMusicApiGatewayUrl = url => {
      musicApiGatewayStatus.message = ''
      updateSetting({ 'common.music_api_gateway_url': url.trim() })
    }
    const setMusicApiGatewayKey = key => {
      musicApiGatewayStatus.message = ''
      updateSetting({ 'common.music_api_gateway_key': key.trim() })
    }
    const setMusicApiGatewayKeyHeader = keyHeader => {
      updateSetting({ 'common.music_api_gateway_key_header': keyHeader.trim() || 'X-API-Key' })
    }
    const getWyVipLabel = vipType => {
      return vipType > 0
        ? t('setting__basic_wy_vip')
        : t('setting__basic_wy_normal')
    }
    const checkWyAccount = async() => {
      if (!appSetting['common.wy_cookie']) {
        wyAccountStatus.message = t('setting__basic_wy_status_empty')
        wyAccountStatus.isError = true
        return
      }
      isCheckingWyAccount.value = true
      wyAccountStatus.message = ''
      wyAccountStatus.isError = false
      try {
        const info = await getAccountStatus()
        wyAccountStatus.message = t('setting__basic_wy_status_success', {
          nickname: info.nickname || '-',
          uid: info.uid || '-',
          vip: getWyVipLabel(info.vipType),
        })
      } catch (err) {
        wyAccountStatus.message = t('setting__basic_wy_status_failed', {
          message: err.message || String(err),
        })
        wyAccountStatus.isError = true
      } finally {
        isCheckingWyAccount.value = false
      }
    }
    const checkMusicApiGateway = async() => {
      if (!appSetting['common.music_api_gateway_url']) {
        musicApiGatewayStatus.message = t('setting__basic_music_api_gateway_status_empty')
        musicApiGatewayStatus.isError = true
        return
      }
      isTestingMusicApiGateway.value = true
      musicApiGatewayStatus.message = ''
      musicApiGatewayStatus.isError = false
      try {
        await testMusicApiGateway()
        musicApiGatewayStatus.message = t('setting__basic_music_api_gateway_status_success')
      } catch (err) {
        musicApiGatewayStatus.message = t('setting__basic_music_api_gateway_status_failed', {
          message: err.message || String(err),
        })
        musicApiGatewayStatus.isError = true
      } finally {
        isTestingMusicApiGateway.value = false
      }
    }
    const fontSizeList = computed(() => {
      return [
        { id: 14, label: t('setting__basic_font_size_14px') },
        { id: 15, label: t('setting__basic_font_size_15px') },
        { id: 16, label: t('setting__basic_font_size_16px') },
        { id: 17, label: t('setting__basic_font_size_17px') },
        { id: 18, label: t('setting__basic_font_size_18px') },
        { id: 19, label: t('setting__basic_font_size_19px') },
      ]
    })


    return {
      appSetting,
      updateSetting,
      userThemes,
      autoTheme,
      showAllTheme,
      themeList,
      fonts,
      updateFonts,
      setWyCookie,
      setWySerpApiKey,
      setMusicApiGatewayUrl,
      setMusicApiGatewayKey,
      setMusicApiGatewayKeyHeader,
      isCheckingWyAccount,
      wyAccountStatus,
      checkWyAccount,
      isTestingMusicApiGateway,
      musicApiGatewayStatus,
      checkMusicApiGateway,
      // currentStting,
      // themes,
      // themeClassName,
      isShowThemeSelectorModal,
      isShowThemeEditModal,
      handleSetThemeAuto,
      isShowPlayTimeoutModal,
      timeLabel,
      apiSources,
      isShowUserApiModal,
      windowSizeList,
      langList,
      sourceNameTypes,
      controlBtnPositionList,
      fontList,
      isFullscreen,
      toggleTheme,
      themeId,
      handleRefreshTheme,
      editThemeId,
      handleEditTheme,
      fontSizeList,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.theme {
  display: flex;
  flex-flow: row wrap;
  // padding: 0 15px;
  margin-bottom: -20px;

  .themeItem {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    cursor: pointer;
    // color: var(--color-primary);
    margin-right: 8px;
    transition: .3s ease;
    transition-property: color, opacity;
    margin-bottom: 18px;
    width: 86px;

    &:hover {
      opacity: .7;
    }

    &:last-child {
      margin-right: 0;
    }

    &.active {
      color: var(--color-primary-font-active);
      .bg {
        border-color: var(--color-primary-font-active);
      }

      &:hover {
        opacity: 1;
      }
    }

    .bg {
      display: block;
      width: 36px;
      height: 36px;
      margin-bottom: 5px;
      border: 2Px solid transparent;
      padding: 2Px;
      transition: border-color .3s ease;
      border-radius: 5px;
      &:after {
        display: block;
        content: ' ';
        width: 100%;
        height: 100%;
        border-radius: @radius-border;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        background-color: var(--color-primary-theme);
        background-image: var(--background-image-theme);
      }
    }

    .label {
      width: 100%;
      text-align: center;
      height: 1.2em;
    }

    &.auto {

      &.active {
        color: var(--color-primary-font-active);
        .bg {
          border-color: var(--color-primary-font-active);
        }
      }

      >.bg {
        &:after {
          content: none;
        }
      }
      .bgContent {
        position: relative;
        height: 100%;
        overflow: hidden;
        border-radius: 5px;
      }
      .light, .dark {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        &:after {
          display: block;
          content: ' ';
          width: 100%;
          height: 100%;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        }
      }
      .light {
        &:after {
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }
        svg {
          fill: var(--color-primary-theme-light);
        }
        &:after {
          background-color: var(--color-primary-theme-light);
          background-image: var(--background-image-theme-light);
        }
      }
      .dark {
        &:after {
          clip-path: polygon(0 100%, 100% 0, 100% 100%);
        }
        svg {
          fill: var(--color-primary-theme-dark);
        }
        &:after {
          background-color: var(--color-primary-theme-dark);
          background-image: var(--background-image-theme-dark);
        }
      }
    }

    &.add {
      >.bg {
        &:after {
          content: none;
        }
        .bgContent {
          transition: .3s ease;
          transition-property: border, color;
          box-sizing: border-box;
          border: 1Px dashed var(--color-primary-light-100-alpha-300);
          color: var(--color-primary-light-100-alpha-300);
          position: relative;
          height: 100%;
          overflow: hidden;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon {
          // position: absolute;
          // font-size: 16px;
          width: 66%;
          height: auto;
        }
      }
      .label {
        color: var(--color-primary-dark-100-alpha-300);
      }
    }

    &.moreThme {
      flex-direction: row;
      width: auto;
      gap: 5px;
      color: var(--color-primary-font-active);
      .label {
        height: auto;
      }
    }
  }
}

.sourceLabel {
  flex: auto;
  margin-left: 5px;
  line-height: 1.5;
  cursor: pointer;

  .desc {
    color: var(--color-500);
    font-size: 12px;
    margin-left: 5px;
  }

  .status {
    margin-left: 5px;
  }
}

.inputLine {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inputLabel {
  min-width: 130px;
}

.accountInput {
  width: min(560px, 100%);
}

.accountActionLine {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 24px;
}

.accountStatus {
  line-height: 1.5;
  word-break: break-all;
}

.accountStatusSuccess {
  color: var(--color-primary-font-active);
}

.accountStatusError {
  color: var(--color-btn-close);
}

.accountPreview {
  margin-top: 6px;
  padding-left: 18px;
  line-height: 1.6;
  color: var(--color-600);
}

</style>
