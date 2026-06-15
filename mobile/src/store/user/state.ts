export interface SubscribedPlaylistInfo {
  id: string | number
  userId: number
  name: string
  coverImgUrl: string
  trackCount: number
  description?: string
  creator?: {
    nickname: string
  }
  playCount?: string | number
}

export interface InitState {
  wy_uid: string | null
  wy_liked_song_ids: Set<string>
  wy_subscribed_playlists: SubscribedPlaylistInfo[]
  wy_vip_type: number
}
const state: InitState = {
  wy_uid: null,
  wy_liked_song_ids: new Set(),
  wy_subscribed_playlists: [],
  wy_vip_type: 0,
}

export default state
