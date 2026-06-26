import { systemPreferences } from 'electron'

export function isAccessibilityGranted(): boolean {
  if (process.platform !== 'darwin') return true
  try {
    return systemPreferences.isTrustedAccessibilityClient(false)
  } catch {
    return true
  }
}

export function promptAccessibility(): boolean {
  if (process.platform !== 'darwin') return true
  try {
    return systemPreferences.isTrustedAccessibilityClient(true)
  } catch {
    return false
  }
}
