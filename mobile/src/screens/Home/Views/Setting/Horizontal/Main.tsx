import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'
import VerticalMain from '../Vertical/Main'

const styles = createStyle({
  container: {
    flex: 1,
    borderTopWidth: BorderWidths.normal,
  },
  main: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
  },
})

export default () => {
  const theme = useTheme()
  return (
    <View style={{ ...styles.container, borderTopColor: theme['c-border-background'] }}>
      <View style={styles.main}>
        <VerticalMain />
      </View>
    </View>
  )
}
