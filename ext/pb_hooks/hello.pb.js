/// <reference path="../pb_data/types.d.ts" />

routerAdd('GET', '/hello', c => {
  console.log(JSON.stringify($apis.requestInfo(c)))
  return c.string(200, 'Hello world!')
})
