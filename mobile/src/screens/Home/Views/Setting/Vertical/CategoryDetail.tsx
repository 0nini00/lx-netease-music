import { memo } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'
import { SETTING_CATEGORIES, type SettingCategoryId } from './CategoryHome'
import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Download from '../settings/Download'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Theme from '../settings/Theme'
import Other from '../settings/Other'

const CATEGORY_COMPONENT_MAP: Record<SettingCategoryId, JSX.Element> = {
  basic: <Basic />,
  player: (
    <>
      <Player />
      <LyricDesktop />
    </>
  ),
  search: <Search />,
  list: <List />,
  download: <Download />,
  sync: (
    <>
      <Sync />
      <Backup />
    </>
  ),
  theme: <Theme />,
  other: <Other />,
}

export default memo(({
  categoryId,
  onBack,
}: {
  categoryId: SettingCategoryId
  onBack: () => void
}) => {
  const theme = useTheme()
  const category = SETTING_CATEGORIES.find(item => item.id === categoryId)!

  return (
    <View style={styles.container}>
      <View style={{ ...styles.header, borderBottomColor: theme['c-border-background'] }}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={onBack}>
          <Text color={theme['c-primary-font']}>‹ 返回</Text>
        </TouchableOpacity>
        <Text size={16} color={theme['c-font']}>
          {category.title}
        </Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={styles.body}>
        <View style={styles.section}>{CATEGORY_COMPONENT_MAP[categoryId]}</View>
      </ScrollView>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: BorderWidths.normal,
  },
  backBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },
  section: {
    gap: 10,
  },
})


