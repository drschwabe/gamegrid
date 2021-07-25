var gg = require('./gg.js'),
    test = require('tape'),
    _ = require('underscore')

test('Grid is created', (t) => {
  t.plan(3)
  var grid = gg.createGrid(3,3)
  t.equals(grid.width, 3, 'grid.width is 3')
  t.equals(grid.height, 3, 'grid.height is 3')
  t.ok(_.isArray(grid.enties), 'grid.enties is an array')
})

test('Can insert an enty', (t) => {
  t.plan(2)
  var grid = gg.createGrid(3,3)
  gg.insertEnty(grid, {
    name : 'mushroom',
    cell : 3
  })
  t.equals(grid.enties[0].name, 'mushroom', "enty's name is correct")
  t.equals(grid.enties[0].cell, 3, "enty was inserted into the correct cell")
})

test('Can insert an enty (grid as library)', (t) => {
  t.plan(2)
  var grid = new gg.grid(3,3)
  grid.insertEnty({
    name : 'mushroom',
    cell : 3
  })
  t.equals(grid.enties[0].name, 'mushroom', "enty's name is correct")
  t.equals(grid.enties[0].cell, 3, "enty was inserted into the correct cell")
})

test('Can determine a linear cell # based on xy coordinates', (t) => {
  t.plan(2)
  var grid = gg.createGrid(3,3)
  t.equals( gg.rcToIndex(grid, 2, 2), 8, 'gg.xy pinpoints the correct linear cell number')
  // col0 col1 col2
  // [x,   x,   x   <-- row0
  //  x,   x,   x   <-- row1
  //  x,   x,   8]   <-- row2

  var grid = gg.createGrid(3,1)
  // [0,   1,   2 ]   <-- row0
  t.equals( gg.rcToIndex(grid, 0, 1), 1, 'gg.rcToIndex pinpoints the correct linear cell number in a different shaped grid')
})


test('Can find the next open cell', (t) => {
  t.plan(6)
  var gg = requireUncached('./gg.js')
  var grid = gg.createGrid(3,3)
  // [apple,   pear,   2,  <-- row0
  //  banana,   4,   5   <-- row1
  //  6,   7,   8]   <-- row2
  grid = gg.insertEnty(grid, { name : 'apple', cell : 0 })
  grid = gg.insertEnty(grid, { name : 'pear', cell : 1 })
  grid = gg.insertEnty(grid, { name : 'banana', cell : 3 })
  grid = gg.populateCells(grid)

  t.equals( grid.cells[1].enties[0].name, 'pear', 'enty was inserted correctly')
  t.equals( gg.nextOpenCell(grid), 2, 'found the next open cell')

  //try with portable API:
  var gg = requireUncached('./gg.js')
  var grid = new gg.grid(3,3)
  grid.insert({ name : 'apple', cell : 0 })
  grid.insert({ name : 'pear', cell : 1 })
  grid.insert({ name : 'banana', cell : 3 })
  grid.populateCells()

  t.equals( grid.cells[1].enties[0].name, 'pear', 'enty was inserted correctly')
  t.equals( gg.nextOpenCell(grid), 2, 'found the next open cell')


  //try with portable API, passing string and integers instead of object:
  var gg = requireUncached('./gg.js')
  var grid = new gg.grid(3,3)
  grid.insert('apple', 0)
  grid.insert('pear', 1)
  grid.insert('banana', 3)
  grid.populateCells()

  t.equals( grid.cells[1].enties[0].label, 'pear', 'enty was inserted correctly')
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

test('Can find the next open row, ignoring cells to the west', t => {
  t.plan(3)
  var grid = gg.createGrid(3,3)
  grid = gg.insertEnty(grid, 1)
  grid = gg.insertEnty(grid, 5)
  grid = gg.insertEnty(grid, 6)
  grid = gg.populateCells(grid)
  // [0,   S,   2  <--- row #0 is start cell
  //  3,   4,   x  <--- row #1 has an enty here so is not open
  //  x,   7,   8]   <-- row #2 is the first open row to the east of start cell
  t.equals( gg.nextOpenRowEast(grid, 1), 2, "Correctly pinpointed first open row to the east of start cell")

  var grid2 = gg.createGrid(6,6)
  grid2 = gg.insertEnty(grid2, 10)
  grid2 = gg.insertEnty(grid2, 15)
  grid2 = gg.insertEnty(grid2, 22)
  grid2 = gg.insertEnty(grid2, 24)
  grid2 = gg.insertEnty(grid2, 25)
  grid2 = gg.populateCells(grid2)
  // [ 0    1    2   3    4   5
  //   6    7    8   S    x   11
  //  12   13   14   x   16   17
  //  18   19   20   21   x   23
  //  x     x   26   27  28   29
  //  30   31   32   33  34   35 ]
  t.equals( gg.nextOpenRowEast(grid2, 9), 4, "Correct again, in larger grid")
  grid2 = gg.removeEnty(grid2, 22)
  grid2 = gg.populateCells(grid2)
  // [ 0    1    2   3    4   5
  //   6    7    8   S    x   11
  //  12   13   14   x   16   17
  //  18   19   20   21   22   23 //< Row 3 is now open
  //  x     x   26   27  28   29
  //  30   31   32   33  34   35 ]
  t.equals( gg.nextOpenRowEast(grid2, 9), 3, "Correct again, after removing an enty previously in a higher row")
})

test('Return accurate xy coordinates from a given index', (t) => {
  t.plan(11)
  var grid = gg.createGrid(3,3)

  var cellZero = gg.indexToRc(grid, 0), //< should be 0, 0
      cellOne =  gg.indexToRc(grid, 1), //< 0, 1
      cellTwo =  gg.indexToRc(grid, 2), //< 0, 1
      cellThree = gg.indexToRc(grid, 3) //< 1, 2
      cellFour = gg.indexToRc(grid, 4) //< 1, 2
      cellFive = gg.indexToRc(grid, 5) //< 1, 2
      cellSix = gg.indexToRc(grid, 6) //< 1, 2
      cellSeven = gg.indexToRc(grid, 7) //< 1, 2
      cellEight = gg.indexToRc(grid, 8) //< 1, 2

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

  console.log('cell 16 is at: ' + gg.indexToRc(grid2, 16) )

  t.ok( _.isEqual( gg.indexToRc(grid2, 16)  , expect), 'Index 16 on 5x5 ok')

  //Try using an uneven grid:
  var grid3 = gg.createGrid(1, 3)
  //[ 0  1  2  ]
  expect = [0,1] //< Cell 1 should be at 0,1
  t.ok( _.isEqual( gg.indexToRc(grid2, 1)  , expect), 'Index 1 on 1x3 ok')

})


test('Can expand a grid and enties remain in same place', (t) => {
  //(top-left diagonal expansion)
  t.plan(4)
  let smallGrid = gg.createGrid(2,2)

  var row = 1,
      column = 1

  smallGrid = gg.insertEnty(smallGrid, {name: 'frog', cell : gg.rcToIndex(smallGrid, [row, column])})

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

  t.equals(gg.rcToIndex(bigGrid, [row, column]), _.findWhere(smallGrid.enties, { name: 'frog'}).cell, "Frog's cell is updated correctly (based on gg.rcToIndex)")

  t.ok(bigGrid.width == 3 && bigGrid.height == 3, 'Grid width and height are increased by 1')

})

test('Finds the next occupied cell east', (t) => {
  t.plan(2)
  let grid = gg.createGrid(4,4)
  grid = gg.insertEnty(grid, { cell: 0, name: 'apple' })
  grid = gg.insertEnty(grid, { cell: 1, name: 'banana' })
  grid = gg.insertEnty(grid, { cell: 3, name: 'cherry' })
  grid = gg.insertEnty(grid, { cell: 6, name: 'orange' })
  /*
    [ apple bannana  2  cherry ]
    [ 4       5    orange     7   ]
    [ 8       9      10   11  ]
  */
  t.equals( gg.nextOccupiedCellEast(grid, 1), 3, 'gg.nextOccupiedCellEast can find the next occupied cell east')
  t.equals( gg.nextOccupiedCellEast(grid, 3), null, 'if there is no cell east gg.nextOccupiedCellEast returns null')

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
  t.plan(2)
  let grid = gg.createGrid(4, 4)

  grid = gg.insertEnty(grid, 0)
  grid = gg.insertEnty(grid, 1)
  grid = gg.populateCells(grid)
  grid = gg.rcCells(grid)

  //This is what our first row looks like:
  // [ 0  1  2  3  ]  or  [ x x o o ]
  //(there should be two open cells)
  var openCellsEast = gg.openCellsEast(grid, 0)
  t.equals(openCellsEast, 2)

  let grid2 = gg.createGrid(4,4)
  grid2 = gg.insertEnty(grid2, 2 )
  grid2 = gg.populateCells(grid2)
  grid2 = gg.rcCells(grid2)

  //      v<--- start here
  // [ 0  1  2  3  ]  or  [ o o x o ]
  //(there should be only one open cell east of cell 1)
  var openCellsEast2 = gg.openCellsEast(grid2, 1)
  t.equals(openCellsEast2, 1)
})

test('Determines the number of open cells west', t => {
  t.plan(2)
  let grid = gg.createGrid(4, 4)

  grid = gg.insertEnty(grid, 0)
  grid = gg.insertEnty(grid, 1)
  grid = gg.populateCells(grid)
  grid = gg.rcCells(grid)

  //This is what our first row looks like:
  // [ 0  1  2  3  ]  or  [ x x o o ]
  //(there should be no open cells west)
  var openCellsWest = gg.openCellsWest(grid, 0)
  t.equals(openCellsWest, 0)

  let grid2 = gg.createGrid(4, 4)
  grid2 = gg.insertEnty(grid2, 2)
  grid2 = gg.populateCells(grid2)
  grid2 = gg.rcCells(grid2)

  //This is what our first row looks like:
  // [ 0  1  2  3  ]  or  [ o o x o ]
  //(there should be 2 open cells west)
  var openCellsWest2 = gg.openCellsWest(grid2, 2)
  t.equals(openCellsWest2, 2)
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

test('Can move an enty to another cell in grid based on direction (with portable API)', (t) => {
  t.plan(3)
  //same as above test but with "portable API/grid in one":
  var gg = requireUncached('./gg.js')
  let grid = new gg.grid(4,4)
  grid.insertEnty(5)
  t.equals(grid.enties[0].cell, 5, 'Enty inserted to initial position on the grid')
  grid.move(5, 'south')
  t.equals(grid.enties[0].cell, 9, 'Enty was moved one cell south')
  grid.move(9, 'east')
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


requireUncached = require('require-uncached')

test('Can use a grid as gg API', (t) => {
  t.plan(1)
  var gg = requireUncached('./gg.js')
  var grid = new gg.grid(3,3)
  var width =  grid.width
  t.equals(width, 3 )
})


const childProcess = require('child_process')
const _s = require('underscore.string')


test(`gg.render renders as expected`, (t) => {
  t.plan(5)

  //run the demo and collect output as a string:
  var output = childProcess.execSync('node ./demos/render.js').toString()

  //in the demo grids are separated with the below string:
  var grids = output.split('-------------')

  //The demo renders grids to terminal automatically, so during each of
  //these function calls during the demo (as noted below) a grid is generated...

  //var grid = gg.createGrid(3,3)
  console.log( grids[0] )
  var firstGridDotCount = _s.count( grids[0], '.')
  var firstGridEdgeCount = _s.count( grids[0], '[') + _s.count( grids[0], ']')

  t.equals( firstGridDotCount , 9, 'There are 9 dots representing 9 blank cells ' )
  t.equals( firstGridEdgeCount , 6, 'There are 6 brackets representing 6 edges')

  //gg.insertEnty(3, 'H')
  console.log( grids[1] )
  var secondGridHasHero = _s.include( grids[1], 'H')
  var cellsBeforeHero = _s( grids[1] ).strLeft('H' ).count('.')
  var cellsAfterHero = _s( grids[1] ).strRight('H' ).count('.')

  t.ok(secondGridHasHero, 'Hero is in the grid')
  t.equals(cellsBeforeHero, 3, 'There are 3 cells before hero')
  t.equals(cellsAfterHero, 5, 'There are 5 cells after hero')

  //TODO try to make a test that can test the structure of the grid (output); ie- so it isnt rendering a jibberish mess...

})

test(`gg.makeRegion can return a square region of grid`, (t) => {
  t.plan(5)

  let gg = requireUncached('./gg.js')
  let grid = new gg.grid(6,6)

  //create a 2x6 region from the top left corner:
  let region = gg.makeRegion(grid, 0, 6,2)
  region.forEach((cellNum) => grid.insert({ cell: cellNum, label : '#' }))
  grid.render()

  //now test it:
  let expectedRegion = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  let regionFilled = _.every( expectedRegion, (cellNum) => {
    return grid.cells[cellNum].enties[0
    ].label == '#'
  })
  t.ok( regionFilled )

  //create a 3x3 region in the bottom SE corner...
  let startCell2 = grid.cells.length - 3 - (grid.width * 2)

  let region2 = gg.makeRegion(grid, startCell2, 3,3)
  region2.forEach((cellNum) => grid.insert({ cell: cellNum, label : '@' }))

  grid.render()

  //first and last cell is occupied by an @ symbol:
  t.ok( grid.cells[startCell2].enties[0].label == '@' && grid.cells[grid.cells.length - 1].enties[0].label == '@' )

  //there are only 12 '#' and 6 '@' as per the regions defined above:
  let hashSymbols = _.where(grid.enties, { label : '#'})
  let atSymbols = _.where(grid.enties, { label : '@'})

  t.equals( hashSymbols.length, 12)
  t.equals( atSymbols.length, 9)

  console.log('----------------------------')

  //can use portable API...
  let grid2 = new gg.grid(9,6)
  let region3 = grid2.makeRegion(0, 6, 2) //< no grid param required

  region3.forEach((cellNum) => grid2.insert({ cell: cellNum, label : '#' }))
  grid2.render()

  //now test it:
  let expectedRegion3 = [0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14]
  let region3Filled = _.every( expectedRegion3, (cellNum) => {
    return grid2.cells[cellNum].enties[0].label == '#'
  })

  t.ok( region3Filled )

})

test(`gg.move can move a region`, t => {
  t.plan(5)

  let gg = requireUncached('./gg.js')
  let grid = new gg.grid(6,6)

  //create a 2x2 region from the top left corner:
  let region = gg.makeRegion(grid, 0, 2, 2)
  region.forEach((cellNum) => grid.insert({ cell: cellNum, label : '#' }))
  grid.render()

  // [  #  #  .  .  .  .  ]
  // [  #  #  .  .  .  .  ]
  // [  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  ]

  console.log('----------------------------')

  grid.move( region )
  grid.render()

  // [  .  #  #  .  .  .  ]
  // [  .  #  #  .  .  .  ]
  // [  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  ]

  t.notOk(grid.cells[0].enties.length, 'region was moved')
  t.equals(grid.cells[1].enties[0].label, '#', 'region topleft existing in expected cell after move')
  t.equals(grid.cells[2].enties[0].label, '#', 'region topright existing in expected cell after move')
  t.equals(grid.cells[7].enties[0].label, '#', 'region bottomleft existing in expected cell after move')
  t.equals(grid.cells[8].enties[0].label, '#', 'region bottomright existing in expected cell after move')
})

test(`gg.divideGrid can return an array of smaller grids based off a larger grid`, t => {
  t.plan(9)
  let superGrid = gg.createGrid(4,4)

  // [  0,  1,  2,  3,  ]
  // [  4,  5,  6,  7,  ]
  // [  8,  9,  10, 11, ]
  // [  12, X,  14, 15  ]

  superGrid = gg.insert(superGrid, { name : "monster" , cell : 13, label : "M" })

  let miniGrids = gg.divide(superGrid, 2,2)

  //check that we got all grids:
  t.equals(miniGrids.length, 4)

  //that they are correct size:
  t.equals(miniGrids[0].width, 2)
  t.equals(miniGrids[0].height, 2)

  //that they contain enties from the original grid corresponding to original cell:

  // [  0,  1, ]  [  0,  1, ]
  // [  2,  3  ]  [  2,  3 ]
  //
  // [  0,  1, ]  [ 0,  1, ]
  // [  2, M ]   [  2,  3  ]
  //      ^3rd [2] mini grid, cell 3

  let miniGridWithMonster =  gg.populateCells(  miniGrids[2] )
  t.equals(miniGridWithMonster.cells[3].enties[0].name, "monster" , 'grid ouptut from sub divided grid contains enty that was in original grid' )

  //test on a wide grid...
  let wideGrid = gg.createGrid(8,4)

  // 0 [  0,  1,  2,  3,  4, 5, 6, 7  ]
  // 1 [  0,  1,  2,  3,  4, 5, 6, 7  ]
  // 2 [  0,  1,  2,  3,  4, X, 6, 7  ]  X = cell 21
  // 3 [  0,  1,  2,  3,  4, 5, 6, 7  ]

  wideGrid = gg.insert( wideGrid, { name : "treasure" , cell : [2, 5] })
  wideGrid = gg.populateCells(wideGrid)

  //let miniGrids2 = gg.divide(wideGrid, 2,2)
  let miniGrids2 = gg.divide(wideGrid, 2, 2)

  //check that we got all grids:
  t.equals(miniGrids2.length, 8)

  //that they are correct size:
  t.equals(miniGrids2[1].width, 2)
  t.equals(miniGrids2[1].height, 2)

  //in the case of a 8x4 original grid split into 2x2s:

  //    grid0     grid1    grid2  grid3
  //  [  0,  1,   0,  1,   0, 1,   0, 1  ]
  //  [  2,  3,   2,  3,   2, 3,   2, 3  ]

  //    grid4     grid5    grid6   grid7
  //  [  0,  1,   0,  1,   0, X,   0, 1  ]  < treasure should be in grid6, cell 1
  //  [  2,  3,   2,  3,   2, 3,   2, 3  ]

  miniGrids2[6] = gg.populateCells(miniGrids2[6])
  t.equals( miniGrids2[6].cells[1].enties[0].name, "treasure" , 'grid ouptut from sub divided (wide) grid contains enty that was in original grid' )


  //massive supergrid test
  let massiveGrid = gg.createGrid( 256, 88 )

  massiveGrid = gg.insert( massiveGrid, { name : "treasure" , cell : [50, 192] })
  t.equals( massiveGrid.enties[0].cell, 12992 )

  let massiveMiniGrids = gg.divide(massiveGrid, 16, 8)
  //massiveMiniGridWithTreasure =  gg.populateCells(massiveMiniGrids)
//  t.equals( miniGrids2[6].cells[1].enties[0].name, "treasure" , 'grid ouptut from sub divided (wide) grid contains enty that was in original grid' )
  //TODO: test that the treasure is where it's supposed to be !

  console.log('complete')
})

test('gg.divide again', (t) => {
  t.plan(4)
  //another test...

  let sourceGrid = gg.create(8,8)
  sourceGrid = gg.insert( sourceGrid, 'g', [2,2])
  sourceGrid = gg.insert( sourceGrid, 'b', [4,5])
  sourceGrid = gg.populateCells(sourceGrid)
  //"g" for 'grave' and "b" for 'bush'

  // [  .  .  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  .  .  ]
  // [  .  .  g  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  b  .  .  ]
  // [  .  .  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  .  .  ]
  // [  .  .  .  .  .  .  .  .  ]

  let dividedGrids = gg.divide(sourceGrid)

  //should look like...

  //      grid 0             grid 1
  // [  .  .  .  .  ]   [  .  .  .  .  ]
  // [  .  .  .  .  ]   [  .  .  .  .  ]
  // [  .  .  g  .  ]   [  .  .  .  .  ]
  // [  .  .  .  .  ]   [  .  .  .  .  ]

  //      grid 2             grid 3
  // [  .  .  .  .  ]   [  .  b  .  .  ]
  // [  .  .  .  .  ]   [  .  .  .  .  ]
  // [  .  .  .  .  ]   [  .  .  .  .  ]
  // [  .  .  .  .  ]   [  .  .  .  .  ]

  let newGrave = gg.search(dividedGrids[0], 'g')
  t.ok(newGrave, 'grave exists in the expected grid (apart of the divide results)')
  t.equals( newGrave.cell, 10, 'grave was moved to correct cell' )

  let newBush = gg.search(dividedGrids[3], 'b')
  t.ok(newBush, 'bush exists in the expected grid (apart of the divide results)')
  t.equals( newBush.cell, 1, 'bush was moved to correct cell' )
})

test('gg.zoomOut', t => {
  t.plan(2)
  let gg = requireUncached('./gg.js')
  let grid = gg.createGrid(5,5)

  //insert a tree along every edge of the grid so we can visualize the expansion 'zoomout' after it occurs

  //first row #####
  gg.rowCells(grid, 0).forEach( cell => {
    grid = gg.insert(grid, '#', cell)
  })

  //leftmost column # <
  gg.columnCells(grid, 0).forEach( cell => {
    if(cell === 0) return
    grid = gg.insert(grid, '#', cell)
  })

  //bottom row #####
  gg.rowCells(grid, [4, 0]).forEach( cell => {
    if(gg.find(grid, cell)) return
    grid = gg.insert(grid, '#', cell)
  })

  gg.columnCells(grid, 4).forEach( cell => {
    if(gg.find(grid, cell)) return
    grid = gg.insert(grid, '#', cell)
  })

  grid = gg.populateCells( grid )
  gg.render(grid)
  //grid.render()

  //now do a zoom and make sure all cells open and then all these other cellsa rew wehre we expect them to be...
  t.pass()

  grid = gg.zoomOut(grid)
  grid = gg.populateCells( grid )
  gg.render(grid)

  t.ok( grid.width === 6 && grid.height === 6, 'grid width/height updated internally')

})

test.skip('gg.zoomOut (grid as library)', t => {
  t.plan(2)
  let gg = requireUncached('./gg.js')
  let grid = new gg.grid(5,5)

  //first row #####
  gg.rowCells(grid, 0).forEach( cell => {
    grid.insert(grid, '#', cell)
  })

  //leftmost column # <
  gg.columnCells(grid, 0).forEach( cell => {
    if(cell === 0) return
    grid.insert(grid, '#', cell)
  })

  //bottom row #####
  gg.rowCells(grid, [4, 0]).forEach( cell => {
    if(gg.find(grid, cell)) return
    grid.insert(grid, '#', cell)
  })

  gg.columnCells(grid, 4).forEach( cell => {
    if(gg.find(grid, cell)) return
    grid.insert(grid, '#', cell)
  })

  grid.populateCells()
  grid.render()

  //now do a zoom and make sure all cells open and then all these other cellsa rew wehre we expect them to be...
  t.pass()

  grid.zoomOut()
  grid.populateCells()
  grid.render()

  t.ok( grid.width === 6 && grid.height === 6, 'grid width/height updated internally')

})

test('Can combine multiple grids', t => {
  t.plan(9)
  let superGrid = gg.createGrid(4,4)
  superGrid = gg.insert(superGrid, { name : "purple monster" , cell : 13 })

  // [  0,  1,  2,  3,  ]
  // [  4,  5,  6,  7,  ]
  // [  8,  9,  10, 11, ]
  // [  12, monster,  14, 15  ]

  let miniGrids = gg.divide(superGrid, 2,2)

  //check that we got all grids:
  t.equals(miniGrids.length, 4)

  //now combine them back into a super grid...
  let superGrid2 = gg.combine(miniGrids)
  superGrid2 = gg.populateCells(superGrid2)

  //check that it contains enty from the original grid:

  // [  0,  1,  2,  3,  ]
  // [  4,  5,  6,  7,  ]
  // [  8,  9,  10, 11, ]
  // [  12, monster, 14, 15  ]  //< back in original cell

  t.equals( superGrid2.cells[13].enties[0].name, "purple monster" , 'combined grid contains enty that was previously in a separate grid.' )

  //test on a wide grid...
  let wideGrid = gg.createGrid(8,4)

  // 0 [  0,  1,  2,  3,  4, 5, 6, 7  ]
  // 1 [  0,  1,  2,  3,  4, 5, 6, 7  ]
  // 2 [  0,  1,  2,  3,  4, X, 6, 7  ]  X = cell 21
  // 3 [  0,  1,  2,  3,  4, 5, 6, 7  ]

  wideGrid = gg.insert( wideGrid, { name : "treasure" , cell : [2, 5] })

  //let miniGrids2 = gg.divide(wideGrid, 2,2)
  let miniGrids2 = gg.divide(wideGrid, 2, 2)

  t.equals(  miniGrids2.length, 8, 'grid divided')

  let wideGridCombined = gg.combine(miniGrids2, 8, 4)

  t.equals( wideGridCombined.width, 8 )
  t.equals( wideGridCombined.height, 4 )

  let newGrids = [gg.createGrid(16,11), gg.createGrid(16,11), gg.createGrid(16,11), gg.createGrid(16,11)]

  newGrids[0] = gg.insertEnty(newGrids[0], 'A')
  newGrids[1] = gg.insertEnty(newGrids[1], 'B')
  newGrids[2] = gg.insertEnty(newGrids[2], 'C')
  newGrids[3] = gg.insertEnty(newGrids[3], 'D')


  let newGridsCombined = gg.combine(newGrids)


  let entyA = _.findWhere( newGridsCombined.enties, { label : 'A' })
  t.equals(entyA.cell, 0, 'entyA is at cell 0')
  let entyB = _.findWhere( newGridsCombined.enties, { label : 'B' })
  t.equals(entyB.cell, 16, 'entyB is at cell 16')
  let entyC = _.findWhere( newGridsCombined.enties, { label : 'C' })
  t.equals(entyC.cell, 352, 'entyC is at cell 352')
  let entyD = _.findWhere( newGridsCombined.enties, { label : 'D' })
  t.equals(entyD.cell, 368, 'entyD is at cell 368')

})
