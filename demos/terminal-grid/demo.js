var gg = require('../../gg.js')
const _ = require('underscore')

//extend gg with terminal-grid lib:
gg = require('./lib.js')(gg)
gg._render = true //< auto rendering

var separator = () => console.log('-------------')

var grid = gg.createGrid(3,3)
gg._grid = grid
separator()

gg.insertEnty(3, 'H')
separator()

gg.move('H', 'east')
separator()

gg.remove(4)
