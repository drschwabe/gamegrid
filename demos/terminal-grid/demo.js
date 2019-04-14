var gg = require('../../gg.js')
const _ = require('underscore')


//extend gg with terminal-grid lib:
gg = require('./lib.js')(gg)
gg._render = true //< auto rendering

var grid = gg.createGrid(3,3)
gg._grid = grid

gg.insertEnty(grid, 3, 'H')
gg.move(grid, 'H', 'east')
