const test = require('tape')
const childProcess = require('child_process')
const _s = require('underscore.string')

test(`"terminal-render" mod's demo renders as expected`, (t) => {
  t.plan(2)

  //run the demo and collect output as a string:
  var output = childProcess.execSync('node ./demo.js').toString()

  //in the demo grids are separated with the below string:
  var grids = output.split('-------------')

  //The demo renders grids to terminal automatically, so during each of
  //these function calls during the demo (as noted below) a grid is generated...

  //var grid = gg.createGrid(3,3)
  var firstGridDotCount = _s.count( grids[0], '.')
  var firstGridEdgeCount = _s.count( grids[0], '[') + _s.count( grids[0], ']')

  t.equals( firstGridDotCount , 9, 'There are 9 dots representing 9 blank cells ' )
  t.equals( firstGridEdgeCount , 6, 'There are 6 brackets representing 6 edges')


})
