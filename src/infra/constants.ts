import * as pkg from '../../package.json';

export const packageInfo = Object.freeze({
  version: pkg.version,
  name: pkg.name
})

console.log({ packageInfo })
