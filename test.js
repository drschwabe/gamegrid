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

test('Can find the next open cell south', (t) => {
  t.plan(2)
  var grid = gg.createGrid(3,3)
  grid = gg.insertEnty(grid, 0)
  grid = gg.insertEnty(grid, 3)
  grid = gg.populateCells(grid)
  //Fill in column A with 2 values ie: 
  // [1,   0,   0  
  //  1,   0,   0  
  //  0,   0,   0]   <-- cell #6 is the first open cell down  
  var expectedResult = 6
  t.equals( gg.nextOpenCellSouth(grid), 6, "Correctly pinpointed next open cell down.")


  //Now again, but this time providing a start cell (2)
  var grid = gg.createGrid(3,3)
  grid = gg.insertEnty(grid, 0)
  grid = gg.insertEnty(grid, 3)  
  grid = gg.populateCells(grid)  
  var expectedResult = 6
  //Start at cell #2: 
  t.equals( gg.nextOpenCellSouth(grid, 3), 6, "Correctly pinpointed next open cell down.")  

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


test('Can expand a grid and enties remain in same place', (t) => {
  //(top-left diagonal expansion)
  t.plan(4)
  let smallGrid = gg.createGrid(2,2)

  var row = 1, 
      column = 1

  smallGrid = gg.insertEnty(smallGrid, {name: 'frog', cell : gg.xyToIndex(smallGrid, [row, column])})

  t.equals(3, _.findWhere(smallGrid.enties, { name: 'frog'}).cell)

  console.log('\n#### smallGrid ####')
  console.log(smallGrid)

  //2x2 grid structure with frog at cell [2,2] (cell 3): 
  // col0 col1  
  // [0,   1] <-- row0
  //  2, frog] <-- row1

  //Now if we increase the size of the grid, 
  //the xy can stay the same but the cell # needs to update.

  //4 x 4 grid structure with frog remaining at cell [2,2] (now cell 4): 
  // col0 col1 col2
  // [0,   1,   2   <-- row0
  //  3,  frog, 5   <-- row1
  //  6,   7,   8]   <-- row2

  let bigGrid = gg.expandGrid(smallGrid)

  console.log('-----------------')
  console.log('#### bigGrid ####')
  console.log(bigGrid)

  t.equals(4, _.findWhere(bigGrid.enties, { name: 'frog'}).cell, "Frog's cell is updated correctly")

  t.equals(gg.xyToIndex(bigGrid, [row, column]), _.findWhere(smallGrid.enties, { name: 'frog'}).cell, "Frog's cell is updated correctly (based on gg.xyToIndex)")

  t.ok(bigGrid.width == 3 && bigGrid.height == 3, 'Grid width and height are increased by 1')

  debugger
})

test('Finds the next occupied cell east', (t) => {
  t.plan(1)
  let grid = gg.createGrid(4,4)
  grid = gg.insertEnty(grid, { cell: 0, name: 'apple' })
  grid = gg.insertEnty(grid, { cell: 1, name: 'banana' })
  grid = gg.insertEnty(grid, { cell: 3, name: 'cherry' })

  t.equals( gg.nextOccupiedCellEast(grid, 1), 3, 'gg.nextOccupiedCellEast can find the next occupied cell east')
})

test('Returns the complete range of cell (numbers) in a given column', (t) => {
  t.plan(2)
  let grid = gg.createGrid(3,3) 
  // [0, 1, 2]
  // [3, 4, 5] <- we will ask for column cells based from cell 5
  // [6, 7, 8] <- and from [2,2] (cell 6)

  //Test providing cell #: 
  var columnCells = gg.columnCells(grid, 5)
  t.ok( _.isEqual( columnCells, [2, 5, 8]) )

  //From xy array: 
  var moreColumnCells = gg.columnCells(grid, [2,2])
  t.ok( _.isEqual( moreColumnCells, [2, 5, 8]) )  
})

test('Finds the next open column', (t) => {
  t.plan(1)
  let grid = gg.createGrid(3,3)
  // [0, 1, 2]
  // [3, 4, 5] <- we will ask for column cells based from cell 5
  // [6, 7, 8] <- and from [2,2] (cell 6)
  gg.nextOpenColumn
})

