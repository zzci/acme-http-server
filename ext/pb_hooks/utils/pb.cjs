function http(url, method, headers, body = '') {
  const res = $http.send({
    url: url,
    method: method,
    headers,
    timeout: 120,
    body: JSON.stringify(body),
  })
  return res
}

module.exports = {
  http,
}
