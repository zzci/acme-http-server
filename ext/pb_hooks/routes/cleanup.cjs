const domain = require(__hooks + '/models/domain.cjs')
const { logger } = require(__hooks + '/utils/index.cjs')
const { getRemoteAddress } = require(__hooks + '/utils/index.cjs')

function handler(c) {
  const data = $apis.requestInfo(c).data
  const requetsIp = getRemoteAddress(c.request().header)
  const tokenId = c.get('tokenId')
  const user = c.get('authRecord')

  if (!user) {
    return c.json(401, { status: 401, msg: 'Unauthorized' })
  }

  if (!data.fqdn || !data.value) {
    return c.json(400, { status: 400, msg: 'fqdn and value are required' })
  }

  if (data.fqdn.endsWith('.')) {
    data.fqdn = data.fqdn.slice(0, -1)
  }

  try {
    if (domain.cleanup(data, user, { requetsIp, tokenId })) {
      return c.json(200, { status: 200, msg: 'Success' })
    }
  } catch (e) {
    logger.error(e)
  }

  return c.json(400, { status: 400, msg: 'Failed to cleanup domain' })
}

module.exports = handler
