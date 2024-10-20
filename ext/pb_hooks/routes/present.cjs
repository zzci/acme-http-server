const domain = require(__hooks + '/models/domain.cjs')
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

  try {
    if (domain.present(data, user, { requetsIp, tokenId })) {
      return c.json(200, { status: 200, msg: 'Success' })
    }
  } catch (e) {
    console.error(e.stack)
  }

  return c.json(400, { status: 400, msg: 'Failed to present domain' })
}

module.exports = handler
