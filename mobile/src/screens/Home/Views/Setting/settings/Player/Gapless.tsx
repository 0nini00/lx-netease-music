import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isGaplessEnabled = useSettingValue('player.isGaplessEnabled')
  const isCrossfadeEnabled = useSettingValue('player.isCrossfadeEnabled')

  const setGaplessEnabled = (enabled: boolean) => {
    updateSetting({
      'player.isGaplessEnabled': enabled,
      // 如果启用无缝播放，则禁用淡入淡出
      'player.isCrossfadeEnabled': enabled ? false : isCrossfadeEnabled
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isGaplessEnabled}
        onChange={setGaplessEnabled}
        helpDesc={t('setting_play_gapless_tip')}
        label={t('setting_play_gapless')}
      />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
