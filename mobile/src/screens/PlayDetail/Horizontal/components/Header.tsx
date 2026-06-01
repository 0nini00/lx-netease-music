import { memo, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import CommentBtn from './CommentBtn'
import Btn from './Btn'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import DesktopLyricBtn from './DesktopLyricBtn'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

const Title = () => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const musicInfo = playMusicInfo.musicInfo ? ('progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo) : null
  const singerText = musicInfo?.artists?.length
    ? musicInfo.artists.map(artist => artist.name).join(' / ')
    : musicInfo?.singer
  const subTitle = [singerText, musicInfo?.meta?.albumName].filter(Boolean).join(' - ')

  return (
    <View style={styles.titleContent}>
      {musicInfo ? (
        <>
          <Text numberOfLines={1} style={styles.title} size={14}>
            {musicInfo.name}
            {musicInfo.alias ? <Text color={theme['c-font-label']}> ({musicInfo.alias})</Text> : null}
          </Text>
          {subTitle ? (
            <Text numberOfLines={1} style={styles.singerText} size={12} color={theme['c-font-label']}>
              {subTitle}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const playMusicInfo = usePlayMusicInfo()

  const back = () => {
    void pop(commonState.componentIds[commonState.componentIds.length - 1]?.id!)
  }

  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View style={{ height: HEADER_HEIGHT }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <View style={styles.container}>
        <TouchableOpacity style={{ ...styles.button, width: HEADER_HEIGHT }} onPress={back}>
          <Icon name='chevron-left' size={18} />
        </TouchableOpacity>
        <Title />
        <DesktopLyricBtn />
        <CommentBtn />
        <Btn icon='slider' onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} position='left' direction='horizontal' />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 0,
    flexDirection: 'row',
    height: '100%',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
  titleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {},
  singerText: {
    paddingTop: 2,
  },
})
