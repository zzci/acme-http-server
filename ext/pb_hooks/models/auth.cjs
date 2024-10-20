const { logger, dao, sha256, error } = require(__hooks + '/utils/index.cjs')

function authWithToken(token) {
  if (!token.startsWith('sk_')) error('Token fromat error')

  const token_id = token.substring(3, 18)
  const token_plain = token.substring(18)
  logger.debug('token_enc:', sha256(token_plain), token_plain, token_id)

  let record
  try {
    record = dao().findRecordById('tokens', token_id)
  } catch (e) {
    error('Token not found', e)
  }

  if (sha256(token_plain) !== record.get('token')) {
    error('Token not match')
  }

  if (record.get('expiry_at') < new DateTime()) {
    error('Token expiried')
  }

  const userId = record.get('user_id')
  try {
    return dao().findRecordById('users', userId)
  } catch (e) {
    error('User not found', e)
  }
}

module.exports = authWithToken