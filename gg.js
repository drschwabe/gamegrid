var gg = {},
    ROT = require('rot-js'),
    _ = require('underscore'),
    math = require('mathjs')

gg.isArrowKey = function(keyCode) {
  return _.contains([38, 39, 40, 37], keyCode)
}

gg.getDirection = function(keyCode) {
  if(keyCode == 38) return 'north'
  if(keyCode == 39) return 'east'
  if(keyCode == 40) return 'south'
  if(keyCode == 37) return 'west'
  return null
}

gg.move = function(...args) {
  //grid, entyOrCellOrIdOrLabel, direction
  let grid, enty, cell, idOrLabel, direction

  if( _.isObject(args[0]) && args[0].type == 'grid') {
    grid = args[0]
  } else {
    grid = this
  }

  enty = _.find( args, (arg) => _.isObject( arg ) && arg.type != 'grid' )

  cell = _.find( args, (arg) => _.isNumber( arg ))

  direction = _.find( args, (arg) => _.isString(arg) && _.contains(['north', 'south', 'east', 'west'], arg))

  idOrLabel = _.find( args, (arg) => _.isString( arg ) && arg != direction )

  if( _.isNumber(cell)) {
    enty = gg.find(grid, cell)
  } else if(!enty && idOrLabel) {
    //first search by ID
    enty = _.findWhere(grid.enties, { _id : idOrLabel })
    if(!enty) { //if not found by ID, try by label:
      enty = _.findWhere(grid.enties, { label : idOrLabel })
      if(!enty) {
        enty = _.findWhere(grid.enties, { name : idOrLabel })
      }
    } else {
      throw 'Cannot find enty'
    }
  }

  //also accommodate for just single letter directions:
  if(!direction) {
    args.forEach((arg) => {
      if(arg == idOrLabel) return
      if( _.isString(arg) && arg == 'n') direction = 'north'
      if( _.isString(arg) && arg == 's') direction = 'south'
      if( _.isString(arg) && arg == 'e') direction = 'east'
      if( _.isString(arg) && arg == 'w') direction = 'west'
    })
  }

  function nextCell(grid, enty, direction) {
    //Returns the cell # for the nearest cell in the given direction:
    var nextCell,
        gridSize = grid.height * grid.width
    switch(direction) {
      case 'north':
        if( enty.cell < grid.width ) { //< Check for map edge...
          nextCell = 'map edge'
          break
        }
        nextCell = enty.cell - grid.width
        break
      case 'east':
        if( enty.cell % grid.width == grid.width - 1) {
          nextCell = 'map edge'
          break
        }
        nextCell = enty.cell + 1
        break
      case 'south':
        if( enty.cell > gridSize - (grid.width +1)) {
          nextCell = 'map edge'
          break
        }
        nextCell = enty.cell + grid.width
        break
      case 'west':
        if( enty.cell % grid.width == 0) {
          nextCell = 'map edge'
          break
        }
        nextCell = enty.cell - 1
        break
      default :
        //If no direction supplied, just do a linear increment east
        if( enty.cell % grid.width == grid.width - 1) {
          nextCell = 'map edge'
          break
        }
        nextCell = enty.cell + 1
        break
    }
    return nextCell
  }

  if(_.isString(enty)) enty = _.findWhere(grid.enties, { name: enty })

  //Mark as revised so it's re-rendered next step.
  enty.revised = true
  enty.direction = direction //< Update enty's direction.

  //Check if we are on a map edge:
  enty.onMapEdge = false //< false by default.
  var intendedPosition = nextCell(grid, enty, direction)
  if(intendedPosition == 'map edge') {
    enty.onMapEdge = true
    if(grid._render) gg.render(grid)
    return this.type == 'grid' ? undefined : grid
  }

  //Prevent movement (but update facing) if the object we are facing is impassable:
  enty.facing = this.examine(grid, intendedPosition)
  if(enty.facing && enty.facing.passable === false) {
    if(grid._render) gg.render(grid)
    return this.type == 'grid' ? undefined : grid
  }

  //Modify the enty's cell to simulate the movement:
  enty.cell = intendedPosition

  //Then update this enty's facing property again:
  enty.facing = this.examine( grid, nextCell(grid, enty, direction) )

  //Also update the direction enty is pointed:
  enty.direction = direction

  //return grid (which contains enty):
  if(grid._render) gg.render(grid)
  return this.type == 'grid' ? undefined : grid
}


gg.examine = function(...args) {
  //grid, cellOrRc
  let grid, cellOrRc
  if(args.length == 1) {
    grid = gg._grid
    cellOrRc = args[0]
  } else {
    grid = args[0]
    cellOrRc = args[1]
  }
  var cell
  if(_.isArray(cellOrRc)) cell = gg.rcToIndex(grid, cellOrRc)
  else cell = cellOrRc
  var entyOrEnties = _.where(grid.enties, { cell :  cell })
  if(_.isUndefined(entyOrEnties) || _.isEmpty(entyOrEnties) ) return null
  if( entyOrEnties.length == 1 ) return entyOrEnties[0]
  return entyOrEnties //< Returns an array.
}

gg.examineAll = function(grid, cellOrRc) {
  var cell
  if(_.isArray(cellOrRc)) cell = gg.rcToIndex(grid, cellOrRc)
  else cell = cellOrRc
  var entyOrEnties = _.where(grid.enties, { cell :  cell })
  if(_.isUndefined(entyOrEnties) || _.isEmpty(entyOrEnties) ) return null
  return entyOrEnties //< Returns an array.
}

// Looks through each enty in the cell, returning the first one that passes a truth test (predicate), or undefined if no value passes the test. The function returns as soon as it finds an acceptable enty, and doesn't traverse the entire list of enties.
// If no predicate is provided, the first enty
// or undefined if no enties are there
gg.find = (grid, cellOrRc, predicate) => {
  return _.findWhere( grid.enties, { cell : cellOrRc } )
}
//WIP / TODO factor in predicate

gg.create = function(width, height, mapType, name) {
  var id
  if(name) id = name
  else id = 'grid_0'
  var grid = {
    _id : id,
    width: width,
    height: height,
    enties: [],
    type : 'grid'
  }
  if(!mapType) return this.type == 'grid' ? null : grid

  var rotMap
  //Accommodate for additional params:
  if(mapType == 'Rogue') {
    rotMap = new ROT.Map[mapType](width, height)
    //This map type has a special randomize function:
    rotMap.randomize(0.5)
  }
  else if(mapType == 'Cellular') {
    rotMap = new ROT.Map[mapType](width, height)
    //This map type has a special randomize function:
    rotMap.randomize(0.3)
  }
  else if(mapType == 'Digger') {
    rotMap = new ROT.Map[mapType](width, height, { dugPercentage : 0.9 })
  }
  else if(mapType == 'Uniform') {
    rotMap = new ROT.Map[mapType](width, height, { roomDugPercentage: 0.9 })
  }
  else {
    rotMap = new ROT.Map[mapType](width, height)
  }
  var cellCount = 0;
  rotMap.create(function(x, y, value) {
    //For each value generated by rotMap, spit out a block:
    var blockEnty = {
      group: 'block',
      label : '#',
      cell: cellCount,
      passable : false
    }
    if(value) grid.enties.push(blockEnty)
    cellCount++;
  })

  if(this.type == 'grid') {
    this.map_type = mapType
    return null
  }
  return grid
}

gg.createGrid = gg.create

//Returns an enty if the supplied enty is sharing the same cell as the supplied group:
gg.isTouching = function (grid, enty, entyOrGroup) {
  var targetenty;
  if(!_.isObject(entyOrGroup)) {
    //Get any other enties in the same cell:
    var cellContents = _.filter(grid.enties, function(theEnty) {
      return theEnty.cell == enty.cell && theEnty.group == entyOrGroup
    })
    //Return said enty in the same cell otherwise, return false.
    if(cellContents.length > 0) return cellContents[0]
    return false
  } else if(_.isObject(entyOrGroup)){
    //If we supply an object then we are looking for a more specific match:
    var matchingenty = _.filter(grid.enties, function(theEnty) {
      return theEnty.cell == enty.cell && theEnty == entyOrGroup
    })
    if(_.isEmpty(matchingEnty)) return false
    return matchingEnty[0]
  }
}

gg.insert = function(...args) {
  let grid, enty, cell, label, extras
  //(obj, int/obj, str, obj)
  //parse args to establish what we working with:

  if( _.isObject(args[0]) && args[0].type == 'grid') {
    grid = args[0]
  } else {
    grid = this
  }
  enty = _.find( args, (arg) => _.isObject(arg) && arg != grid)
  let cellArg = false
  cell = _.find( args, (arg) => _.isNumber(arg) || arg === 0 || _.isArray(arg))
  if(cell) cellArg = true
  label = _.find( args, (arg) => _.isString(arg) )
  extras = _.find( args, (arg) => _.isObject(arg) && arg.type != 'grid' && arg != enty)

  if(!cell && !_.isNumber(cell)) cell = 0
  if(enty && !enty.cell) enty.cell = cell
  if(enty && cellArg && enty.cell ) enty.cell = cell
  //^ overwrite any existing cell if it had one previously, if an explicit cell was also supplied
  if(!enty) enty = { cell : cell }
  //Convert to linear number if an array ([row,col]) was provided as cell:
  if(_.isArray(enty.cell)) enty.cell = gg.rcToIndex(grid, enty.cell)

  if(label) enty.label = label

  //Apply any additional properties:
  if(extras) enty = _.extend(enty, extras )

  grid.enties.push(enty)

  if(grid._render) gg.render(grid)
  //if this operation was called from an instance of GG do not return
  //(since said instance is also the grid) otherwise return the grid:
  return this.type == 'grid' ? undefined : grid
}

gg.insertEnty  = gg.insert

gg.remove = function(...args) {
  //grid, cellOrEntyOrIdOrLabel

  if( _.isObject(args[0]) && args[0].type == 'grid') {
    grid = args[0]
  } else {
    grid = this
  }

  var enty, cell, idOrLabel
  cell = _.find( args, (arg) => _.isNumber(arg)  )
  //Find the enty based on the cell
  if(_.isNumber(cell)) enty = gg.examine(grid, cell)
  //Accommodate for array result:
  if( _.isNumber(cell) && _.isArray(enty)) enty = enty[0]

  idOrLabel = _.find( args, (arg) =>  _.isString(arg) )

  if(idOrLabel) {
    enty = _.findWhere(grid.enties, { _id : idOrLabel })
    if(!enty) enty = _.findWhere(grid.enties, { label : idOrLabel })
  }

  if(!enty && _.isObject(args[0]) && args[0].type == 'grid') {
    enty = args[1]
  }
  grid.enties = _.without(grid.enties, enty)
  if(grid._render) gg.render(grid)
  return this.type == 'grid' ? undefined : grid
}
gg.removeEnty = gg.remove

//Returns an array of cell numbers representing a region of the grid:
gg.makeRegion = function(grid, startCell, width, height) {
  var region = []

  var endCell = Math.round(63 * grid.width * (height -1) / 36)
  //^ 63 seems to be the magic number.

  startCell = parseInt(startCell)
  endCell = parseInt(endCell)

  //Loop over each row:
  _.range(startCell, endCell, grid.width).forEach(function(rowStart) {
    //And populate each cell of the row with a block:
    _.range(rowStart, rowStart + width).forEach(function(cell) {
      region.push(cell)
    })
  })
  return region
}

gg.randomMapEdge = function(min, max, grid) {
  var randomNum = _.random(min, max)
  return randomNum - math.mod(randomNum, grid.width)
}

gg.populateCells = function(...args) {
  //(grid, fill)
  let grid = _.isObject(args[0]) && args[0].type == 'grid' ? args[0] : this
  let fill = _.find(args, (arg) => _.isBoolean(arg))
  if(_.isUndefined(fill)) fill = true //< Fill by default.

  grid.cells = []
  if(fill) { //Make a cell for every cell of the grid:
    grid.cells = _.map(_.range(grid.width * grid.height), (cell, index) => {
      cell = {
        enties : _.where(grid.enties, { cell: index })
      }
      if(!cell.enties) delete cell.enties
      return cell
    })
  } else { //Only make cells which are relevant (better performance for massive grids)...
    //determine the furthest enty:
    var maxEnty = _.max(grid.enties, (enty) => enty.cell).cell
    //populate an array/range of cells up to that index....
    _.range(maxEnty).forEach((index) => {
      grid.cells[index] = { //Put any enties in cell:
        enties : _.where(grid.enties, { cell : index })
      }
    })
  }
  return grid
}

//Populate a row of cells:
gg.populateRowCells = (grid, row) => {
  if(!row) row = 0
  grid.cells = []

  var maxEnty = _.max(grid.enties, (enty) => enty.cell).cell
  //Populate an array/range of cells up to that index....
  _.range(maxEnty).forEach((index) => {
    //Put the enty in the cell:
    grid.cells[index] = {
      enties : _.where(grid.enties, { cell : index })
    }
  })
  return grid
}

var ArrayGrid = require('array-grid')

gg.rcToIndex = (grid, param1, param2) => {
  var row, col //<^ Accept either an array [row,col] or row, col as plain numbers
  if(_.isArray(param1)) {
    row = param1[0]
    col = param1[1]
  } else {
    row = param1
    col = param2
  }
  //Return the cell num:
  var rc = ArrayGrid(grid.cells, [grid.width, grid.height]).index(row,col)
  return rc
}

gg.xyToIndex = gg.rcToIndex

gg.indexToRc = (grid, index) => {
  var x = math.floor( index / grid.width ),
      y = math.floor( index % grid.width )
  return [x, y]
}

gg.indexToXy = gg.indexToRc

gg.rcCells = (grid) => {
  grid.cells.forEach((cell, index) => {
    cell.rc = gg.indexToRc(grid,index)
  })
  return grid
}

gg.xyCells = gg.rcCells

gg.nextOpenCell = (grid, startCell) => {
  //Return the cell # of the next open cell (a cell that does not contain any enties)
  //return grid.cells.length
  var openCell
  if(!startCell) startCell = 0
  grid.cells.some( (cell, index) => {
    //skip if startCell is higher:
    if(startCell > index) return false
    if(cell.enties.length) {
      return false
    } else {
      openCell = index
      return true
    }
  })
  return openCell
}

gg.nextOpenCellSouth = (grid, startCell) => {
  if(!startCell) startCell = 0
  //Return the cell # of the next open cell down (same column)
  var nextOpenCellSouth
  var nextCell = startCell
  while (_.isUndefined(nextOpenCellSouth)) {
    nextCell = nextCell + grid.width
    var nextCellContents = gg.examine(grid, nextCell)
    if( !nextCellContents ) nextOpenCellSouth = nextCell
  }
  //WARNING^ this is returning incorrect results; needs testing!
  return nextOpenCellSouth
}

gg.nextOpenCellEast = (grid, startCell) => {
  if(!startCell) startCell = 0
  //Return the cell # of the next open cell to the right (same row)
  var nextOpenCellEast
  var nextCell = startCell
  while (_.isUndefined(nextOpenCellEast)) {
    nextCell = nextCell + 1
    var nextCellContents = gg.examine(grid, nextCell)
    if(!nextCellContents) nextOpenCellEast = nextCell
  }
  return nextOpenCellEast
}

gg.isEdge = (grid, cell) => {
  if(cell < grid.width ) return true //North edge
  if(cell % grid.width == grid.width - 1) return true   //< East edge
  if(cell > (grid.width * grid.height) - (grid.width +1)) return true //< South edge
  if(cell % grid.width == 0) return true //< West edge
  return false //< not an edge!
}

gg.isEastEdge = (grid, cell) => {
  if(cell % grid.width == grid.width - 1) return true
  return false
}
gg.isSouthEdge = (grid, cell) => {
  if(cell > (grid.width * grid.height) - (grid.width +1)) return true
  return false
}

gg.nextCol = (grid, cell, loop) => {
  //Return the value of the cell one column to the right...
  if(!loop && gg.isEdge(grid, cell)) return null //< If no columns to the right, return null:
  var enties = _.where(grid.enties, { cell :  cell + 1})
  if(_.isUndefined(enties) || _.isEmpty(enties) ) return null
  return enties //< Returns an array.
}


gg.nextRow = (grid, cell, loop) => {
  //Return the value of the cell one row below...
  if(!loop && gg.isEdge(grid, cell)) return null //< If no cells below, return null:
  var enties = _.where(grid.enties, { cell :  cell + grid.width })
  if(_.isUndefined(enties) || _.isEmpty(enties) ) return null
  return enties //< Returns an array.
}

gg.expandGrid = (oldGrid) => {
  //Perform a single cell top-left diagonal expansion)...
  //store reference to original x and y coordinates:
  oldGrid.enties = _.map(oldGrid.enties, (enty) => {
    enty.rc = gg.indexToRc(oldGrid, enty.cell)
    enty.xy = enty.rc
    return enty
  })

  //create a blank new, larger grid:
  var newGrid = gg.createGrid(oldGrid.height + 1 , oldGrid.width + 1)

  //apply original x and y coordinates; correcting cell numbers:
  newGrid.enties = _.chain(oldGrid.enties).clone().map((enty) => {
    var cellNum = gg.rcToIndex(newGrid, enty.rc)
    enty.cell = cellNum  //^ update both the linear cell num and rc values:
    enty.rc = gg.indexToRc(newGrid, cellNum)
    return enty
  }).value()

  return newGrid
}

//Determine the next enty that exists over:
gg.nextOccupiedCellEast = (grid, startCell) => {
  if(!startCell) startCell = 0
  //Return the cell # of the next occupied cell to the right (same row)
  var nextOccupiedCellEast
  var nextCell = startCell
  while (_.isUndefined(nextOccupiedCellEast)) {
    nextCell = nextCell + 1
    var nextCellContents = gg.examine(grid, nextCell)
    if(nextCellContents) return nextOccupiedCellEast = nextCell
    if(gg.isEastEdge(grid,nextCell)) return nextOccupiedCellEast = null //< Prevent infinity.
  }
  return nextOccupiedCellEast
}

//Determine the next enty that exists over:
gg.nextOccupiedCellWest = (grid, startCell) => {
  if(!startCell) startCell = 0
  //Return the cell # of the next occupied cell to the right (same row)
  var nextOccupiedCellWest
  var nextCell = startCell
  while (_.isUndefined(nextOccupiedCellWest)) {
    nextCell = nextCell - 1
    var nextCellContents = gg.examine(grid, nextCell)
    if(nextCellContents) return nextOccupiedCellWest = nextCell
    //if(gg.isWestEdge(grid,nextCell)) return nextOccupiedCellEast = null //< Prevent infinity.
  }
  return nextOccupiedCellWest
}


gg.westCell = (grid, cell) => {
  //Determine the rc then use that...
  if(_.isNumber(cell)) {
    if(gg.isEdge(grid, cell)) return null
    var currentCellRc = gg.indexToRc(grid, cell)
    //Now simply subtract one cell from the x axis
    //(and return the cell number):
    var westCellRc = [ currentCellRc[0], currentCellRc[1] -1 ]
    var westCellIndex = gg.rcToIndex(grid,westCellRc)
    return westCellIndex
  } else {
    throw 'a cell number (starting point) was not provided'
  }
}

gg.columnCells = (grid, cellOrRc) => {
  if(_.isUndefined(cellOrRc))
  //Return a range of cell numbers for the given column:
  var targetColumn
  if(_.isArray(cellOrRc)) targetColumn = cellOrRc[1]
  else targetColumn = gg.indexToRc(grid, cellOrRc)[1]
  var columnCells = []
  _.range(grid.height).forEach((row) => {
    columnCells.push( gg.rcToIndex(grid, [row, targetColumn]) )
  })
  return columnCells
}

gg.columnEnties = (grid, cellOrRc) => {
  if(_.isUndefined(cellOrRc)) return console.log('no cell or row/column pair provided')
  var targetColumn
  if(_.isArray(cellOrRc)) targetColumn = cellOrRc[1]
  else targetColumn = gg.indexToRc(grid, cellOrRc)[1]

  //Return all enties in a given column:
  var thisColumnCells = gg.columnCells(grid, targetColumn)
  thisColumnEnties = _.chain(grid.enties)
    .map((enty) => {
      if(_.contains(thisColumnCells, enty.cell)) return enty
      return false
    })
    .compact()
    .value()
  return thisColumnEnties
}

gg.rowCells = (grid, cellOrRc) => {
  //Return a range of cell numbers for the given row:
  var targetRow
  if(_.isArray(cellOrRc)) targetRow = cellOrRc[0]
  else targetRow = gg.indexToRc(grid, cellOrRc)[0]
  var rowCells = []
  _.range(grid.width).forEach((column) => {
    rowCells.push( gg.rcToIndex(grid, [targetRow, column ]) )
  })
  return rowCells
}

//prevCell will work like westCell except that it will
//always return a cell num even on an edge (ie- next row up)

//Find the next open column...
//gg.nextOpenColumn = (grid, cell) => {
gg.nextOpenColumn = (grid, startCell) => {
  if(_.isUndefined(startCell)) startCell = 0
  var nextCellToCheck,
      nextOpenColumn
  //TODO: prevent this loop from freezing by making sure
  //we exit if there is never any open column...
  //console.log('running nextOpenColumn while loop... (dangerous)')
  while(_.isUndefined(nextOpenColumn)) {
    if(_.isUndefined(nextCellToCheck)) nextCellToCheck = startCell
    var nextOpenCell = gg.nextOpenCell(grid, nextCellToCheck)
    var columnCells = gg.columnCells(grid, nextOpenCell)
    if( _.every(columnCells, (cell) => !gg.examine(grid, cell))) {
      nextOpenColumn = gg.indexToRc(grid, nextOpenCell)[1]
    } else {
      nextCellToCheck++
    }
  }
  //console.log('finished running nextOpenColumn while loop: ' + nextOpenColumn)
  return nextOpenColumn
}

//Find the next row that has no enties in it:
gg.nextOpenRow = (grid, startCell) => {
  if(_.isUndefined(startCell)) startCell = 0
  var nextCellToCheck,
      nextOpenRow
  while(_.isUndefined(nextOpenRow)) {
    if(_.isUndefined(nextCellToCheck)) nextCellToCheck = startCell
    var nextOpenCell = gg.nextOpenCell(grid, nextCellToCheck)
    var rowCells = gg.rowCells(grid, nextOpenCell)
    if( _.every(rowCells, (cell) => !gg.examine(grid, cell))) {
      nextOpenRow = gg.indexToRc(grid, nextOpenCell)[0]
    } else {
      nextCellToCheck++
    }
  }
  return nextOpenRow
}

gg.nextCellEast = (grid, currentCell) => {
  if( currentCell % grid.width == grid.width - 1) {
    return null
  }
  return currentCell + 1
}

gg.openCellsEast = (grid, startCell) => {
  if(_.isUndefined(startCell)) startCell = 0
  grid = gg.populateCells(grid)
  grid = gg.rcCells(grid)

  //Determine which row is our starting cell; and get all enties in target row:
  var rowNum = gg.indexToRc(grid, startCell)[0],
      targetRow = _.filter(grid.cells, (cell) => cell.rc[0] === rowNum )

  //Now iterate over it:
  var openCells = 0
  targetRow.forEach((cell, index) => {
    if(!cell.enties.length) openCells++
  })
  return openCells
}

gg.openCellsDown = (grid, startCell) => {
  var openCellsDown = []
  grid = gg.populateCells(grid)
  grid = gg.rcCells(grid)
  //idea: is there a test that could be run, which is less expensive than always populating cells or rc'ing cells each function call ?

  //Determine which row is our starting cell; and get all enties in target row:
  var columnNum = gg.indexToRc(grid, startCell)[1],
      targetColumn = _.filter(grid.cells, (cell) => cell.rc[1] === columnNum )

  //Now iterate over it:
  var openCells = []
  targetColumn.forEach((cell, index) => {
    if(!cell.enties.length) openCells.push(cell)
  })
  return openCells
}

gg.nextCellSouth = (grid, currentCell) => {
  if( currentCell > (grid.width * grid.height) - (grid.width +1)) {
    return null //< Map edge
  }
  return currentCell + grid.width
}

gg.row = (grid, cell) => {
  //Return the row of the given cell
  return gg.indexToRc(grid, cell)[0]
}

gg.column = (grid, cell) => {
  //Return the column of the given cell
  return gg.indexToRc(grid, cell)[1]
}

gg.teleport = (grid, cellOrEnty, destinationCell) => {
  //Teleport an enty to a different position of the grid:

}

gg.entiesBelowInColumn = () => {
  //Return all the enties below a given cell, but within the same column
}

gg.columnIsFull = (grid, column) => {
  //Returns true if each cell in a given column is occupied by an enty:
  var colCells = gg.columnCells(grid, column)
  //var everyCellHasEnty = _.every(colCells, (cell) => cell.enties && cell.enties.length )
  var everyCellHasEnty = _.every(colCells, (cell) => grid.cells[cell].enties && grid.cells[cell].enties.length)
  if( everyCellHasEnty ) return true
  else return false
}

gg.anyColumnIsFull = (grid) => {
  //Returns true if ANY column of the grid is fully occupied by enties
  //(at least one enty occupies each cell of the column):
  var columns = _.range(grid.width)
  var anyColumnIsFull
  columns.some((col, index) => {
    var colCells = gg.columnCells(grid, index)
    anyColumnIsFull = gg.columnIsFull(grid, col)
    return anyColumnIsFull //< return to escape or continue the loop
  })
  return anyColumnIsFull //< return again for the final result
}

gg.someEntyIsOnBottomEdge = (grid) => {
  if(!grid.height) return false
  if(grid.height == 1) {
    if(grid.cells[0].enties) return true
    else return false
  }
  //find the bottom row:
  var bottomRowCells = gg.rowCells(grid, [grid.height -1, 0])
  if(!bottomRowCells.length) return false
  var someEntyIsOnBottomEdge = bottomRowCells.some((cell) => {
    return gg.examine(grid, cell)
  })
  return someEntyIsOnBottomEdge
}

gg.someEntyIsOnRightEdge = (grid) => {
  if(!grid.width) return false
  if(grid.width == 1) {
    if(grid.cells[0].enties) return true
    else return false
  }
  //find the right column:
  var rightEdgeColumnCells = gg.columnCells(grid, [0, grid.width -1])
  if(!rightEdgeColumnCells.length) return false
  var someEntyIsOnRightEdge = rightEdgeColumnCells.some((cell) => {
    return gg.examine(grid, cell)
  })
  return someEntyIsOnRightEdge
}

gg.enter = function(...args) {
  let grid, enty , idOrLabel, destinationGrid
  if( _.isObject(args[0]) && args[0].type == 'grid') {
    grid = args[0]
  } else {
    grid = this
  }

  enty = _.find( args, (arg) => _.isObject( arg ) && arg.type != 'grid' )

  idOrLabel = _.find( args, (arg) => _.isString( arg ) )

  if(!enty && idOrLabel) {
    //first search by ID
    enty = _.findWhere(grid.enties, { _id : idOrLabel })
    if(!enty) { //if not found by ID, try by label:
      enty = _.findWhere(grid.enties, { label : idOrLabel })
      if(!enty) {
        enty = _.findWhere(grid.enties, { name : idOrLabel })
      }
    } else {
      throw 'Cannot find enty'
    }
  }

  //find the doorway
  let entrance = _.find(grid.enties, (gEnty) => gEnty.destination && gEnty.cell == enty.cell )

  if(!entrance) {
    console.warn('nothing to enter here')
    return false
  }


  //we will enter the grid in current cell
  if(!destinationGrid) {
    destinationGrid = entrance.destination
  }

  if(!destinationGrid) {
    console.warn('nothing here is enterable')
    return false
  }

  enty.cell = entrance.destination_entry ?  entrance.destination_entry : 0

  destinationGrid = gg.insert(destinationGrid, enty)

  grid = gg.remove(grid, enty)

  if(grid._render) {
    gg.render(grid) //also render the destination grid:
    gg.render(destinationGrid)
  }
  return this.type == 'grid' ? undefined : grid
}




gg.render = function(...args) {
  //(grid, autoRender)
  let grid
  if( _.isObject(args[0]) && args[0].type == 'grid') {
    grid = args[0]
  } else {
    grid = this
  }
  let autoRender = _.find( args, (arg) => _.isBoolean(arg) )
  if(autoRender) grid._render = true //< turn on auto-rendering

  console.log('')
  grid = gg.populateCells(grid)
  //chunk the grid into smaller arrays (each array a row)
  var rows = _.chunk(grid.cells, grid.width)
  var cellCount = 0
  //loop over each row:
  rows.forEach((row, rowIndex) => {
    var output
    row.forEach((cell, colIndex) => {
      if(colIndex == 0) output = '[ '
      if(cell.enties.length) {
        output = output + ` ${cell.enties[0].label} `
      } else {
        output = output + ` . `
      }
      cellCount++
    }) //output the value of the row:
    console.log(output + ' ]')
  })
  console.log('')
  return
}

//### gg.grid ###
//this function is to be called with new operator
//ie:
//var gg = require('gg')
//var grid = new gg.grid(3, 3)
//^ now you get a grid and the API in same object;
//operations called will modify said grid
//this is to shortcut having to do myGrid = grid.move(myGrid, etc); now you can just do myGrid.move()
gg.grid = function(...args) {
  this._grid = true
  let newGrid = gg.createGrid(...args)
  _.extend(this, newGrid)
  _.each( gg, (val, key) => {
    Object.defineProperty(this, key, {
      enumerable : false,
      value : val
    })
  })
}

module.exports = gg
