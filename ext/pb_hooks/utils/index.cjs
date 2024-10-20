const logger = require(__hooks + '/utils/console.cjs')
const Base64 = require(__hooks + '/utils/base64.cjs')
const pb = require(__hooks + '/utils/pb.cjs')

const error = (msg, e) => {
  throw new Error(logger.error(msg, e))
}

module.exports = {
  http: pb.http,
  sha256: $security.sha256,
  base64: Base64,
  logger,
  dao: $app.dao,
  error,
}
