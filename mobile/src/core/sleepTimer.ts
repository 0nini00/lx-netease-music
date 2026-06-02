let timerId: NodeJS.Timeout | null = null
let endTime = 0

export function startSleepTimer(minutes: number, onTick?: (remaining: number) => void, onEnd?: () => void): void {
  stopSleepTimer()
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
  endTime = 0
}

export function getSleepTimerRemaining(): number {
  if (!endTime) return 0
  return Math.max(0, endTime - Date.now())
}

export function isSleepTimerRunning(): boolean {
  return timerId !== null && endTime > 0
}