const test = require('tape')
const childProcess = require('child_process')
const _s = require('underscore.string')

test(`"terminal-render" mod's demo renders as expected`, (t) => {
  t.plan(5)

  //run the demo and collect output as a string:
  var output = childProcess.execSync('node ./demo.js').toString()

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
