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
  let grid, enty, enties, cell, idOrLabel, direction

  if( _.isObject(args[0]) && args[0].type == 'grid') {
    grid = args[0]
  } else {
    grid = this
  }

  enties = _.find( args, arg => _.isArray(arg))
  if(enties) {
    enties.forEach( cellNum => {
      grid = gg.move(grid, cellNum)
    })
    //return grid (which contains enty):
    if(grid._render) gg.render(grid)
    return this.type == 'grid' ? undefined : grid
  }

  enty = _.find( args, (arg) => _.isObject( arg ) && arg.type != 'grid' && !_.isArray(arg)  )

  cell = _.find( args, (arg) => _.isNumber( arg ))
  if(_.isUndefined(cell) && enty) cell = enty.cell

  direction = _.find( args, (arg) => _.isString(arg) && _.contains(['north', 'south', 'east', 'west'], arg))

  idOrLabel = _.find( args, (arg) => _.isString( arg ) && arg != direction )

  if( !enty && _.isNumber(cell)) {
    enty = gg.find(grid, cell)
  } else if(!enty && idOrLabel) {
    //first search by ID
    enty = _.findWhere(grid.enties, { _id : idOrLabel })
    if(!enty) { //if not found by ID, try by label:
      enty = _.findWhere(grid.enties, { label : idOrLabel })
      if(!enty) {
        enty = _.findWhere(grid.enties, { name : idOrLabel })
      }
    } else if(!enties) {
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
  enty.facing = gg.examine(grid, intendedPosition)
  if(enty.facing && enty.facing.length) {
    let nonPassableEnties = _.some(enty.facing, enty => enty.passable === false)
    if(nonPassableEnties) return this.type == 'grid' ? undefined : grid
  } else if(enty.facing && enty.facing.passable === false) {
    if(grid._render) gg.render(grid)
    return this.type == 'grid' ? undefined : grid
  }

  //Modify the enty's cell to simulate the movement:
  enty.cell = intendedPosition

  //Then update this enty's facing property again:
  enty.facing = gg.examine( grid, nextCell(grid, enty, direction) )

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
    width: parseInt(width),
    height: parseInt(height),
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
gg.isTouching = function (grid, enty, entyOrGroupOrNameOrCriteria) {
  var targetenty;
  if(_.isObject(entyOrGroupOrNameOrCriteria) && !entyOrGroupOrNameOrCriteria.cell) {
    const matchingEnties = _.filter(grid.enties, entyOrGroupOrNameOrCriteria)
    return _.findWhere(matchingEnties, { cell : enty.cell })
  } else if(!_.isObject(entyOrGroupOrNameOrCriteria)) {
    //Get any other enties in the same cell:
    var cellContents = _.filter(grid.enties, function(theEnty) {
      return theEnty.cell == enty.cell && theEnty.group == entyOrGroupOrNameOrCriteria || 
      theEnty.cell == enty.cell && theEnty.name == entyOrGroupOrNameOrCriteria
    })
    //Return said enty in the same cell otherwise, return false.
    if(cellContents.length > 0) return cellContents[0]
    return false
  } else if(_.isObject(entyOrGroupOrNameOrCriteria)){
    //If we supply an object then we are looking for a more specific match:
    var matchingEnty = _.filter(grid.enties, function(theEnty) {
      return theEnty.cell == enty.cell && theEnty == entyOrGroupOrNameOrCriteria
    })
    if(!matchingEnty || _.isEmpty(matchingEnty)) return false
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
  enty = _.find( args, (arg) =>  _.isObject(arg) && arg != grid && !_.isArray(arg))
  let cellArg = false
  cell = _.find( args, (arg) => _.isNumber(arg) || arg === 0 || _.isArray(arg))
  if(_.isNumber(cell) || _.isArray(cell)) cellArg = true
  label = _.find( args, (arg) => _.isString(arg) )
  extras = _.find( args, (arg) => _.isObject(arg) && arg.type != 'grid' && arg != enty && !_.isArray(arg))

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

  var enty, cell, idOrLabelOrName
  cell = _.find( args, (arg) => _.isNumber(arg)  )
  //Find the enty based on the cell
  if(_.isNumber(cell)) enty = gg.examine(grid, cell)
  //Accommodate for array result:
  if( _.isNumber(cell) && _.isArray(enty)) enty = enty[0]

  idOrLabelOrName = _.find( args, (arg) =>  _.isString(arg) )

  if(idOrLabelOrName) {
    enty = _.findWhere(grid.enties, { _id : idOrLabelOrName })
    if(!enty) enty = _.findWhere(grid.enties, { label : idOrLabelOrName })
    if(!enty) enty = _.findWhere(grid.enties, { name : idOrLabelOrName })
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
//gg.makeRegion = function region(grid, startCell, width, height) {
gg.makeRegion = function(...args) {
  let grid, startCell, width, height
  if( _.isObject(args[0]) && args[0].type == 'grid') {
    grid = args[0]
    startCell = args[1]
    width = args[2]
    height = args[3]
  } else {
    grid = this
    startCell = args[0]
    width = args[1]
    height = args[2]
  }
  let enty = _.isObject(_.last(args)) ? _.last(args) : false

  let testcell = gg.indexToRc(grid,startCell)
  let starter = {
    row: testcell[0],
    column: testcell[1]
  }

  if(starter.column + width > grid.width) {
    console.warn('Region extends beyond east wall.')
    return false
  }
  if(starter.row + height > grid.height) {
    console.warn('Region extends beyond south wall.')
    return false
  }

  let output = []

  for (i = 0; i < height; i++) {
    for (j = 0; j < width; j++) {
       output.push(gg.rcToIndex(grid,i + starter.row,j + starter.column))
     }
   }

  return output
}

gg.randomMapEdge = function(min, max, grid) {
  var randomNum = _.random(min, max)
  return randomNum - math.mod(randomNum, grid.width)
}

gg.populateCells = function(...args) {
  //(grid, fill)
  let grid = _.isObject(args[0]) && args[0].type == 'grid' ? args[0] : this
  let fill = _.find(args, (arg) => _.isBoolean(arg))
  let options = _.find(args, (arg) => _.isObject(arg) && args[0].type != 'grid' )
  if(options && options.fill) fill = options.fill 
  if(_.isUndefined(fill)) fill = true //< Fill by default.
  let extend = false 
  if(options && options.extend) extend = true 

  //store properties of any existing cells ..
  let oldCells //(if extend is true)
  if(extend && grid.cells ) oldCells = _.clone(grid.cells)

  grid.cells = []
  if(fill && !extend) { //Make a cell for every cell of the grid:
    grid.cells = Array.apply(null, Array(grid.width * grid.height)).map(function () {})
    grid.enties.forEach( enty => {
      if(_.isObject( grid.cells[enty.cell]) ) return grid.cells[enty.cell].enties.push(enty)
      grid.cells[enty.cell] = { enties : [enty] }
    })
    grid.cells = _.map(grid.cells, cell => _.isUndefined(cell) ? { enties : [] } : cell  ) 
  } else if(fill) {
    grid.cells = _.map(_.range(grid.width * grid.height), (cell, index) => {
      cell = {}
      //apply any properties of the old cells if any:
      if( extend && oldCells && oldCells[index] ) cell = _.extend( cell, oldCells[index]  )
      //create new enties:
      cell.enties = _.where(grid.enties, { cell: index })
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

//popuilate just one cell: 
gg.populateCell = (grid, cellNum) => {
  if(!grid.cells[cellNum]) return console.warn('the supplied cell ' + cellNum + ' does not exist')
  grid.cells[cellNum] = {
    enties : _.where(grid.enties, { cell : cellNum })
  }
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
  //let gridCells = _.range(grid.width * grid.height)
  if(!grid.cells) grid = gg.populateCells(grid)
  var rc = ArrayGrid(grid.cells, [grid.height, grid.width]).index(row,col)
  if(_.isUndefined(rc) && grid.debug) console.warn("invalid cell; supplied row/column does not match this grid (try increasing your grid's size with gg.expandGrid)")
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

gg.nextOpenCell = function(...args) {
  let grid = _.isObject(args[0]) && args[0].type == 'grid' ? args[0] : this

  let startCell = _.find(args, (arg) => _.isNumber(arg) )

  //Return the cell # of the next open cell (a cell that does not contain any enties)
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

gg.isNorthEdge = (grid, cell) => {
  if(cell < grid.width ) return true
  return false
}

gg.isEastEdge = (grid, cell) => {
  if(cell % grid.width == grid.width - 1) return true
  return false
}
gg.isSouthEdge = (grid, cell, rowOffset) => {
  if(!rowOffset) rowOffset = 0
  if((cell) > (grid.width * (grid.height + rowOffset)) - (grid.width +1)) return true
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

gg.expandGrid = (...args) => {
  let oldGrid

  if( _.isObject(args[0]) && args[0].type == 'grid') {
    oldGrid = args[0]
  } else {
    oldGrid = this
  }

  //Perform a single cell top-left diagonal expansion)...
  //store reference to original x and y coordinates:
  oldGrid.enties = _.map(oldGrid.enties, (enty) => {
    enty.rc = gg.indexToRc(oldGrid, enty.cell)
    enty.xy = enty.rc
    return enty
  })

  //create a blank new, larger grid...
  var newGrid = gg.createGrid(oldGrid.height + 1 , oldGrid.width + 1)

  //apply original x and y coordinates; correcting cell numbers:
  newGrid.enties = _.chain(oldGrid.enties).clone().map((enty) => {
    var cellNum = gg.rcToIndex(newGrid, enty.rc)
    enty.cell = cellNum  //^ update both the linear cell num and rc values:
    enty.rc = gg.indexToRc(newGrid, cellNum)
    return enty
  }).value()

  if( this.type == 'grid' ) {
    oldGrid.enties = newGrid.enties
    //this is where we would cache the previous one optionally
    return undefined
  } else {
    return newGrid
  }
}

//Determine the next enty that exists over:
gg.nextOccupiedCellEast = (grid, startCell) => {
  if(!startCell) startCell = 0
  //Return the cell # of the next occupied cell to the right (same row)
  var nextOccupiedCellEast
  var nextCell = startCell
  while (_.isUndefined(nextOccupiedCellEast)) {
    if(gg.isEastEdge(grid,nextCell)) return nextOccupiedCellEast = null //< Return null if we are already at edge.
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
  Array.from(Array(grid.width)).forEach((blank, index) => {
    rowCells.push( gg.rcToIndex(grid, [targetRow, index ]) )
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

//Find the next row that has no enties in it to the east of startCell
//(ie- ignore occupied cells in columns to the west)
gg.nextOpenRowEast = (grid, startCell) => {
  if(_.isUndefined(startCell)) startCell = 0
  var nextCellToCheck,
      nextOpenRow,
      currentColumn = gg.indexToRc(grid, startCell)[1]

  while(_.isUndefined(nextOpenRow)) {
    if(_.isUndefined(nextCellToCheck)) nextCellToCheck = startCell + grid.width
    var rowCells = gg.rowCells(grid, nextCellToCheck)
    let isOpen = true
    rowCells.some( (cell,index) => {
      if(index < currentColumn ) return false
      if(gg.examine(grid, cell)) {
        isOpen = false
        return true
      } else {
        isOpen = true
        return false
      }
    })
    if(isOpen) {
      nextOpenRow = gg.indexToRc(grid, nextCellToCheck)[0]
    } else {
      nextCellToCheck = gg.nextCellSouth(grid, nextCellToCheck)
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

gg.nextCellWest = (grid, currentCell) => {
  if( currentCell % grid.width == grid.width - 1) {
    return null
  }
  return currentCell - 1
}

gg.nextCellNorth = (grid, currentCell) => {
  //todo: check that there is a row above
  return currentCell - grid.width
}

gg.nextCell = (grid, currentCell, direction) => {
  if(direction === 'north') return gg.nextCellNorth(grid, currentCell)
  if(direction === 'west') return gg.nextCellWest(grid, currentCell)
  if(direction === 'south') return gg.nextCellSouth(grid, currentCell)
  if(direction === 'east') return gg.nextCellEast(grid, currentCell)
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
    if(index <= startCell) return
    if(!cell.enties.length) openCells++
  })
  return openCells
}

gg.openCellsWest = (grid, startCell) => {
  if(_.isUndefined(startCell)) startCell = 0
  grid = gg.populateCells(grid)
  grid = gg.rcCells(grid)

  var rowNum = gg.indexToRc(grid, startCell)[0],
      targetRow = _.filter(grid.cells, (cell) => cell.rc[0] === rowNum )

  var openCells = 0
  targetRow.forEach((cell, index) => {
    if(index >= startCell) return
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

gg.divide = (originalGrid, width, height) => {
  //^ should be resulting targetWidth, targetHeight (of each grid output a result of dividing originalGrid
  if(!width && !height) {
    //just divide the grids evenly...
    width = originalGrid.width / 2
    height = originalGrid.height / 2
  }

  const reInsertEnty = (originalEnty, index, cell, newMiniGrid) => {
    let newEnty = _.clone(originalEnty)
    newEnty.cell = index
    newEnty.originalCell = cell
    newMiniGrid.enties.push(newEnty)
  }

  const divide = (originalGrid, width, height) => {
    let miniGrids = []
    //create an array of start cells in original grid that we will need to establish a grid corner point from...
    let columnCells = gg.columnCells(originalGrid, 0)
    //[0,
    // 8,
    // 16,
    // 24 ]
    //now split into smaller arrays based on the height provided by user...
    let startingRows = _.chunk(columnCells, height)

    startingRows.forEach((startingRow, rowIndex) => {
      let cornerCell = startingRow[0]
      let heightOffset = cornerCell
      let originalRow = gg.rowCells(originalGrid, cornerCell)
      let lastCellofOriginalRow = _.last(originalRow)
      while (cornerCell < lastCellofOriginalRow) { //< this should work as long as grid is evenly divisible and also wider than taller
        let newGrid = []
        _.range(height).forEach(index => {
          let rowStartCell = ((rowIndex * height) * originalGrid.width) + (index * originalGrid.width)
          let originalGridRowCells = gg.rowCells(originalGrid, rowStartCell)
          let newGridRowCells = originalGridRowCells.slice((cornerCell - heightOffset), (cornerCell - heightOffset) + width)
          newGrid.push(newGridRowCells)
        })
        let newMiniGrid = gg.createGrid(width, height)
        newGrid = _.flatten(newGrid)
        newGrid.forEach((cell, index) => {
          let entiesInOriginal = originalGrid.cells[cell].enties
          if (entiesInOriginal.length > 1) {
            entiesInOriginal.forEach( originalEnty => reInsertEnty(originalEnty, index, cell, newMiniGrid))
          } else if(entiesInOriginal.length > 0) {
            reInsertEnty(entiesInOriginal[0], index, cell, newMiniGrid)
          }
        })
        miniGrids.push(newMiniGrid)
        cornerCell = cornerCell + width
      }
    })
    return miniGrids
  }

  return divide(originalGrid, width, height)
}

gg.divideAndCombine = (originalGrid, targetWidth, targetHeight) => {
  //take the originalGrid, divide it into ....
}

gg.zoomOut = (...args)  => {
  let grid = _.isObject(args[0]) && args[0].type == 'grid' ? args[0] : this

  //grid = gg.expandGrid(grid)
  grid = gg.expandGrid(grid)
  grid = gg.populateCells(grid)
  grid.enties = _.map(grid.enties, enty => {
    if (enty.passable === false) {
      enty.temporarily_passable = true
      enty.passable = true
    }
    return enty
  })
  grid = gg.populateCells(grid)
  //determine the grid size ratio which will determine how to move the existing cells relative to center
  let ratio = grid.width / grid.height
  let stepsEast
  let stepsSouth

  //stepsEast = math.round (   (grid.width - grid.height) / 2  )  //< seems to work ok for 16x11 one time maybe twice
  //stepsEast = math.round(   (grid.width - grid.height) / math.ceil(ratio * ratio) )  //< seems to be OK as well but veers off
  stepsEast = math.floor (   math.cbrt( grid.width )  -  ratio     )
  stepsSouth = math.round (  grid.height  / ( stepsEast  + grid.width  ) ) //good enough; slightly offcenter but not bad (16x11)

  grid.enties.forEach(enty => {
    _.range(stepsEast).forEach(step => {
      grid = gg.move(grid, enty, 'east')
    })
    grid = gg.populateCells(grid)
    _.range(stepsSouth).forEach(step => {
      grid = gg.move(grid, enty, 'south')
    })
    grid = gg.populateCells(grid)
  })
  grid = gg.populateCells(grid)
  grid.enties = _.map(grid.enties, enty => {
    if (enty.temporarily_passable) {
      delete enty.temporarily_passable
      enty.passable = false
    }
    return enty
  })
  return this.type == 'grid' ? undefined : grid
}

const cloneDeep = require('clone-deep')

gg.combine = (grids, width, height) => {
  //^ ie- 4 grids (of 16x11) with target size of 32x22 will result in a single grid 32x22
  //TODO: accommodate for a single integer that can act as multipler ie- gg.combine(grids, 4) or maybe no need to provide width / height at all
  //can be a little confusing; you have to remember the original grid size is parsed from the grids themselves; and thus not a parameter

  //if the supplied grid is a world grid (by examining below) then just
  //do user a favor and grab the grid.enties cause that is what we need...
  if(grids.enties && grids.enties[0].type === 'grid') {
    grids = _.chain(grids.enties).where({ type : 'grid' }).sortBy('cell').value()
  }

  const combine = (grids, width, height) => {
    if(!width) width = grids[0].width * (grids.length / 2)
    if(!height) height = grids[0].height * (grids.length / 2)
    //^ if no width or height we just assume square grid
    let combinedGrid = gg.createGrid( width, height )

    //create a temproary 'world' grid; this helps us easily calcualte heightOffset
    let worldGridWidth = combinedGrid.width / grids[0].width
    let worldGridHeight = combinedGrid.height / grids[0].height
    let worldGrid = gg.createGrid( worldGridWidth, worldGridHeight )
    grids.forEach((grid, index) => worldGrid = gg.insert(worldGrid, grid, index))
    worldGrid = gg.populateCells(worldGrid)

    //master list of all cells:
    let combinedGridCells = []

    //get each row start cell; ie- in a 16x11 grid: [0, 16, 32...] or alt example below:
    // [ 0 < only get the first cell from each row ...  ]
    // [ 16 x x ...  ]
    // [ 32 x x ... and so forth ]
    let rowStartCells = gg.columnCells(combinedGrid, 0)
    let targetRow = 0
    let gridRowsComplete = 0
    //loop over each row and build the cells one row at a time...
    rowStartCells.forEach( (rowStartCell, rowNumIndex) => {
      if(targetRow === grids[0].height) {
        targetRow = 0
        gridRowsComplete++
      }
      //^ reset targetRow back to zero after we loop through one of the grids vertically

      //build each row based on chunks by number of grids;
      //use the chunked array's index to determine what target grid we are pulling from...
      let rowCells = []
      let rowCellsByGrid = _.chunk( _.range(combinedGrid.width), grids[0].width )
      rowCellsByGrid.forEach((chunkOfCells, gridIndex) => {
        chunkOfCells = _.map( chunkOfCells, (cell, cellIndexInRow) => {
          let targetGrid = gg.examine(worldGrid, [gridRowsComplete, gridIndex])
          if(!targetGrid) {
            console.warn('no targetGrid')
          }
          let cellIndexInGrid = gg.rcToIndex(targetGrid, targetRow, cellIndexInRow)
          if(_.isUndefined(cellIndexInGrid)) {
            console.warn('cellIndexInGrid undefined')
          }
          return { enties : targetGrid.cells[cellIndexInGrid].enties }
        })
        rowCells.push(...chunkOfCells)
      })
      combinedGridCells.push(...rowCells)
      targetRow++ //< increment target row, then proceed to next row:
    })
    combinedGrid.cells = combinedGridCells
    combinedGrid = gg.populateEnties(combinedGrid)
    combinedGrid = gg.populateCells(combinedGrid)
    return combinedGrid
  }
  return combine(grids, width, height)
}

gg.populateEnties = grid => {
  if(!grid.cells) return console.warn('no cells to populate enties with')
  if(!grid.enties) grid.enties = []
  grid.cells.forEach( (cell, index) => {
    if(cell.enties && cell.enties.length) {
      cell.enties.forEach( enty => {
        let entyClone = _.clone(enty)
        entyClone.cell = index
        //^ ensure all enties have a matching cell # corresponding to index in this cells array
        //gg.insert(grid, enty)
        grid.enties.push( entyClone )
      })
    }
  })
  return grid
}

gg.search = (grid, label) => _.findWhere(grid.enties, { label: label })


gg.makeWorldGrid = (grids, width, height) => {
  if(!width) { //assume square if no w / h provided:
    width = grids.length / 2
    height = grids.length / 2
  }
  let newWorldGrid = gg.createGrid(width, height)
  grids.forEach( (gridEnty, index) => {
    gridEnty = gg.populateCells( gridEnty )
    gridEnty.cell = index
    gridEnty.world = newWorldGrid
    newWorldGrid = gg.insertEnty(newWorldGrid, gridEnty)
  })
  return gg.populateCells(newWorldGrid)
}

gg.whichGridInWorld = (entyName,worldGrid) => {
  let theGrid
  worldGrid.enties.some( enty => {
    let hasEnty = _.findWhere( enty.enties, { name: entyName } )
    if(hasEnty) { //found enty!  In this cell of the world.
      theGrid = enty
      return true
    }
  })
  return theGrid
}

gg.pxLocation = (grid, entyOrCell, tileWidth, tileHeight) => {
  if(!grid.tileWidth && !tileWidth && !tileHeight) {
    tileWidth = 16
    tileHeight = 16
  } else if(grid.tileWidth && !tileWidth && !tileHeight) {
    tileWidth = grid.tileWidth
    tileHeight = grid.tileHeight
  }

  let cell
  if(_.isNumber(entyOrCell) ) {
    cell = entyOrCell
  } else {
    cell = entyOrCell.cell 
  }
  
  let row = gg.indexToRc(grid, cell)[0]
  let col = gg.indexToRc(grid, cell)[1]
  
  let x = col * tileWidth
  let y = row * tileHeight
  return {x, y}
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
