// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (PWA/device detection)
// Pure device hints so the input layer and tests do not depend on a browser. Modern iPadOS
// reports a Macintosh user agent, so touch points + coarse pointer are the reliable signals.

export function detectTouchCapability({
  maxTouchPoints = 0,
  hasTouchStart = false,
  coarsePointer = false,
  anyCoarsePointer = false,
  userAgent = '',
  platform = ''
} = {}) {
  const points = Math.max(0, Number(maxTouchPoints) || 0);
  const ua = String(userAgent || '');
  const plat = String(platform || '');
  const ipadOS = /Macintosh|MacIntel/i.test(`${ua} ${plat}`) && points > 1;
  const handheld = /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(ua);
  const coarse = coarsePointer === true || anyCoarsePointer === true;
  const touchSignal = points > 0 || hasTouchStart === true;
  return touchSignal && (handheld || ipadOS || coarse);
}

export function isStandaloneDisplay({
  standalone = false,
  displayModeStandalone = false
} = {}) {
  return standalone === true || displayModeStandalone === true;
}
