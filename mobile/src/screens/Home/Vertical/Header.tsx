import { View } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import GlobalSearch from '@/components/GlobalSearch'
import React from 'react'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
}

const Header = () => {
  const id = useNavActiveId()
  const t = useI18n()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const isSearchPage = id === 'nav_search'

  return (
    <>
      <StatusBar />
      <View
        style={{
          ...styles.container,
          height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
          paddingTop: statusBarHeight,
          backgroundColor: theme['c-content-background'],
        }}
      >
        <View style={styles.left}>
          <Text style={styles.title} size={18} numberOfLines={1}>
            {t(id)}
          </Text>
        </View>
        {!isSearchPage ? <GlobalSearch /> : headerComponents[id]}
      </View>
    </>
  )
}

const styles = createStyle({
  container: {
    paddingRight: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 14,
    alignItems: 'center',
    height: '100%',
  },
  title: {
    paddingRight: 12,
  },
})

export default Header
