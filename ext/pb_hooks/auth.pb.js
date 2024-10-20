/// <reference path="../pb_data/types.d.ts" />

function apiAuth(next) {
  const { logger, base64, dao, sha256, error } = require(__hooks + '/utils/index.cjs')

  return c => {
    const auth = c.request().header.get('Authorization')
    if (auth) {
      if (auth.startsWith('Basic')) {
        try {
          const token = auth.split(' ')[1]
          const [username, password] = base64.decode(token).split(':')
          let user
          try {
            user = dao().findAuthRecordByUsername('users', username)
          } catch (e) {
            error('Basic: auth user not found')
          }

          if (user.validatePassword(password)) {
            c.set('authRecord', user)
            try {
              return next(c)
            } catch (e) {
              console.log(e.stack)
              return c.json(500, { status: 500, msg: 'Internal Server Error' })
            }
          }
        } catch (e) {
          logger.error('Basic: auth failed')
        }

        return c.json(401, { status: 401, msg: 'Unauthorized' })
      }
      /**
       * 3-18 是token_id
       * 19- 是token
       * collection: expiry_at, token, user_id
       * demo key: sk_7kkqtwmdqub2edbaaaa
       */
      if (auth.startsWith('Bearer')) {
        const token = auth.split(' ')[1]
        if (token.startsWith('sk_')) {
          try {
            const token_id = token.substring(3, 18)
            const token_plain = token.substring(19)
            logger.log('token_enc:', sha256(token_plain))

            let record
            try {
              record = dao().findRecordById('tokens', token_id)
            } catch (e) {
              error('Bearer: auth token not found', e)
            }

            if (sha256(token_plain) !== record.get('token')) {
              error('Bearer: auth token not match')
            }

            if (record.get('expiry_at') < new DateTime()) {
              error('Bearer: auth token expiried')
            }

            const userId = record.get('user_id')
            try {
              const authRecord = dao().findRecordById('users', userId)
              c.set('authRecord', authRecord)

              try {
                return next(c)
              } catch (e) {
                console.log(e.stack)
                return c.json(500, { status: 500, msg: 'Internal Server Error' })
              }
            } catch (e) {
              error('Bearer: auth user not found', e)
            }
          } catch (e) {
            logger.error('Bearer: auth failed')
          }

          return c.json(401, { status: 401, msg: 'Unauthorized' })
        }
      }
    }
    return next(c)
  }
}

routerUse(apiAuth)
