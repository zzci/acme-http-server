const logger = require(__hooks + '/utils/console.cjs')
const Base64 = require(__hooks + '/utils/base64.cjs')
const pb = require(__hooks + '/utils/pb.cjs')

const error = (msg, e) => {
  throw new Error(logger.error(msg, e))
}

function getRemoteAddress(headers) {
  return headers.get('X-Forwarded-For') || headers.get('X-Real-IP') || headers.get('remoteAddr') || 'Unknown';
}

module.exports = {
  http: pb.http,
  sha256: $security.sha256,
  base64: Base64,
  logger,
  getRemoteAddress,
  dao: $app.dao,
  error,
}