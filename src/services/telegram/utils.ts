import { cfg } from "@/infra"

/**
 * Used to skip `_` characther, if the message contains onde of this, telegram makes it a mistake, because it's a italic marker
 * @param {string} txt string raw
 * @returns {string} Sanitized string
 */
export function sanitizeTxt(initialValue: string): string {
  const skippedChars = cfg.SKIPPED_CHARS.split('')
  const str = skippedChars.reduce((acc: string, char: string): string => {
    const escapedChar = escapeRegExp(char)
    const replace = `\`${char}\``

    return acc.replace(new RegExp(escapedChar, 'g'), replace)
  }, initialValue)

  console.log({ str })
  return str
}

function escapeRegExp(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}