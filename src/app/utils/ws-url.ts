export function websocketUrl(s: string): string {
  const l = window.location;
  return ((l.protocol === 'https:') ? 'wss://' : 'ws://') + l.host + s;
}
