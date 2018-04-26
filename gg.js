var gg = {}, 
    ROT = require('rot-js'),
    _ = require('underscore'), 
    uuid = require('node-uuid'), 
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

gg.move = function(grid, entyOrCell, direction) {
  var enty 
  if(_.isNumber(entyOrCell)) enty = gg.find(grid, entyOrCell)
  else enty = entyOrCell
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
        //If no direction supplied, just do a linear increment...
        if(enty.cell == gridSize) nextCell = 0
        //unless we are at the last cell, in which case we set the new position to 0 (ie: looping around a track)  
        else nextCell = enty.cell + 1       
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
    return grid
  }

  //Prevent movement (but update facing) if the object we are facing is impassable:
  enty.facing = this.examine(grid, intendedPosition)
  if(enty.facing && enty.facing.passable === false) return enty 
  //^ (unchanged)

  //Modify the enty's cell to simulate the movement:
  enty.cell = intendedPosition

  //Then update this enty's facing property again:
  enty.facing = this.examine( grid, nextCell(grid, enty, direction) )

  //Also update the direction enty is pointed:
  enty.direction = direction

  //return grid (which contains enty):  
  return grid
}

gg.revise = function(enty) {
  enty._rev = uuid.v4() //< Creates a unique revision stamp.    
  return enty
}

//Assign a unique id based on group:
gg.indexIt = function(grid, enty) {
  //Initialize a groups variable if not already existing: 
  if(!grid.groups) grid.groups = {}
  //Find if the group has been established:
  if(!grid.groups[enty.group]) {
    grid.groups[enty.group] = {
      counter : -1
    }
  }
  enty.groupid = grid.groups[enty.group].counter + 1
  //Increment the counter:
  grid.groups[enty.group].counter++;
  //Give it a unique ID and revision property: 
  enty._id = uuid.v4()
  return enty
}

gg.examine = function(grid, cellOrXy) {
  var cell 
  if(_.isArray(cellOrXy)) cell = gg.xyToIndex(grid, cellOrXy)
  else cell = cellOrXy
  var entyOrEnties = _.where(grid.enties, { cell :  cell })   
  if(_.isUndefined(entyOrEnties) || _.isEmpty(entyOrEnties) ) return null
  if( entyOrEnties.length == 1 ) return entyOrEnties[0]
  return entyOrEnties //< Returns an array. 
}

gg.examineAll = function(grid, cellOrXy) {
  var cell 
  if(_.isArray(cellOrXy)) cell = gg.xyToIndex(grid, cellOrXy)
  else cell = cellOrXy
  var entyOrEnties = _.where(grid.enties, { cell :  cell })   
  if(_.isUndefined(entyOrEnties) || _.isEmpty(entyOrEnties) ) return null
  return entyOrEnties //< Returns an array. 
}

// Looks through each enty in the cell, returning the first one that passes a truth test (predicate), or undefined if no value passes the test. The function returns as soon as it finds an acceptable enty, and doesn't traverse the entire list of enties. 
// If no predicate is provided, the first enty 
// or undefined if no enties are there
gg.find = (grid, cellOrXy, predicate) => {
  return _.findWhere( grid.enties, { cell : cellOrXy } )
}
//WIP / TODO factor in predicate

gg.createGrid = function(width, height, type, name) {
  var id
  if(name) id = name
  else id = 'grid_0'
  var grid = {
    _id : id,
    width: width,
    height: height,
    enties: []
  }
  if(!type) return grid
  var rotMap
  //Accommodate for additional params:
  if(type == 'Rogue') {
    rotMap = new ROT.Map[type](height, width)
    //This map type has a special randomize function:
    rotMap.randomize(0.5)
  }
  if(type == 'Cellular') {
    rotMap = new ROT.Map[type](width, height)
    //This map type has a special randomize function:
    rotMap.randomize(0.3)
  }    
  else if(type == 'Digger') {
    rotMap = new ROT.Map[type](height, width, { dugPercentage : 0.9 })
  }
  else if(type == 'Uniform') {
    rotMap = new ROT.Map[type](height, width, { roomDugPercentage: 0.9 })
  }
  else {
    rotMap = new ROT.Map[type](height, width)
  }
  var cellCount = 0;
  rotMap.create(function(x, y, value) {
    //For each value generated by rotMap, spit out a block:
    var blockEnty = {
      group: 'block',
      cell: cellCount,
      passable : false
    }
    if(value) grid.enties.push(blockEnty)
    cellCount++;
  })
  return grid;
}

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

gg.insertEnty = function(grid, cellOrEnty, group, css, extras) {
  //(obj, int, str, arr, obj)

  var enty
  //If the second param is an object, it's already an enty object:
  if(_.isObject(cellOrEnty)) {
    enty = cellOrEnty
  } else {
    enty = { //Otherwise create an enty object from the params:
      group: group,
      cell: cellOrEnty
    }
  }
  //Convert to linear number if an array ([row,col]) was provided as cell: 
  if(_.isArray(enty.cell)) enty.cell = gg.xy(grid, enty.cell)
    
  //Apply any additional properties:
  if(extras) enty = _.extend(enty, extras )

  //Merge/add CSS:
  if(css) enty.css = enty.css.concat( css )

  enty = this.indexIt(grid, enty)
  grid.enties.push(enty)
  return grid
}

gg.removeEnty = function(grid, cellOrEnty) {
  var enty
  //Find the enty based on the cell
  if( _.isNumber(cellOrEnty)) {
    var entyOrEnties = gg.examine(grid.enties, cellOrEnty)

    //Accommodate for array result:       
    if( _.isArray(entyOrEnties)) enty = entyOrEnties[0]
    else enty = entyOrEnties

  } else if( _.isObject(cellOrEnty)) {
    console.log('is object')
    enty = cellOrEnty

  } else if(_.isString(cellOrEnty)) {
    console.log('is a string')
    //remove the enty based on that string 
    enty = _.findWhere(grid.enties, { _id : cellOrEnty })
    console.log('TARGET ENTRY')
  } else if(_.isUndefined(cellOrEnty) || _.isNull(cellOrEnty) ) {
    console.log('is undefined or null or a string')
    console.log('gg error (gg.removeEnty): No valid cell or enty provided.  This is what was provided: ')
    console.log(cellOrEnty)
    return
  }
  grid.enties = _.without(grid.enties, enty)

  //Update the counter for the group... though not sure why not just use length... maybe axe counter feature

  return grid
}

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

gg.populateCells = (grid, fill) => {
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

gg.xyToIndex = (grid, param1, param2) => {
  var row, col //<^ Accept either an array [row,col] or row, col as plain numbers
  if(_.isArray(param1)) {
    row = param1[0]
    col = param1[1]
  } else {
    row = param1
    col = param2
  }
  //Return the cell num: 
  var xy = ArrayGrid(grid.cells, [grid.width, grid.height]).index(row,col)
  return xy
}

gg.indexToXy = (grid, index) => {
  var x = math.floor( index / grid.width ), 
      y = math.floor( index % grid.width )
  return [x, y]
}

gg.xyCells = (grid) => {
  grid.cells.forEach((cell, index) => {
    cell.xy = gg.indexToXy(grid,index)
  })
  return grid
}

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
    //if( gg.nextRow(grid, nextCell).enties ) 
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
    enty.xy = gg.indexToXy(oldGrid, enty.cell)
    return enty
  })

  //create a blank new, larger grid: 
  var newGrid = gg.createGrid(oldGrid.height + 1 , oldGrid.width + 1)

  //apply original x and y coordinates; correcting cell numbers: 
  newGrid.enties = _.chain(oldGrid.enties).clone().map((enty) => {
    var cellNum = gg.xyToIndex(newGrid, enty.xy)
    enty.cell = cellNum  //^ update both the linear cell num and xy values: 
    enty.xy = gg.indexToXy(newGrid, cellNum)
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
  //Determine the xy then use that...
  if(_.isNumber(cell)) {
    if(gg.isEdge(grid, cell)) return null    
    var currentCellXy = gg.indexToXy(grid, cell)
    //Now simply subtract one cell from the x axis
    //(and return the cell number): 
    var westCellXy = [ currentCellXy[0], currentCellXy[1] -1 ]
    var westCellIndex = gg.xyToIndex(grid,westCellXy)
    return westCellIndex
  } else {
    throw 'a cell number (starting point) was not provided'
  }
}

gg.columnCells = (grid, cellOrXy) => {
  if(_.isUndefined(cellOrXy))
  //Return a range of cell numbers for the given column: 
  var targetColumn 
  if(_.isArray(cellOrXy)) targetColumn = cellOrXy[1]
  else targetColumn = gg.indexToXy(grid, cellOrXy)[1]
  var columnCells = []
  _.range(grid.height).forEach((row) => {
    columnCells.push( gg.xyToIndex(grid, [row, targetColumn]) )
  })
  return columnCells
}

gg.rowCells = (grid, cellOrXy) => {
  if(_.isUndefined(cellOrXy))
  //Return a range of cell numbers for the given row: 
  var targetRow
  if(_.isArray(cellOrXy)) targetRow = cellOrXy[0]
  else targetRow = gg.indexToXy(grid, cellOrXy)[0]
  var rowCells = []
  _.range(grid.width).forEach((column) => {
    rowCells.push( gg.xyToIndex(grid, [targetRow, column ]) )
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
  while(_.isUndefined(nextOpenColumn)) {
    if(_.isUndefined(nextCellToCheck)) nextCellToCheck = startCell
    var nextOpenCell = gg.nextOpenCell(grid, nextCellToCheck)
    var columnCells = gg.columnCells(grid, nextOpenCell)
    if( _.every(columnCells, (cell) => !gg.examine(grid, cell))) {
      nextOpenColumn = gg.indexToXy(grid, nextOpenCell)[1]
    } else {
      nextCellToCheck++
    }
  }
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
      nextOpenRow = gg.indexToXy(grid, nextOpenCell)[0]
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
  grid = gg.xyCells(grid)

  //Determine which row is our starting cell; and get all enties in target row: 
  var rowNum = gg.indexToXy(grid, startCell)[0], 
      targetRow = _.filter(grid.cells, (cell) => cell.xy[0] === rowNum )

  //Now iterate over it: 
  var openCells = 0
  targetRow.forEach((cell, index) => {
    if(!cell.enties.length) openCells++
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
  return gg.indexToXy(grid, cell)[0]
}

gg.column = (grid, cell) => {
  //Return the column of the given cell
  return gg.indexToXy(grid, cell)[1]
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
  debugger
  if( everyCellHasEnty ) return true 
  else return false
}
module.exports = gg
