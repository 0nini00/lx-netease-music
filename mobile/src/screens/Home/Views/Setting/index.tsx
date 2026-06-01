import { useCallback } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import commonState from '@/store/common/state'
import { setNavActiveId } from '@/core/common'

export default () => {
  const isHorizontalMode = useHorizontalMode()
  useBackHandler(
    useCallback(() => {
      if (commonState.componentIds.length == 1 && commonState.navActiveId == 'nav_setting') {
        setNavActiveId(commonState.lastNavActiveId)
        return true
      }
      return false
    }, [])
  )

  return isHorizontalMode ? <Horizontal /> : <Vertical />
}
