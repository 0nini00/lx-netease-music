import { View } from 'react-native'

import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import Main from './Main'
import { createStyle } from '@/utils/tools'
import BottomNav from '../BottomNav'

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default ({ componentId }: { componentId: string }) => {
  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.content}>
          <Header />
          <Main />
          <PlayerBar componentId={componentId} isHome />
          <BottomNav />
        </View>
      </View>
    </>
  )
}
