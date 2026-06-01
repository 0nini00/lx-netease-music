import { useState } from 'react'
import { View } from 'react-native'

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
