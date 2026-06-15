import { useState, useEffect, useCallback } from 'react'
import { View, TouchableOpacity, Modal } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { startSleepTimer, stopSleepTimer, isSleepTimerRunning, getSleepTimerRemaining } from '@/core/sleepTimer'
import { scaleSizeW } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'

const TIMER_OPTIONS = [15, 30, 45, 60, 90, 120]
const END_OF_TRACK = -1

interface Props {
  onTimerEnd: () => void
}

export default ({ onTimerEnd }: Props) => {
  const theme = useTheme()
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [selectedMinutes, setSelectedMinutes] = useState(30)

  useEffect(() => {
    const checkTick = setInterval(() => {
      if (isSleepTimerRunning()) {
        const r = getSleepTimerRemaining()
        setRemaining(r)
        // r === -1 means "end of track" mode
        if (r === 0) {
          onTimerEnd()
          setRunning(false)
          setVisible(false)
          toast(t('sleep_timer_ended'))
        }
      } else if (running) {
        // Timer stopped externally
        setRunning(false)
        setRemaining(0)
      }
    }, 1000)
    return () => clearInterval(checkTick)
  }, [onTimerEnd, t, running])

  const handleStart = useCallback((minutes: number) => {
    setSelectedMinutes(minutes)
    if (minutes === END_OF_TRACK) {
      startSleepTimer(
        -1,
        undefined,
        () => {
          onTimerEnd()
          setRunning(false)
          toast(t('sleep_timer_ended'))
        }
      )
      setRunning(true)
      setRemaining(-1)
      setVisible(false)
      toast(t('sleep_timer_after_track'))
      return
    }
    startSleepTimer(
      minutes,
      undefined,
      () => {
        onTimerEnd()
        setRunning(false)
        toast(t('sleep_timer_ended'))
      }
    )
    setRunning(true)
    setRemaining(minutes * 60 * 1000)
    setVisible(false)
    toast(t('sleep_timer_started') + ': ' + minutes + t('minute'))
  }, [onTimerEnd, t])

  const handleStop = useCallback(() => {
    stopSleepTimer()
    setRunning(false)
    setRemaining(0)
    toast(t('sleep_timer_stopped'))
  }, [])

  const formatTime = (ms: number) => {
    if (ms === -1) return '♪'
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <TouchableOpacity onPress={() => { running ? handleStop() : setVisible(true) }} style={styles.btn}>
        <Icon name="alarm-off" color={running ? theme['c-font-label'] : theme['c-font']} size={18} />
        {running ? (
          <Text style={styles.timerText} size={10} color={theme['c-font-label']}>{formatTime(remaining)}</Text>
        ) : null}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme['c-content-background'] }]}>
            <Text size={16} style={{ fontWeight: 'bold', marginBottom: 14, textAlign: 'center' }}>{t('sleep_timer')}</Text>
            {TIMER_OPTIONS.map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[styles.option, { borderBottomColor: 'rgba(128,128,128,0.15)' }]}
                onPress={() => handleStart(mins)}
              >
                <Text size={15}>{mins} {t('minute')}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.option, { borderBottomColor: 'rgba(128,128,128,0.15)' }]}
              onPress={() => handleStart(END_OF_TRACK)}
            >
              <Text size={15}>{t('sleep_timer_after_track')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, { borderBottomColor: 'rgba(128,128,128,0.15)' }]}
              onPress={() => { setVisible(false); handleStop() }}
            >
              <Text size={15} color={theme['c-font-label']}>{t('sleep_timer_stop')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const styles = createStyle({
  btn: { paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center' },
  timerText: { marginTop: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: scaleSizeW(250), borderRadius: 12, padding: 20 },
  option: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1 },
})