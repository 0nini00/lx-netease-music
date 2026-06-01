import { memo, useEffect } from 'react';
import { View } from 'react-native';
import InputItem, { type InputItemProps } from '../../components/InputItem';
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import { createStyle, toast } from '@/utils/tools';
import Button from '../../components/Button';
import CookieManager from '@react-native-cookies/cookies';
import wyApi from '@/utils/musicSdk/wy/user';
import { setWyUid, setWySubscribedPlaylists } from '@/store/user/action';



const syncCookieToNative = async (cookie: string) => {
  const domain = 'https://music.163.com';
  try {
    // 1. 关键步骤：清除该域名的所有原生Cookie，`true` 表示使用共享存储
    await CookieManager.clearAll(true);

    if (cookie) {
      // 2. 将新的Cookie字符串拆分并逐个设置回原生Cookie Jar
      // 这样可以确保原生层也使用最新的Cookie
      const cookiePairs = cookie.split(';').map(pair => pair.trim());
      for (const pair of cookiePairs) {
        const [name, ...valueParts] = pair.split('=');
        if (name && valueParts.length > 0) {
          await CookieManager.set(domain, {
            name: name.trim(),
            value: valueParts.join('=').trim(),
            domain: '.music.163.com',
            path: '/',
          });
        }
      }
    }
    console.log('Native cookie synchronized successfully.');
  } catch (error) {
    console.error('Failed to sync native cookie:', error);
    toast('Cookie 同步失败，部分请求可能异常', 'long');
  }
};

export default memo(() => {
  const t = useI18n();
  const cookie = useSettingValue('common.wy_cookie');
  const serpApiKey = useSettingValue('common.wy_serpapi_key');

  const refreshNeteaseProfile = async (cookie: string) => {
    if (!cookie.trim()) {
      setWyUid(null)
      setWySubscribedPlaylists([])
      return
    }
    try {
      const uid = await wyApi.getUid(cookie.trim())
      setWyUid(String(uid))
      const playlists = await wyApi.getUserPlaylists(uid, cookie.trim())
      setWySubscribedPlaylists(playlists)
      global.app_event.emit('wyPlaylistsRefresh')
      toast('网易云歌单已刷新')
    } catch (error: any) {
      setWyUid(null)
      setWySubscribedPlaylists([])
      toast(`网易云信息刷新失败: ${error.message}`, 'long')
    }
  }

  const setCookie = (val: string) => {
    // 先同步到原生层
    void syncCookieToNative(val).then(() => {
      // 再更新应用状态
      updateSetting({ 'common.wy_cookie': val });
      // Cookie 写入后立刻刷新 UID 和歌单，避免“填了 cookie 但歌单不出来”
      void refreshNeteaseProfile(val)
    });
  };

  const handleChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setCookie(text);
  };

  const handleSerpApiKeyChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    updateSetting({ 'common.wy_serpapi_key': text.trim() });
  };

  const handleShowLoginModal = () => {
    // 触发全局事件
    global.app_event.emit('showWebLogin');
  };

  useEffect(() => {
    const handleCookieSet = (cookie: string) => {
      setCookie(cookie);
    };

    global.app_event.on('wy-cookie-set', handleCookieSet);
    return () => {
      global.app_event.off('wy-cookie-set', handleCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={cookie}
        label={t('setting_basic_wy_cookie')}
        onChanged={handleChanged}
        placeholder={t('setting_basic_wy_cookie_placeholder')}
      />
      <InputItem
        value={serpApiKey}
        label="SerpApi API Key"
        onChanged={handleSerpApiKeyChanged}
        placeholder="用于网易云搜索补充 Google 搜索结果"
      />
      <View style={styles.btnContainer}>
        <Button onPress={handleShowLoginModal}>网页登录</Button>
      </View>
    </View>
  );
});

const styles = createStyle({
  content: {
    // marginTop: 10,
  },
  btnContainer: {
    marginBottom: 5,
    paddingLeft: 20,
    flexDirection: 'row',
  },
});
