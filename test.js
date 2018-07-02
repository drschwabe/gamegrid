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
  // [apple,   pear,   2,  <-- row0
  //  banana,   4,   5   <-- row1
  //  6,   7,   8]   <-- row2  
  grid = gg.insertEnty(grid, { name : 'apple', cell : 0 })
  grid = gg.insertEnty(grid, { name : 'pear', cell : 1 })
  grid = gg.insertEnty(grid, { name : 'banana', cell : 3 })
  grid = gg.populateCells(grid)
  debugger
  t.equals( gg.nextOpenCell(grid), 2, 'found the next open cell')
})

test('Can find next cell south', (t) => {
  t.plan(2)
  var grid = gg.createGrid(2,2)
  console.log(`
    0 1 
    2 3
  `)
  var nextCellSouth = gg.nextCellSouth(grid, 0)
  t.equals(nextCellSouth, 2, '(2x2 grid) the next cell south of 0 is 2')

  var gridX4 = gg.createGrid(4,4)
  console.log(`
    0 1 2 3 
    4 5 6 7
  `)  
  var nextCellSouth = gg.nextCellSouth(gridX4, 3)
  t.equals(nextCellSouth, 7, '(4x4 grid) the next cell south of the fourth cell (3) is cell 7 (8th cell)')
})

test('Can find the next open cell south', (t) => {
  t.plan(2)
  var grid = gg.createGrid(3,3)
  grid = gg.insertEnty(grid, 0)
  grid = gg.insertEnty(grid, 3)
  grid = gg.populateCells(grid)
  //Fill in column A with 2 values ie: 
  // [x,   0,   0  
  //  x,   0,   0  
  //  0,   0,   0]   <-- cell #6 is the first open cell down  
  var expectedResult = 6
  t.equals( gg.nextOpenCellSouth(grid), 6, "Correctly pinpointed next open cell down.")


  //Now again, but this time providing a start cell (2)
  var grid = gg.createGrid(3,3)
  grid = gg.insertEnty(grid, 0)
  grid = gg.insertEnty(grid, 3)  
  grid = gg.populateCells(grid)  
  var expectedResult = 4
  //Start at cell #2: 
  t.equals( gg.nextOpenCellSouth(grid, 1), 4, "Correctly pinpointed next open cell down.")  

})


test('Return accurate xy coordinates from a given index', (t) => {
  t.plan(10)
  var grid = gg.createGrid(3,3)

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

  expect = [0,1]
  t.ok( _.isEqual(cellOne, expect), 'Index 1 ok')

  expect = [0,2]
  t.ok( _.isEqual(cellTwo, expect), 'Index 2 ok')

  expect = [1,0]
  t.ok( _.isEqual(cellThree, expect), 'Index 3 ok')

  expect = [1,1]
  t.ok( _.isEqual(cellFour, expect),  'Index 4 ok' )

  expect = [1,2]
  t.ok( _.isEqual(cellFive, expect), 'Index 5 ok')

  expect = [2,0]
  t.ok( _.isEqual(cellSix, expect), 'Index 6 ok')

  expect = [2,1]
  t.ok( _.isEqual(cellSeven, expect), 'Index 7 ok')

  expect = [2,2]
  t.ok( _.isEqual(cellEight, expect), 'Index 8 ok')

  //Try on a bigger grid, using odd numbers: 

  var grid2 = gg.createGrid(5,5)

  //[ 0  1   2   3   4  ]
  //[ 5  -   -   -   -  ]
  //[ 10  -   -   -   -  ]
  //[ 15  16  -   -   -  ]
  //[ 20  -   -   -   24  ]

  //[ 0  1   2   3   4  ]
  //[ 1  -   -   -   -  ]
  //[ 2  -   -   -   -  ]
  //[ 3  1  -   -   -   ]
  //[ 4  -   -   -   4  ]  

  //Cell 16 should be at 3, 1

  expect = [3,1]

  console.log('cell 16 is at: ' + gg.indexToXy(grid2, 16) )

  t.ok( _.isEqual( gg.indexToXy(grid2, 16)  , expect), 'Index 16 on 5x5 ok')

})


test('Can expand a grid and enties remain in same place', (t) => {
  //(top-left diagonal expansion)
  t.plan(4)
  let smallGrid = gg.createGrid(2,2)

  var row = 1, 
      column = 1

  smallGrid = gg.insertEnty(smallGrid, {name: 'frog', cell : gg.xyToIndex(smallGrid, [row, column])})

  t.equals(3, _.findWhere(smallGrid.enties, { name: 'frog'}).cell)

  // console.log('\n#### smallGrid ####')
  // console.log(smallGrid)

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

  // console.log('-----------------')
  // console.log('#### bigGrid ####')
  // console.log(bigGrid)

  t.equals(4, _.findWhere(bigGrid.enties, { name: 'frog'}).cell, "Frog's cell is updated correctly")

  t.equals(gg.xyToIndex(bigGrid, [row, column]), _.findWhere(smallGrid.enties, { name: 'frog'}).cell, "Frog's cell is updated correctly (based on gg.xyToIndex)")

  t.ok(bigGrid.width == 3 && bigGrid.height == 3, 'Grid width and height are increased by 1')

})

test('Finds the next occupied cell east', (t) => {
  t.plan(1)
  let grid = gg.createGrid(4,4)
  grid = gg.insertEnty(grid, { cell: 0, name: 'apple' })
  grid = gg.insertEnty(grid, { cell: 1, name: 'banana' })
  grid = gg.insertEnty(grid, { cell: 3, name: 'cherry' })
  /*
    [ apple bannana  2  cherry ]
    [ 4       5      6     7   ]
    [ 8       9      10   11  ]
  */
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
  let grid = gg.createGrid(4,4)
  grid = gg.insertEnty(grid, 5)
  grid = gg.insertEnty(grid, 10) 
  grid = gg.populateCells(grid)
  //grid = gg.insertEnty(grid, 5)  
  // [0, 1,  2, 3]
  // [4, x,  6, 7]
  // [8, 9, x, 11]
  t.equals( gg.nextOpenColumn(grid, 1), 3)  
})

test('Returns null if there is no next available column', (t) => {
  t.plan(1)
  let grid = gg.createGrid(4,4)
  grid = gg.insertEnty(grid, 5)
  grid = gg.insertEnty(grid, 10) 
  grid = gg.populateCells(grid)
  //grid = gg.insertEnty(grid, 5)  
  // [0, 1,  2, 3]
  // [4, x,  6, 7]
  // [8, 9, x, 11]
  t.equals( gg.nextOpenColumn(grid, 1), 3)  
})

test('Determines the number of open cells east', (t) => {
  t.plan(1)
  let grid = gg.createGrid(4, 4)

  grid = gg.insertEnty(grid, 0)
  grid = gg.insertEnty(grid, 1)  
  grid = gg.populateCells(grid)
  grid = gg.xyCells(grid)

  //This is what our first row looks like: 
  // [ 0  1  2  3  ]  or  [ x x o o ]
  //(there should be two open cells)
  var openCellsEast = gg.openCellsEast(grid, 0)
  t.equals(openCellsEast, 2) 
})

test('Can move an enty to another cell in grid based on direction', (t) => {
  t.plan(3)

  var grid = gg.createGrid(4,4)
  // [0,  1,   2,  3]
  // [4,  5,   6,  7]
  // [8,  9,  10, 11]
  // [12, 13, 14, 15]

  grid = gg.insertEnty(grid, 5)
  // [0,  1,   2,  3]
  // [4,  X,   6,  7] <-- start position (cell 5)
  // [8,  9,  10, 11]
  // [12, 13, 14, 15]

  t.equals(grid.enties[0].cell, 5, 'Enty inserted to initial position on the grid')

  grid = gg.move(grid, 5, 'south')

  // [0,  1,   2,  3]
  // [4,  5,   6,  7]
  // [8,  X,  10, 11] <-- new position after moving south
  // [12, 13, 14, 15]  

  t.equals(grid.enties[0].cell, 9, 'Enty was moved one cell south')

  grid = gg.move(grid, 9, 'east') 

  // [0,  1,   2,  3]
  // [4,  5,   6,  7]
  // [8,  9,  X,  11] <-- new position after moving east
  // [12, 13, 14, 15]  

  t.equals(grid.enties[0].cell, 10, 'Enty was moved one cell east')


})


test('Can examine a cell for any enties that might be there', (t) => {
  t.plan(2)

  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,  8]

  grid = gg.insertEnty(grid, { name : 'apple', cell : 5 })

  t.ok( _.isNull( gg.examine(grid, 4) ), 'Examining an empty cell returns null')  //< Nothing is in this cell 

  t.equals(   gg.examine(grid, 5).name, 'apple', 'gg.examine finds the enty we placed in the grid' ) 

})


test('Examine a cell for ALL enties that might be there', (t) => {
  t.plan(6)

  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,  8]  

  grid = gg.insertEnty(grid, { cell: 6, name : 'orange' })

  grid = gg.insertEnty(grid, { cell: 6, name : 'blueberry' })

  t.ok( _.isArray( gg.examineAll(grid, 6)) )  

  t.equals( gg.examineAll(grid, 6).length,   2   ) 

  t.ok(   _.findWhere( gg.examineAll(grid, 6), { name : 'blueberry'}  )   )

  t.ok(   _.findWhere( gg.examineAll(grid, 6), { name : 'orange'}  )   )

  t.notOk(   _.findWhere( gg.examineAll(grid, 6), { name : 'bannana'}  )   )

  t.notOk(   _.findWhere( gg.examineAll(grid, 5), { name : 'blueberry'}  )   )

})


test('gg.columnIsFull', (t) => {
  t.plan(2)

  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,  8]  

  //put a single cell in column 0 (row 0): 
  grid = gg.insertEnty(grid, { cell: 0 } )
  grid = gg.populateCells(grid)

  //test to ensure the function returns not full: 
  t.notOk(  gg.columnIsFull(grid, 0) )

  //now fill up the rest of the column up : 
  grid = gg.insertEnty(grid, { cell: 3} )
  grid = gg.insertEnty(grid, { cell: 6} )
  grid = gg.populateCells(grid)

  t.ok(  gg.columnIsFull(grid, 0) )

})


test('gg.anyColumnIsFull', (t) => {
  t.plan(2)

  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,   8]

  grid = gg.insertEnty(grid, { cell: 0 } )
  grid = gg.populateCells(grid)

  t.notOk(  gg.anyColumnIsFull(grid) )

  grid = gg.insertEnty(grid, { cell: 3} )
  grid = gg.insertEnty(grid, { cell: 6} )
  grid = gg.populateCells(grid)

  t.ok(  gg.anyColumnIsFull(grid) )
})


test('gg.rowCells', (t) => {
  t.plan(16) 

  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,   8]

  var firstRowCells = gg.rowCells(grid, 0) 

  console.log(firstRowCells)
  t.ok(   _.every(firstRowCells, (cell) => _.contains([0, 1, 2], cell)) )  
  t.equals(firstRowCells.length, 3)

  var secondRowCells = gg.rowCells(grid, 3) 

  console.log(firstRowCells)
  t.ok(   _.every(secondRowCells, (cell) => _.contains([3, 4, 5], cell)) )  
  t.equals(secondRowCells.length, 3)

  var thirdRowCells = gg.rowCells(grid, 6) 

  console.log(thirdRowCells)
  t.ok(   _.every(thirdRowCells, (cell) => _.contains([6, 7, 8], cell)) )  
  t.equals(thirdRowCells.length, 3)  


  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,   8]

  //Again, but supply gg.rowCells with an x, y
  var firstRowCells = gg.rowCells(grid, [0, 0]) 

  t.ok(   _.every(firstRowCells, (cell) => _.contains([0, 1, 2], cell)) )  
  t.equals(firstRowCells.length, 3)

  var secondRowCells = gg.rowCells(grid, [1, 0]) 

  t.ok(   _.every(secondRowCells, (cell) => _.contains([3, 4, 5], cell)) )  
  t.equals(secondRowCells.length, 3)

  var thirdRowCells = gg.rowCells(grid, [2, 0]) 

  t.ok(   _.every(thirdRowCells, (cell) => _.contains([6, 7, 8], cell)) )  
  t.equals(thirdRowCells.length, 3)    


  //Try with different size grids... 
  var grid = gg.createGrid(2,2) //(does not support any smaller than 2x2)
  // [0,  1]
  // [2,  3]

  var firstRowCells = gg.rowCells(grid, [0, 0]) 
  t.ok(   _.every(firstRowCells, (cell) => _.contains([0, 1], cell)) )  
  t.equals(firstRowCells.length, 2)

  var secondRowCells = gg.rowCells(grid, [1, 0]) 
  t.ok(   _.every(secondRowCells, (cell) => _.contains([2, 3], cell)) )  
  t.equals(secondRowCells.length, 2)

})

test('gg.someEntyIsOnBottomEdge', (t) => {
  t.plan(4)

  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,   8]

  t.notOk(gg.someEntyIsOnBottomEdge(grid))

  grid = gg.insertEnty(grid, 6)

  grid = gg.populateCells(grid)

  t.ok( gg.someEntyIsOnBottomEdge(grid) )

  //Try again with different grid config: 

  var grid = gg.createGrid(7,7) 
  // [0,  1,   2,  3,  4,  5,  6 ]
  // [7,  8,   9,  10, 11, 12, 13 ]
  // [14, 15,  16, 17, 18, 19, 20 ]
  // [21, 22,  23, 24, 25, 26, 27 ]
  // [28, 29,  30, 31, 32, 33, 34 ]  
  // [35, 36,  37, 38, 39, 40, 41 ]
  // [42, 43,  44, 45, 46,  47, 48 ]

  grid = gg.insertEnty(grid, 15)
  grid = gg.populateCells(grid)

  t.notOk(gg.someEntyIsOnBottomEdge(grid))

  grid = gg.insertEnty(grid, 46)
  grid = gg.populateCells(grid)  

  t.ok( gg.someEntyIsOnBottomEdge(grid) )


})

test('gg.someEntyIsOnRightEdge', (t) => {
  t.plan(4)

  var grid = gg.createGrid(3,3) 
  // [0,  1,   2]
  // [3,  4,   5]
  // [6,  7,   8]

  t.notOk(gg.someEntyIsOnRightEdge(grid))

  grid = gg.insertEnty(grid, 5)

  grid = gg.populateCells(grid)

  t.ok( gg.someEntyIsOnRightEdge(grid) )

  //Try again with different grid config: 

  var grid = gg.createGrid(7,7) 
  // [0,  1,   2,  3,  4,  5,  6 ]
  // [7,  8,   9,  10, 11, 12, 13 ]
  // [14, 15,  16, 17, 18, 19, 20 ]
  // [21, 22,  23, 24, 25, 26, 27 ]
  // [28, 29,  30, 31, 32, 33, 34 ]  
  // [35, 36,  37, 38, 39, 40, 41 ]
  // [42, 43,  44, 45, 46,  47, 48 ]

  grid = gg.insertEnty(grid, 15)
  grid = gg.populateCells(grid)

  t.notOk(gg.someEntyIsOnRightEdge(grid))

  grid = gg.insertEnty(grid, 48)
  grid = gg.populateCells(grid)  

  t.ok( gg.someEntyIsOnRightEdge(grid) )


})

