import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import CheckBox from '@/components/common/CheckBox'
import SubTitle from '../../components/SubTitle'

const DURATION_LIST = [
  { duration: 1, label: '1s' },
  { duration: 2, label: '2s' },
  { duration: 3, label: '3s' },
  { duration: 5, label: '5s' },
  { duration: 8, label: '8s' },
  { duration: 10, label: '10s' },
] as const

type DURATION_TYPE = (typeof DURATION_LIST)[number]['duration']

const useActive = (duration: DURATION_TYPE) => {
  const currentDuration = useSettingValue('player.crossfadeDuration')
  return useMemo(() => currentDuration === duration, [currentDuration, duration])
}

const Item = ({ duration, label }: { duration: DURATION_TYPE; label: string }) => {
  const isActive = useActive(duration)
  const isCrossfadeEnabled = useSettingValue('player.isCrossfadeEnabled')

  return (
    <CheckBox
      marginRight={8}
      check={isActive}
      label={label}
      onChange={() => {
        updateSetting({ 'player.crossfadeDuration': duration })
      }}
      disabled={!isCrossfadeEnabled}
      need
    />
  )
}

export default memo(() => {
  const t = useI18n()
  const isCrossfadeEnabled = useSettingValue('player.isCrossfadeEnabled')

  if (!isCrossfadeEnabled) return null

  return (
    <SubTitle title={t('setting_play_crossfade_duration')}>
      <View style={styles.list}>
        {DURATION_LIST.map(({ duration, label }) => (
          <Item key={duration} duration={duration} label={label} />
        ))}
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
