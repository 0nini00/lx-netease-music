import { useEffect, useState } from 'react'
import state from './state'

export const useWyUid = () => {
  const [uid, setUid] = useState(() => state.wy_uid)
  useEffect(() => {
    const handleUpdate = () => setUid(state.wy_uid)
    global.state_event.on('wyUidChanged', handleUpdate)
    handleUpdate()
    return () => {
      global.state_event.off('wyUidChanged', handleUpdate)
    }
  }, [])
  return uid
}

export const useIsWyLiked = (songId: string | number) => {
  const strId = String(songId)
  const [isLiked, setIsLiked] = useState(() => state.wy_liked_song_ids.has(strId))

  useEffect(() => {
    const handleUpdate = () => {
      const newLikedStatus = state.wy_liked_song_ids.has(strId)
      setIsLiked(currentStatus => currentStatus === newLikedStatus ? currentStatus : newLikedStatus)
    }
    global.state_event.on('wyLikedListChanged', handleUpdate)
    handleUpdate()
    return () => {
      global.state_event.off('wyLikedListChanged', handleUpdate)
    }
  }, [strId]) // 依赖项数组保持不变，仅当 songId 变化时才重新设置 effect

  return isLiked
}

export const useIsWyPlaylistSubscribed = (playlistId: string | number | undefined) => {
  const strId = String(playlistId);
  const [isSubscribed, setIsSubscribed] = useState(() =>
    playlistId === undefined || playlistId === null ? false : state.wy_subscribed_playlists.some(p => String(p.id) === strId),
  );

  useEffect(() => {
    if (playlistId === undefined || playlistId === null) {
      setIsSubscribed(false);
      return;
    }
    const handleUpdate = () => {
      const newSubscribedStatus = state.wy_subscribed_playlists.some(p => String(p.id) === strId);
      setIsSubscribed(newSubscribedStatus);
    };
    global.state_event.on('wySubscribedPlaylistsChanged', handleUpdate);
    handleUpdate();
    return () => {
      global.state_event.off('wySubscribedPlaylistsChanged', handleUpdate);
    };
  }, [strId, playlistId]);

  return isSubscribed;
};

export const useWySubscribedPlaylists = () => {
  const [list, setList] = useState(() => state.wy_subscribed_playlists);
  useEffect(() => {
    const handleUpdate = () => {
      setList([...state.wy_subscribed_playlists]);
    };
    global.state_event.on('wySubscribedPlaylistsChanged', handleUpdate);
    handleUpdate();
    return () => {
      global.state_event.off('wySubscribedPlaylistsChanged', handleUpdate);
    };
  }, []);
  return list;
};
