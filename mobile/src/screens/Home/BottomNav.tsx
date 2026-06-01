import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import { SvgIcon } from '@/components/common/SvgIcon'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'

const renderIcon = (icon: string, size: number, color: string) => {
  if (icon.startsWith('svg:')) return <SvgIcon name={icon.slice(4)} size={size} color={color} />
  return <Icon name={icon} size={size} color={color} />
}

const BottomNav = memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const activeId = useNavActiveId()

  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: theme['c-content-background'],
        borderTopColor: theme['c-border-background'],
      }}
    >
      {/* 底栏固定五个主入口：歌单 / 排行榜 / 每日推荐 / 我的 / 设置 */}
      {NAV_MENUS.map(({ id, icon }) => {
        const active = activeId == id
        const color = active ? theme['c-primary-font-active'] : theme['c-font-label']
        return (
          <TouchableOpacity
            key={id}
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => {
              setNavActiveId(id)
            }}
          >
            {renderIcon(icon, 21, color)}
            <Text style={styles.label} size={11} color={color} numberOfLines={1}>
              {t(id)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: BorderWidths.normal,
    paddingTop: 4,
    paddingBottom: 4,
    minHeight: 54,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    marginTop: 2,
  },
})

export default BottomNav
