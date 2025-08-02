/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

export default function (name: string): string {
  return name.replace(/[/\\?%*:|"<>\t\r\n]/g, '_')
}
