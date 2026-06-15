import { createIconSetFromIcoMoon } from 'react-native-vector-icons'
import icoMoonConfig from '@/resources/fonts/selection.json'
import { scaleSizeW } from '@/utils/pixelRatio'
import { memo } from 'react'
import { useTextShadow, useTheme } from '@/store/theme/hook'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'

const IcoMoon = createIconSetFromIcoMoon(icoMoonConfig)

interface IconProps {
  name: string
  color?: string
  size?: number
  style?: StyleProp<TextStyle>
  rawSize?: number
  [key: string]: any
}

export const Icon = memo(({ size = 15, rawSize, color, style, ...props }: IconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const newStyle = textShadow
    ? StyleSheet.compose(
        {
          textShadowColor: theme['c-primary-dark-300-alpha-800'],
          textShadowOffset: { width: 0.2, height: 0.2 },
          textShadowRadius: 2,
        },
        style
      )
    : style
  const IcoMoonComponent = IcoMoon as any
  return (
    <IcoMoonComponent
      size={rawSize ?? scaleSizeW(size)}
      color={color ?? theme['c-font']}
      style={newStyle}
      {...props}
    />
  )
})
