var gg = require('./gg.js'), 
    test = require('tape'), 
    _ = require('underscore')

test('Grid is created', (t) => {
  t.plan(4)
  var grid = gg.createGrid(3,3)
  t.equals(grid.width, 3, 'grid.width is 3')
  t.equals(grid.height, 3, 'grid.height is 3')
  t.ok(_.isArray(grid.enties), 'grid.enties is an array')
  t.equals(grid._id, 'grid_0', 'grid._id is grid_0')
})

test('Can insert an enty', (t) => {
  t.plan(3)
  var grid = gg.createGrid(3,3)
  gg.insertEnty(grid, {
    name : 'mushroom', 
    cell : 3
  })
  t.equals(grid.enties[0].name, 'mushroom', "enty's name is correct")
  t.equals(grid.enties[0].cell, 3, "enty was inserted into the correct cell")
  t.ok(_.isString(grid.enties[0]._id), "enty has an _id string" )
})
