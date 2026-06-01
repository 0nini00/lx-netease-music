import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomNav from '../BottomNav'

export default ({ componentId }: { componentId: string }) => {
  return (
    <>
      <Content />
      <PlayerBar componentId={componentId} isHome />
      <BottomNav />
    </>
  )
}
