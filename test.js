var gg = require('./gg.js'), 
    test = require('tape'), 
    _ = require('underscore')

test('Grid is created', (t) => {
  t.plan(4)
  console.log('gg.createGrid(3,3)')
  var grid = gg.createGrid(3,3)
  t.equals(grid.width, 3, 'grid.width is 3')
  t.equals(grid.height, 3, 'grid.height is 3')
  t.ok(_.isArray(grid.enties), 'grid.enties is an array')
  t.equals(grid._id, 'grid_0', 'grid._id is grid_0')
})
