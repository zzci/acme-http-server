/// <reference path="../pb_data/types.d.ts" />

function present(c) {
  return require(__hooks + '/routes/present.cjs')(c)
}

function cleanup(c) {
  return require(__hooks + '/routes/cleanup.cjs')(c)
}

routerAdd('post', '/present', present)
routerAdd('post', '/cleanup', cleanup)
