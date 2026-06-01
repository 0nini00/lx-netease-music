import { memo, useState, useCallback, useMemo, useEffect } from 'react'

import { View } from 'react-native'

import Section from '../../components/Section'

import SubTitle from '../../components/SubTitle'

import InputItem from '../../components/InputItem'

import Button from '../../components/Button'

import CheckBoxItem from '../../components/CheckBoxItem'

import History from './History'

import { useI18n } from '@/lang'

import { useSettingValue } from '@/store/setting/hook'

import { updateSetting } from '@/core/common'

import { createStyle, toast } from '@/utils/tools'

import { dateFormat } from '@/utils/common'

import { useTheme } from '@/store/theme/hook'

import Text from '@/components/common/Text'

import { getSyncHost } from '@/utils/data'

import { testConnection, resetClient } from '@/utils/webdav'

import {

  manualUploadLists,

  manualDownloadLists,

  manualUploadMusicSources,

  manualDownloadMusicSources,

} from '@/core/sync/webdavSync'

import IsEnable from '@/screens/Home/Views/Setting/settings/Sync/IsEnable.tsx'



export default memo(() => {

  const t = useI18n()

  const theme = useTheme()

  const isEnableWebdav = useSettingValue('sync.webdav.enable')

  const webdavUrl = useSettingValue('sync.webdav.url')

  const webdavUsername = useSettingValue('sync.webdav.username')

  const webdavPassword = useSettingValue('sync.webdav.password')

  const webdavPath = useSettingValue('sync.webdav.path')

  const lastSyncTimeLists = useSettingValue('sync.webdav.lastSyncTimeLists')



  const [isTesting, setIsTesting] = useState(false)

  const [isUploadingLists, setIsUploadingLists] = useState(false)

  const [isDownloadingLists, setIsDownloadingLists] = useState(false)

  const [isUploadingSources, setIsUploadingSources] = useState(false)

  const [isDownloadingSources, setIsDownloadingSources] = useState(false)

  const [host, setHost] = useState('')



  useEffect(() => {

    void getSyncHost().then(setHost)

  }, [])



  const lastSyncTimeListsStr = useMemo(() => {

    return lastSyncTimeLists ? dateFormat(lastSyncTimeLists, 'Y-M-D h:m:s') : '从未'

  }, [lastSyncTimeLists])



  const handleEnableWebDAV = (enable: boolean) => {

    updateSetting({ 'sync.webdav.enable': enable })

    resetClient()

  }



  const handleTestConnection = useCallback(async() => {

    if (isTesting) return

    setIsTesting(true)

    toast('正在测试连接...')

    try {

      await testConnection()

      toast('连接成功！')

    } catch (error: any) {

      toast(`连接失败: ${error.message}`, 'long')

    } finally {

      setIsTesting(false)

    }

  }, [isTesting])



  const handleUploadLists = useCallback(async() => {

    if (isUploadingLists) return

    setIsUploadingLists(true)

    await manualUploadLists()

    setIsUploadingLists(false)

  }, [isUploadingLists])



  const handleDownloadLists = useCallback(async() => {

    if (isDownloadingLists) return

    setIsDownloadingLists(true)

    await manualDownloadLists()

    setIsDownloadingLists(false)

  }, [isDownloadingLists])



  const handleUploadSources = useCallback(async() => {

    if (isUploadingSources) return

    setIsUploadingSources(true)

    await manualUploadMusicSources()

    setIsUploadingSources(false)

  }, [isUploadingSources])



  const handleDownloadSources = useCallback(async() => {

    if (isDownloadingSources) return

    setIsDownloadingSources(true)

    await manualDownloadMusicSources()

    setIsDownloadingSources(false)

  }, [isDownloadingSources])



  const handleWebdavSettingChanged = (key: keyof LX.AppSetting) => (text: string, callback: (value: string) => void) => {

    updateSetting({ [key]: text })

    resetClient()

    callback(text)

  }



  return (

    <Section title={t('setting_sync')}>

      <SubTitle title="WebDAV 同步">

        <CheckBoxItem

          check={isEnableWebdav}

          label="启用 WebDAV 同步"

          onChange={handleEnableWebDAV}

        />



        <View style={{ opacity: isEnableWebdav ? 1 : 0.5 }}>

          <InputItem

            label="服务器地址"

            value={webdavUrl}

            onChanged={handleWebdavSettingChanged('sync.webdav.url')}

            placeholder="https://example.com/webdav"

            editable={isEnableWebdav}

          />

          <InputItem

            label="用户名"

            value={webdavUsername}

            onChanged={handleWebdavSettingChanged('sync.webdav.username')}

            placeholder="请输入用户名"

            editable={isEnableWebdav}

          />

          <InputItem

            label="密码"

            value={webdavPassword}

            onChanged={handleWebdavSettingChanged('sync.webdav.password')}

            placeholder="请输入密码"

            secureTextEntry

            editable={isEnableWebdav}

          />

          <InputItem

            label="同步路径"

            value={webdavPath}

            onChanged={handleWebdavSettingChanged('sync.webdav.path')}

            placeholder="例如: /LX_Music/"

            editable={isEnableWebdav}

          />



          <View style={styles.btnRow}>

            <Button onPress={handleTestConnection} disabled={!isEnableWebdav || isTesting}>

              {isTesting ? '测试中...' : '测试连接'}

            </Button>

          </View>



          <View style={styles.btnRow}>

            <Button onPress={handleUploadSources} disabled={!isEnableWebdav || isUploadingSources}>

              {isUploadingSources ? '上传中...' : '上传音源'}

            </Button>

            <Button onPress={handleDownloadSources} disabled={!isEnableWebdav || isDownloadingSources}>

              {isDownloadingSources ? '下载中...' : '下载音源'}

            </Button>

          </View>



          <View style={styles.btnRow}>

            <Button onPress={handleUploadLists} disabled={!isEnableWebdav || isUploadingLists}>

              {isUploadingLists ? '上传中...' : '上传歌单'}

            </Button>

            <Button onPress={handleDownloadLists} disabled={!isEnableWebdav || isDownloadingLists}>

              {isDownloadingLists ? '下载中...' : '下载歌单'}

            </Button>

          </View>



          <Text style={styles.lastSyncText} size={12} color={theme['c-font-label']}>

            上次歌单自动同步时间: {lastSyncTimeListsStr}

          </Text>

        </View>

      </SubTitle>



      <IsEnable host={host} setHost={setHost} />

      <History setHost={setHost} />

    </Section>

  )

})



const styles = createStyle({

  btnRow: {

    flexDirection: 'row',

    paddingLeft: 25,

    marginTop: 5,

    marginBottom: 10,

    gap: 8,

  },

  lastSyncText: {

    paddingLeft: 25,

    marginTop: 5,

  },

})



