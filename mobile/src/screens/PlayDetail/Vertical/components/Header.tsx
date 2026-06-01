import { memo, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'
import TimeoutExitBtn from './TimeoutExitBtn'
import Marquee from './Marquee'
import StatusBar from '@/components/common/StatusBar'

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
          <Marquee style={styles.title} size={16}>
            {musicInfo.name}
            {musicInfo.alias ? <Text color={theme['c-font-label']}> ({musicInfo.alias})</Text> : null}
          </Marquee>
          {subTitle ? (
            <Text numberOfLines={1} style={styles.singerText} size={12} color={theme['c-font']}>
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
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds[commonState.componentIds.length - 1]?.id!)
  }

  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View
      style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}
    >
      <StatusBar />
      <View style={styles.container}>
        <Btn icon='chevron-left' onPress={back} />
        <Title />
        <TimeoutExitBtn />
        <Btn icon='slider' onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} direction='vertical' />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  titleContent: {
    flex: 1,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  title: {},
  singerText: {
    paddingRight: 2,
  },
})
