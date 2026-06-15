import { hideDesktopLyric } from './desktopLyric'
import { exitApp as utilExitApp } from '@/utils/nativeModules/utils'
import { updateWidget } from '@/utils/nativeModules/musicWidget'
import { destroy as destroyPlayer } from '@/plugins/player/utils'
import { initSetting as initAppSetting } from '@/config/setting'
import { setLanguage as applyLanguage } from '@/lang/i18n'
import { Platform, PermissionsAndroid } from 'react-native'

import settingActions from '@/store/setting/action'
import settingState from '@/store/setting/state'
import commonActions from '@/store/common/action'
import commonState, { type InitState as CommonStateType } from '@/store/common/state'

import { storageDataPrefix, COMPONENT_IDS } from '@/config/constant'
import { saveData } from '@/plugins/storage'
import { throttle } from '@/utils/common'
import {
  getSelectedManagedFolder,
  saveFontSize,
  saveViewPrevState,
  setSelectedManagedFolder,
} from '@/utils/data'
import { showPactModal as handleShowPactModal } from '@/navigation'
import { hideDesktopLyricView } from '@/utils/nativeModules/lyricDesktop'
import { getPersistedUriList, selectManagedFolder } from '@/utils/fs'
const throttleSaveSetting = throttle(() => {
  void saveData(storageDataPrefix.setting, settingState.setting)
})

/**
 * 初始化设置
 */
export const initSetting = async () => {
  const setting = (await initAppSetting()).setting
  settingActions.updateSetting(setting)
  return setting
}

/**
 * 更新设置
 * @param setting 新设置
 */
export const updateSetting = (setting: Partial<LX.AppSetting>) => {
  settingActions.updateSetting(setting);
  throttleSaveSetting();
};

export const setLanguage = (locale: Parameters<typeof applyLanguage>[0]) => {
  updateSetting({ 'common.langId': locale })
  global.state_event.languageChanged(locale)
  requestAnimationFrame(() => {
    applyLanguage(locale)
  })
}

let isDestroying = false
export const exitApp = (reason: string) => {
  console.log('Handle Exit App, Reason: ' + reason)
  if (isDestroying) return
  isDestroying = true
  void Promise.all([
    hideDesktopLyric(),
    destroyPlayer(),
    hideDesktopLyricView(),
    updateWidget('', '', false).catch(() => { }),
  ]).finally(() => {
    isDestroying = false
    utilExitApp()
  })
}

export const setFontSize = (size: number) => {
  commonActions.setFontSize(size)
  void saveFontSize(size)
}

export const setStatusbarHeight = (size: number) => {
  commonActions.setStatusbarHeight(size)
}

export const setComponentId = (name: COMPONENT_IDS, id: string) => {
  commonActions.setComponentId(name as any, id)
}
export const removeComponentId = (name: string) => {
  commonActions.removeComponentId(name)
}

export const setNavActiveId = (id: Parameters<typeof commonActions.setNavActiveId>['0']) => {
  if (id == commonState.navActiveId) return
  commonActions.setNavActiveId(id)
  // 只在真正的主导航切换时保存回退状态，避免播放历史这类页面污染主入口
  if (id != 'nav_setting') {
    commonActions.setLastNavActiveId(id)
    saveViewPrevState({ id })
  }
}

export const showPactModal = () => {
  handleShowPactModal()
}

export const checkStoragePermissions = async () => {
  const selectedManagedFolder = await getSelectedManagedFolder()
  if (selectedManagedFolder)
    return (await getPersistedUriList()).some((uri: any) => selectedManagedFolder.startsWith(uri))
  return false
}

export const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: '存储权限',
        message: '需要访问存储以扫描本地音乐文件',
        buttonNeutral: '稍后',
        buttonNegative: '取消',
        buttonPositive: '确定',
      }
    )
    return granted === PermissionsAndroid.RESULTS.GRANTED
  } catch (err) {
    console.warn('requestStoragePermission error:', err)
    return false
  }
}

export const setBgPic = (pic: string | null) => {
  commonActions.setBgPic(pic)
}
