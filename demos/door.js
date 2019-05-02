const gg = require('../gg.js') 

var grid = new gg.grid(6,6) 

grid.render(true) 
grid.insert('h')

var grid2 = new gg.grid(3,3) 


grid.insert('d', { destination : grid2, destination_entry : 6 }, [4,0])

grid.move('h', 's')
grid.move('h', 's')
grid.move('h', 's')
grid.move('h', 's')

grid.enter('h') 