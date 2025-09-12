/**
 * Used to skip `_` characther, if the message contains onde of this, telegram makes it a mistake, because it's a italic marker
 * @param {string} txt string raw
 * @returns {string} Sanitized string
 */
export function sanitizeTxt(txt: string): string {
  return txt.replace('_', '`_`')
}