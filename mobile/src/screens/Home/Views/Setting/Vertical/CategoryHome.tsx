import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'
import { type SettingScreenIds } from '../Main'

export type SettingCategoryId =
  | 'basic'
  | 'player'
  | 'search'
  | 'list'
  | 'download'
  | 'sync'
  | 'theme'
  | 'other'

export const SETTING_CATEGORIES: Array<{
  id: SettingCategoryId
  title: string
  desc: string
  screens: SettingScreenIds[]
}> = [
  { id: 'basic', title: '基本设置', desc: '语言、主页、显示与常用行为', screens: ['basic'] },
  { id: 'player', title: '播放设置', desc: '播放方式、网关、音质、歌词、桌面歌词', screens: ['player', 'lyric_desktop'] },
  { id: 'search', title: '搜索设置', desc: '搜索源、热搜、历史搜索', screens: ['search'] },
  { id: 'list', title: '列表设置', desc: '歌单展示、添加位置、列表行为', screens: ['list'] },
  { id: 'download', title: '下载设置', desc: '保存路径、写入歌词、封面与元数据', screens: ['download'] },
  { id: 'sync', title: '同步设置', desc: 'WebDAV、远端同步与备份', screens: ['sync', 'backup'] },
  { id: 'theme', title: '主题设置', desc: '主题、背景、透明度、阴影', screens: ['theme'] },
  { id: 'other', title: '其他设置', desc: '缓存、日志与杂项功能', screens: ['other'] },
]

export default memo(({ onPress }: { onPress: (id: SettingCategoryId) => void }) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      {SETTING_CATEGORIES.map(item => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.8}
          style={{ ...styles.card, borderColor: theme['c-border-background'] }}
          onPress={() => onPress(item.id)}
        >
          <View style={styles.cardText}>
            <Text size={16} color={theme['c-font']}>
              {item.title}
            </Text>
            <Text size={12} color={theme['c-font-label']} style={styles.desc} numberOfLines={2}>
              {item.desc}
            </Text>
          </View>
          <Text size={18} color={theme['c-font-label']}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: BorderWidths.normal,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardText: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  desc: {
    lineHeight: 16,
  },
})

