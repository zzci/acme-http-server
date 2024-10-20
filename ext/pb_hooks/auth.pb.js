/// <reference path="../pb_data/types.d.ts" />

function apiAuth(next) {
  const authWithToken = require(__hooks + '/models/auth.cjs')
  const { logger, base64 } = require(__hooks + '/utils/index.cjs')

  return c => {
    const auth = c.request().header.get('Authorization')
    if (auth) {
      /**
       * 3-18 是token_id
       * 19- 是token
       * collection: expiry_at, token, user_id
       *
       * echo -n 'IMTOKEN' | sha256sum
       * d443b10b8a354cad4581627f7de1506d52ee5b631a02086d23c357974f3ac8af
       * 保存在数据库中作为token，拿到token id, glr36ulv3ktwqh4
       * 合并请求token信息
       * demo key: sk_glr36ulv3ktwqh4IMTOKEN
       */
      let authToken
      let needAuth = false
      const token = auth.split(' ')[1]
      if (auth.startsWith('Basic')) {
        needAuth = true
        try {
          const authInfo = base64.decode(token).split(':')
          authToken = authInfo[1]
          needAuth = authInfo[0]
        } catch (e) {
          logger.error('Get auth info failed')
        }
      }
      if (auth.startsWith('Bearer') && token.startsWith('sk_')) {
        needAuth = true
        authToken = token
      }
      if (needAuth) {
        try {
          const authRecord = authWithToken(authToken)
          c.set('authRecord', authRecord)
          try {
            return next(c)
          } catch (e) {
            console.log(e.stack)
            return c.json(500, { status: 500, msg: 'Internal Server Error' })
          }
        } catch (e) {
          logger.error('Auth failed')
        }

        return c.json(401, { status: 401, msg: 'Unauthorized' })
      }
    }
    return next(c)
  }
}

routerUse(apiAuth)
