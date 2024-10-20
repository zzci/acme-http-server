const domain = require(__hooks + '/models/domain.cjs')
const { logger } = require(__hooks + '/utils/index.cjs')

function handler(c) {
  const data = $apis.requestInfo(c).data

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
    if (domain.present(data, user)) {
      return c.json(200, { status: 200, msg: 'Success' })
    }
  } catch (e) {
    logger.error(e)
    return c.json(400, { status: 400, msg: 'Failed to present domain' })
  }
}

module.exports = handler
