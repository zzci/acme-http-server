const cloudflare = require(__hooks + '/providers/cloudflare.cjs')
const { logger, dao, error } = require(__hooks + '/utils/index.cjs')

const getdbFilter = dao().findFirstRecordByFilter
const getdbid = dao().findRecordById

function parseDomain(domain) {
  const isCname = !domain.startsWith('_acme-challenge')
  const mainDomain = isCname ? domain : domain.replace('_acme-challenge.', '')

  return { isCname, mainDomain }
}

function getDomain(domain, user, isCname = false) {
  try {
    const domainRecord = getdbFilter(
      'domains',
      'domain = {:domain} && user = {:user}',
      {
        domain,
        user: user.id,
      },
    )

    if (isCname != domainRecord.get('cname')) {
      error('Domain cname not match')
    }
    return domainRecord
  } catch (e) {
    error('Failed to get domain')
  }
}

function getAccess(id) {
  try {
    const accessRecord = getdbid('access', id)

    return accessRecord
  } catch (e) {
    error('Failed to get domain access', e)
  }
}

function prepare(data, user) {
  const { isCname, mainDomain } = parseDomain(data.fqdn)
  let domainRecord, accessRecord, parentDomainRecord, parentDomain
  try {
    domainRecord = getDomain(mainDomain, user, isCname)
  } catch (e) {
    error('Failed to get domain', e)
  }
  try {
    accessRecord = getAccess(domainRecord.get('access'))
  } catch (e) {
    error('Failed to get domain access', e)
  }

  try {
    parentDomain = domainRecord.get('subdomain')
      ? mainDomain.split('.').slice(-2).join('.')
      : mainDomain
    if (domainRecord.get('subdomain')) {
      parentDomainRecord = getDomain(parentDomain, user)
    }
  } catch (e) {
    logger.warn('Failed to get parent domain, no parent.')
  }
  return { domainRecord, parentDomainRecord, accessRecord, parentDomain }
}

function present(data, user) {
  const domainData = prepare(data, user)
  logger.debug(data.fqdn)
  if (domainData.accessRecord.get('type') == 'cloudflare') {
    return cloudflare.present({
      data,
      user,
      ...domainData,
    })
  }
}

function cleanup(data, user) {
  logger.debug(data.fqdn)
  const domainData = prepare(data, user)

  if (domainData.accessRecord.get('type') == 'cloudflare') {
    return cloudflare.cleanup({
      data,
      user,
      ...domainData,
    })
  }
}

module.exports = {
  present,
  cleanup,
}
