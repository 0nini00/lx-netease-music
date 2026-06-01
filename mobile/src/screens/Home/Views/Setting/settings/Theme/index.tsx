import { memo } from 'react'

import Theme from './Theme'
import IsAutoTheme from './IsAutoTheme'
import IsHideBgDark from './IsHideBgDark'
import IsDynamicBg from './IsDynamicBg'
import IsFontShadow from './IsFontShadow'
import Blur from "@/screens/Home/Views/Setting/settings/Theme/Blur.tsx";
import CustomBg from "@/screens/Home/Views/Setting/settings/Theme/CustomBg.tsx";
import PicOpacity from "@/screens/Home/Views/Setting/settings/Theme/PicOpacity.tsx";

export default memo(() => {
  return (
    <>
      <Theme />
      <IsAutoTheme />
      <IsDynamicBg />
      <CustomBg />
      <PicOpacity />
      <Blur />
      <IsFontShadow />
      <IsHideBgDark />
    </>
  )
})