import TrackPlayer from 'react-native-track-player'
import BackgroundTimer from 'react-native-background-timer'
import settingState from '@/store/setting/state'

let fadeTimer: number | null = null
let isFading = false
let savedVolume: number | null = null

const cancelFadeTimer = () => {
  if (!fadeTimer) return
  BackgroundTimer.clearTimeout(fadeTimer)
  fadeTimer = null
}

/**
 * 淡出当前歌曲
 */
export const fadeOut = async (duration: number): Promise<void> => {
  if (isFading) return
  cancelFadeTimer()
  isFading = true

  try {
    const startVolume = await TrackPlayer.getVolume()
    savedVolume = settingState.setting['player.volume']
    const steps = 20 // 20步完成淡出
    const stepDuration = (duration * 1000) / steps
    const volumeDecrement = startVolume / steps

    let currentStep = 0

    return new Promise((resolve) => {
      const fade = () => {
        currentStep++
        const newVolume = Math.max(0, startVolume - volumeDecrement * currentStep)

        TrackPlayer.setVolume(newVolume).catch(() => {})

        if (currentStep >= steps || newVolume <= 0) {
          isFading = false
          savedVolume = null
          resolve()
        } else {
          fadeTimer = BackgroundTimer.setTimeout(fade, stepDuration)
        }
      }

      fade()
    })
  } catch (err) {
    isFading = false
    throw err
  }
}

/**
 * 淡入新歌曲
 */
export const fadeIn = async (duration: number, targetVolume: number): Promise<void> => {
  if (isFading) return
  cancelFadeTimer()
  isFading = true
  savedVolume = targetVolume

  try {
    await TrackPlayer.setVolume(0)

    const steps = 20
    const stepDuration = (duration * 1000) / steps
    const volumeIncrement = targetVolume / steps

    let currentStep = 0

    return new Promise((resolve) => {
      const fade = () => {
        currentStep++
        const newVolume = Math.min(targetVolume, volumeIncrement * currentStep)

        TrackPlayer.setVolume(newVolume).catch(() => {})

        if (currentStep >= steps || newVolume >= targetVolume) {
          isFading = false
          savedVolume = null
          resolve()
        } else {
          fadeTimer = BackgroundTimer.setTimeout(fade, stepDuration)
        }
      }

      fade()
    })
  } catch (err) {
    isFading = false
    throw err
  }
}

/**
 * 停止淡入淡出
 */
export const stopFade = () => {
  cancelFadeTimer()
  if (savedVolume != null) {
    TrackPlayer.setVolume(savedVolume).catch(() => {})
    savedVolume = null
  }
  isFading = false
}

/**
 * 检查是否启用淡入淡出
 */
export const isCrossfadeEnabled = (): boolean => {
  return settingState.setting['player.isCrossfadeEnabled'] &&
         !settingState.setting['player.isGaplessEnabled']
}

/**
 * 获取淡入淡出时长
 */
export const getCrossfadeDuration = (): number => {
  const duration = settingState.setting['player.crossfadeDuration']
  return Math.max(1, Math.min(10, duration)) // 限制在1-10秒
}

/**
 * 检查是否启用无缝播放
 */
export const isGaplessEnabled = (): boolean => {
  return settingState.setting['player.isGaplessEnabled'] &&
         !settingState.setting['player.isCrossfadeEnabled']
}
