import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { InitState as SearchState } from '@/store/search/state'
import type { Source as MusicSource } from '@/store/search/music/state'
import type { Source as SongListSource } from '@/store/search/songlist/state'
import MusicList, { type MusicListType } from './MusicList'
import BlankView, { type BlankViewType } from './BlankView'
import SonglistList from './SonglistList'
import SingerList, { type SingerListType } from './SingerList'

interface ListProps {
  onSearch: (keyword: string) => void
  onOpenDetail: (item: any) => void
}

export interface ListType {
  loadList: (
    text: string,
    source: MusicSource | SongListSource,
    type: SearchState['searchType']
  ) => void
}

export default forwardRef<ListType, ListProps>(({ onSearch, onOpenDetail }, ref) => {
  const [listType, setListType] = useState<SearchState['searchType']>('music')
  const [showBlankView, setShowListView] = useState(true)
  const listRef = useRef<MusicListType>(null)
  const blankViewRef = useRef<BlankViewType>(null)

  useImperativeHandle(ref, () => ({
    loadList(text, source, type) {
      if (text) {
        setShowListView(false)
        setListType(type)
        requestAnimationFrame(() => {
          listRef.current?.loadList(text, source as any)
        })
      } else {
        setShowListView(true)
        requestAnimationFrame(() => {
          blankViewRef.current?.show(source)
        })
      }
    },
  }), [])

  const renderList = () => {
    switch (listType) {
      case 'songlist':
        return <SonglistList ref={listRef} onOpenDetail={onOpenDetail} />
      case 'singer':
        return <SingerList ref={listRef as any} />
      case 'music':
      default:
        return <MusicList ref={listRef} />
    }
  }

  return showBlankView ? <BlankView ref={blankViewRef} onSearch={onSearch} /> : renderList()
})