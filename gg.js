(function() {

  var gg = {}

  // global on the server, window in the browser
  var root = this;

  // Node.js specific:
  if (typeof module !== 'undefined' && module.exports) {
    //Use Node modules: 
    var ROT = require('rot-js'),
        _ = require('underscore'), 
        uuid = require('node-uuid'), 
        math = require('mathjs')
  } else {
    //Use browser script tags: 
    var ROT = window.ROT,
        _ = window._,    
        uuid = window.uuid, 
        math = window.mathjs //not tested.
  }

  gg.isArrowKey = function(keyCode) {
    return _.contains([38, 39, 40, 37], keyCode)
  }

  gg.getDirection = function(keyCode) {
    if(keyCode == 38) return 'north'
    if(keyCode == 39) return 'east'
    if(keyCode == 40) return 'south'
    if(keyCode == 37) return 'west'
  }

  gg.move = function(grid, enty, direction) {
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

    //enty = gg.revise(enty) //Mark as revised so it's re-rendered next step.
    //console.log(enty._rev)
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
    if(enty.facing && enty.facing.passable === false) return enty //< (unchanged)

    //Check if we are in a doorway:
    //if(enty.facing && enty.facing.group == 'doorway') enty.inDoorway = true

    //Modify the enty's cell to simulate the movement:
    enty.cell = intendedPosition

    //Then update this enty's facing property again:
    enty.facing = this.examine( grid, nextCell(grid, enty, direction) )

    //Also update the direction enty is pointed:
    enty.direction = direction

    //Replace the current enty as is in current grid: 
    //grid = grid.replaceEnty(enty.cell, enty)

    //return enty 
    return grid
  }

  // gg.replaceEnty = function(grid, cell, enty) {
  //   _.findWhere(grid.enties, { cell: cell })
  // }

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

  gg.examine = function(grid, cell) {
    var entyOrEnties = _.where(grid.enties, { cell :  cell })    
    if(_.isUndefined(entyOrEnties)) return null
    if( entyOrEnties.length == 1 ) return entyOrEnties[0]
    return entyOrEnties //< Returns an array. 
  }

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
        //css : ['gray'],
        passable : false
      }
      if(value) grid.enties.push(blockEnty)
      cellCount++;
    })
    //Do an inventory of enties in the grid:
    // grid.enties.forEach(function(enty) {
    //   enty = gg.indexIt(grid, enty)
    // })
    //Each grid must have an exit...
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
    //Params: obj, int, str, arr, obj

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
    //Apply any additional properties:
    if(extras) enty = _.extend(enty, extras )
    //^^ Idea: hit an API-like function which can get extra data from a JSON file on the file system (API so that we can abstract the difference in handling for browser vs NW; browser needs a server where NW can just load the file direct)

    //Merge/add CSS:
    if(css) enty.css = enty.css.concat( css )

    enty = this.indexIt(grid, enty)
    grid.enties.push(enty)
    return grid
  }

  gg.removeEnty = function(grid, cellOrEnty) {
    var enty
    //console.log(cellOrEnty)
    //Find the enty based on the cell
    if( _.isNumber(cellOrEnty)) {
      console.log(grid.enties)     
      var entyOrEnties = gg.examine(grid.enties, cellOrEnty)
      //TODO: Test this to make sure it works after these changes were made: 
      //Accommodate for array result:       
      if( _.isArray(entyOrEnties)) enty = entyOrEnties[0]
      else enty = entyOrEnties
      // /changes 
      console.log('Number lookup yielded this enty:')
      console.log(enty)
    } else if( _.isObject(cellOrEnty)) {
      enty = cellOrEnty
      // console.log('Supplied an enty:')
      // console.log(enty)
    } else if(_.isUndefined(cellOrEnty) || _.isNull(cellOrEnty)) {
      console.log('gg error (gg.removEnty): No valid cell or enty provided.  This is what was provided: ')
      console.log(cellOrEnty)
      return
    }
    grid.enties = _.without(grid.enties, enty)
    return grid
  }

  //Returns an array of cell numbers representing a region of the grid:
  gg.makeRegion = function(grid, startCell, width, height) {
    var region = []
    //var endCell = Math.round(startCell * grid.width * (height -1) / 36) //< Whoa math!
    var endCell = Math.round(63 * grid.width * (height -1) / 36) //< 63 seems to be the magic number.

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


  // gg.findEnty = function(grid, enty) {
  //   //Find the player...
  //   var playerEnty = _.findWhere(GS.localGrid.enties, { player_number : 0 })    
  // }


  // Node.js specific:
  if (typeof module !== 'undefined' && module.exports) {
      module.exports = gg
  }
  // Otherwise, it's included directly via <script> tag (browser)
  else {
      root.gg = gg
  }
}());
