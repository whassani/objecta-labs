// Debug logger that persists logs to localStorage
const DEBUG_KEY = 'debug-logs'

export function debugLog(message: string) {
  console.log(message)
  
  try {
    const logs = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]')
    logs.push({
      time: new Date().toISOString(),
      message
    })
    // Keep only last 50 logs
    if (logs.length > 50) logs.shift()
    localStorage.setItem(DEBUG_KEY, JSON.stringify(logs))
  } catch (e) {
    console.error('Failed to save debug log:', e)
  }
}

export function getDebugLogs() {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]')
  } catch (e) {
    return []
  }
}

export function clearDebugLogs() {
  localStorage.removeItem(DEBUG_KEY)
}
