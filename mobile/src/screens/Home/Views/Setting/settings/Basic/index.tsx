import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsHomePageScroll from './IsHomePageScroll'
import IsShowBackBtn from './IsShowBackBtn'
import IsShowExitBtn from './IsShowExitBtn'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'
import WyCookie from './WyCookie'
import NavMenu from './NavMenu'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_basic')}>
      <IsStartupAutoPlay />
      {global.lx.isCarMode ? (
        <>
          <IsShowBackBtn />
          <IsShowExitBtn />
        </>
      ) : null}
      <IsHomePageScroll />
      <IsUseSystemFileSelector />
      <IsAlwaysKeepStatusbarHeight />
      <Theme />
      <DrawerLayoutPosition />
      <NavMenu />
      <Language />
      <FontSize />
      <ShareType />
      <Source />
      <SourceName />
      <WyCookie />
    </Section>
  )
})
