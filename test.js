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

test('Can determine a linear cell # based on xy coordinates', (t) => {
  t.plan(1)
  var grid = gg.createGrid(3,3)
  t.equals( gg.xyToIndex(grid, 2, 2), 8, 'gg.xy pinpoints the correct linear cell number')
  // col0 col1 col2
  // [x,   x,   x   <-- row0
  //  x,   x,   x   <-- row1
  //  x,   x,   8]   <-- row2
})

test('Can find the next open cell', (t) => {
  t.plan(1)
  var grid = gg.createGrid(3,3) 
  grid = gg.insertEnty(grid, { name : 'apple', cell : 0 })
  grid = gg.insertEnty(grid, { name : 'pear', cell : 1 })
  grid = gg.insertEnty(grid, { name : 'apple', cell : 3 })
  grid = gg.populateCells(grid)
  t.equals( gg.nextOpenCell(grid), 2, 'found the next open cell')
})


test('Return accurate xy coordinates from a given index', (t) => {
  t.plan(9)
  var grid = gg.createGrid(3,3)

  console.log(gg.populateCells(grid))

  var cellZero = gg.indexToXy(grid, 0), //< should be 0, 0
      cellOne =  gg.indexToXy(grid, 1), //< 0, 1  
      cellTwo =  gg.indexToXy(grid, 2), //< 0, 1
      cellThree = gg.indexToXy(grid, 3) //< 1, 2
      cellFour = gg.indexToXy(grid, 4) //< 1, 2
      cellFive = gg.indexToXy(grid, 5) //< 1, 2
      cellSix = gg.indexToXy(grid, 6) //< 1, 2
      cellSeven = gg.indexToXy(grid, 7) //< 1, 2
      cellEight = gg.indexToXy(grid, 8) //< 1, 2

  var expect = [0,0]
  t.ok( _.isEqual(cellZero, expect), 'Index 0 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellZero)  

  expect = [0,1]
  t.ok( _.isEqual(cellOne, expect), 'Index 1 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellOne)  

  expect = [0,2]
  t.ok( _.isEqual(cellTwo, expect), 'Index 2 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellTwo)  

  expect = [1,0]
  t.ok( _.isEqual(cellThree, expect), 'Index 3 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellThree)  

  expect = [1,1]
  t.ok( _.isEqual(cellFour, expect),  'Index 4 ok' )
  console.log('Expect: ' + expect + ' actual: ' + cellFour)  

  expect = [1,2]
  t.ok( _.isEqual(cellFive, expect), 'Index 5 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellFive)    

  expect = [2,0]
  t.ok( _.isEqual(cellSix, expect), 'Index 6 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellFive)    

  expect = [2,1]
  t.ok( _.isEqual(cellSeven, expect), 'Index 7 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellFive)    

  expect = [2,2]
  t.ok( _.isEqual(cellEight, expect), 'Index 8 ok')
  console.log('Expect: ' + expect + ' actual: ' + cellFive)    


})
