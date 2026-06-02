import { useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { getSearchSetting } from '@/utils/data'
import { BorderWidths } from '@/theme'

const SEARCH_TYPE_LIST = ['music', 'songlist', 'singer', 'album'] as const

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then((info) => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map((type) => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps={'always'} horizontal={true}>
      {list.map((t) => (
        <TouchableOpacity
          style={styles.button}
          onPress={() => { handleTypeChange(t.id) }}
          key={t.id}
        >
          <Text
            style={{
              ...styles.buttonText,
              borderBottomColor: type == t.id ? theme['c-font-label'] : 'transparent',
            }}
            color={type == t.id ? theme['c-font-label'] : theme['c-font']}
          >
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = createStyle({
  container: { height: '100%', flexGrow: 0, flexShrink: 1 },
  button: { justifyContent: 'center', paddingLeft: 8, paddingRight: 8 },
  buttonText: { textAlign: 'center', paddingLeft: 2, paddingRight: 2, paddingTop: 3, paddingBottom: 3, borderBottomWidth: BorderWidths.normal3 },
})