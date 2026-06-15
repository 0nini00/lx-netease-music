let timerId: NodeJS.Timeout | null = null
let endTime = 0
let endOfTrackMode = false
let endOfTrackEndHandler: (() => void) | null = null

export function startSleepTimer(minutes: number, onTick?: (remaining: number) => void, onEnd?: () => void): void {
  stopSleepTimer()

  // Special case: -1 means "end of current track"
  if (minutes === -1) {
    endOfTrackMode = true
    endOfTrackEndHandler = onEnd ?? null
    return
  }

  endOfTrackMode = false
  endTime = Date.now() + minutes * 60 * 1000
  const tick = () => {
    const remaining = Math.max(0, endTime - Date.now())
    if (remaining <= 0) {
      stopSleepTimer()
      onEnd?.()
      return
    }
    onTick?.(remaining)
    timerId = setTimeout(tick, 1000)
  }
  tick()
}

export function stopSleepTimer(): void {
  if (timerId) {
    clearTimeout(timerId)
    timerId = null
  }
  endOfTrackEndHandler = null
  endTime = 0
  endOfTrackMode = false
}

export function shouldStopAfterCurrentTrack(): boolean {
  return endOfTrackMode
}

export function consumeStopAfterCurrentTrack(): (() => void) | null {
  if (!endOfTrackMode) return null
  const onEnd = endOfTrackEndHandler
  stopSleepTimer()
  return onEnd
}

export function getSleepTimerRemaining(): number {
  if (endOfTrackMode) return -1
  if (!endTime) return 0
  return Math.max(0, endTime - Date.now())
}

export function isSleepTimerRunning(): boolean {
  return (timerId !== null && endTime > 0) || endOfTrackMode
}
