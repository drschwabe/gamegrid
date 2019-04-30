var GG = require('../gg.js')

//extend gg with terminal-grid lib:
// gg = require('./lib.js')(gg)
// gg._render = true //< auto rendering

var separator = () => console.log('-------------')

var grid = new GG.grid(3,3)

grid._render = true

grid.render()

separator()

grid.insertEnty(3, 'H')
separator()

grid.move('H', 'east')
separator()

grid.remove(4)
