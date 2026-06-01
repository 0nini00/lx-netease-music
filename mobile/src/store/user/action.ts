import state, { SubscribedPlaylistInfo } from './state'

export const setWyUid = (uid: string | null) => {
  state.wy_uid = uid
  global.state_event.wyUidChanged()
}
export const setWyVipType = (type: number) => {
  state.wy_vip_type = type
}
export const setWyLikedSongs = (ids: (string | number)[]) => {
  state.wy_liked_song_ids = new Set(ids.map(String))
  global.state_event.wyLikedListChanged()
}
export const addWyLikedSong = (id: string | number) => {
  const strId = String(id)
  if (state.wy_liked_song_ids.has(strId)) return
  state.wy_liked_song_ids.add(strId)
  global.state_event.wyLikedListChanged()
}
export const removeWyLikedSong = (id: string | number) => {
  const strId = String(id)
  if (!state.wy_liked_song_ids.has(strId)) return
  state.wy_liked_song_ids.delete(strId)
  global.state_event.wyLikedListChanged()
}

export const setWySubscribedPlaylists = (playlists: SubscribedPlaylistInfo[]) => {
  state.wy_subscribed_playlists = playlists;
  global.state_event.wySubscribedPlaylistsChanged();
};

export const addWySubscribedPlaylist = (playlist: SubscribedPlaylistInfo) => {
  if (state.wy_subscribed_playlists.some(p => String(p.id) === String(playlist.id))) return;
  state.wy_subscribed_playlists = [playlist, ...state.wy_subscribed_playlists];
  global.state_event.wySubscribedPlaylistsChanged();
};

export const removeWySubscribedPlaylist = (id: string | number) => {
  const strId = String(id);
  const index = state.wy_subscribed_playlists.findIndex(p => String(p.id) === strId);
  if (index < 0) return;
  const newList = [...state.wy_subscribed_playlists];
  newList.splice(index, 1);
  state.wy_subscribed_playlists = newList;
  global.state_event.wySubscribedPlaylistsChanged();
};

export const updateWySubscribedPlaylist = (id: string | number, details: Partial<SubscribedPlaylistInfo>) => {
  const strId = String(id)
  const index = state.wy_subscribed_playlists.findIndex(p => String(p.id) === strId)
  if (index > -1) {
    const updatedPlaylist = { ...state.wy_subscribed_playlists[index], ...details }
    const newList = [...state.wy_subscribed_playlists]
    newList.splice(index, 1, updatedPlaylist)
    state.wy_subscribed_playlists = newList
    global.state_event.wySubscribedPlaylistsChanged()
  }
}
export const updateWySubscribedPlaylistTrackCount = (id: string | number, change: number) => {
  const strId = String(id);
  const index = state.wy_subscribed_playlists.findIndex(p => String(p.id) === strId);

  if (index > -1) {
    const updatedPlaylist = {
      ...state.wy_subscribed_playlists[index],
      trackCount: state.wy_subscribed_playlists[index].trackCount + change,
    };
    const newList = [...state.wy_subscribed_playlists];
    newList.splice(index, 1, updatedPlaylist);

    state.wy_subscribed_playlists = newList;
    global.state_event.wySubscribedPlaylistsChanged();
  }
};
