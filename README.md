# gg #
gg is a library to help in the creation of 2D grid based games. 

Some terminology/assumptions: 

grid: This is the object which contains all of the interesting things (and their state) in your game. 
enties: These are the 'interesting things' in your game, typically defined by something that moves, is interactive or has some functionality. 
enty: Singular form of 'enties'.  Each enty has a property called cell which is used as the basis for it's location within the grid. 

optional: 
elems: These are custom DOM elements which correspond to enties, and have special functionality specific for rendering and browser-based interactions.  

### createGrid(width, height, type)
gg supports 2 aspect ratios: square or 16:10 (16:10 is WIP), you imply the aspect ratio with your width & height.

### isArrowKey(keyCode)
Returns true if an arrow key was pressed. 

### getDirection(keyCode)
Returns a string, North East South or West, from a given arrow key.

### move(grid, enty, direction)
Moves a given enty to the next adajcent cell in the given direction.


### examine(grid, cell)
Returns the first enty in a given cell 


### examineAll(grid, cell)
Returns an array of all enties in a given cell





