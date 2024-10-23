const { logger, http, error } = require(__hooks + '/utils/index.cjs')
const cloudflareBaseUrl = 'https://api.cloudflare.com/client/v4'

function getZones(accessKey) {
  try {
    const headers = {
      Authorization: `Bearer ${accessKey}`,
      'Content-Type': 'application/json',
    }

    const response = http(cloudflareBaseUrl + '/zones', 'GET', headers)
    const result = response.json

    if (result.success) {
      return result.result.map(zone => ({ id: zone.id, name: zone.name }))
    } else {
      error('Error fetching zones:', result)
    }
  } catch (e) {
    error('Error fetching zones:', e)
  }
}

function setTxtRecord(name, content, zoneId, accessKey) {
  logger.debug(name, content, zoneId)
  try {
    const headers = {
      Authorization: `Bearer ${accessKey}`,
      'Content-Type': 'application/json',
    }

    const body = {
      name: name,
      ttl: 60,
      content: `"${content}"`,
      type: 'TXT',
    }

    const url = `${cloudflareBaseUrl}/zones/${zoneId}/dns_records`

    logger.debug('Setting txt record:', url)

    const response = http(url, 'POST', headers, body)

    const result = response.json

    if (
      result.success ||
      (result.errors && result.errors.some(error => error.code === 81058))
    ) {
      return true
    } else {
      return result.errors
    }
  } catch (e) {
    return e.stack
  }
}

function delRecord(name, zoneId, accessKey) {
  try {
    const headers = {
      Authorization: `Bearer ${accessKey}`,
      'Content-Type': 'application/json',
    }

    const url = `${cloudflareBaseUrl}/zones/${zoneId}/dns_records`

    const listResponse = http(url, 'GET', headers)
    const listResult = listResponse.json

    if (!listResult.success) {
      error('Fetching DNS records error:', listResult)
    }

    const records = listResult.result.filter(record => record.name === name)

    if (records.length === 0) {
      return true
    }

    for (const record of records) {
      const recordId = record.id

      logger.debug('Setting txt record:', `${url}/${recordId}`)

      const deleteResponse = http(`${url}/${recordId}`, 'DELETE', headers)
      const deleteResult = deleteResponse.json

      if (!deleteResult.success) {
        logger.warn('Deleting DNS record error:', recordId)
      }
    }
    return true
  } catch (error) {
    return error.stack
  }
}

function getZoneid(name, accessKey) {
  try {
    const zones = getZones(accessKey)
    zoneId = zones.find(zone => zone.name === name)?.id

    logger.debug('ZoneId:', zoneId, 'for domain:', name)
    return zoneId
  } catch (e) {
    error('Failed to get domain zoneid', e)
  }
}

function prepare(domainData) {
  const { data, domainRecord, parentDomainRecord, accessRecord, parentDomain } =
    domainData

  let zoneId = domainRecord.get('zoneid')
  const accessKey = JSON.parse(accessRecord.get('payload')).accessKey

  if (!zoneId) {
    if (parentDomainRecord) {
      try {
        if (parentDomainRecord.access == domainRecord.access) {
          zoneId = parentDomainRecord.get('zoneid')
          if (!zoneId) {
            zoneId = getZoneid(parentDomainRecord.domain, accessKey)

            if (!zoneId) error('Failed to get domain zoneId by main domain')

            parentDomainRecord.set('zoneid', zoneId)
            $app.dao().saveRecord(parentDomainRecord)
          }
          domainRecord.set('zoneid', zoneId)
          $app.dao().saveRecord(domainRecord)

          return zoneId
        }
      } catch (e) {
        logger.error(e)
      }
    }
    logger.debug('Getting zoneId by domain:', parentDomain)
    zoneId = getZoneid(parentDomain, accessKey)
    if (!zoneId)
      if (!zoneId) error('Failed to get domain zoneId by domain access')

    domainRecord.set('zoneid', zoneId)
    $app.dao().saveRecord(domainRecord)
  }

  return { data, zoneId, accessKey }
}

function present(domainData) {
  const { data, zoneId, accessKey } = prepare(domainData)
  logger.log('Presenting domain:')
  try {
    return setTxtRecord(data.fqdn, data.value, zoneId, accessKey)
  } catch (e) {
    error('Cloudflare: Failed to set txt record', e)
  }
}

function cleanup(domainData) {
  const { data, zoneId, accessKey } = prepare(domainData)

  try {
    return delRecord(data.fqdn, zoneId, accessKey)
  } catch (e) {
    logger.error('Cloudflare: Failed to delete record', e)
  }

  return true
}

module.exports = {
  cleanup,
  present,
}
