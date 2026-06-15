import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isCrossfadeEnabled = useSettingValue('player.isCrossfadeEnabled')
  const isGaplessEnabled = useSettingValue('player.isGaplessEnabled')

  const setCrossfadeEnabled = (enabled: boolean) => {
    updateSetting({
      'player.isCrossfadeEnabled': enabled,
      // 如果启用淡入淡出，则禁用无缝播放
      'player.isGaplessEnabled': enabled ? false : isGaplessEnabled
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isCrossfadeEnabled}
        onChange={setCrossfadeEnabled}
        helpDesc={t('setting_play_crossfade_tip')}
        label={t('setting_play_crossfade')}
      />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
