import { useState } from 'react'
import { View, BackHandler } from 'react-native'
import { useEffect } from 'react'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'
import CategoryHome, { type SettingCategoryId } from './CategoryHome'
import CategoryDetail from './CategoryDetail'

const styles = createStyle({
  container: {
    flex: 1,
    borderTopWidth: BorderWidths.normal,
  },
  content: {
    flex: 1,
  },
})

export default () => {
  const theme = useTheme()
  const [activeCategory, setActiveCategory] = useState<SettingCategoryId | null>(null)

  useEffect(() => {
    if (!activeCategory) return
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveCategory(null)
      return true
    })
    return () => handler.remove()
  }, [activeCategory])

  return (
    <View style={{ ...styles.container, borderTopColor: theme['c-border-background'] }}>
      <View style={styles.content}>
        {activeCategory ? (
          <CategoryDetail
            categoryId={activeCategory}
            onBack={() => setActiveCategory(null)}
          />
        ) : (
          <CategoryHome onPress={setActiveCategory} />
        )}
      </View>
    </View>
  )
}
