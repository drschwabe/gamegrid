# gg 
gg is a library for creating 2D grid based games or apps. 

Some terminology/assumptions: 

**grid**: This is the object which contains all of the interesting things

**enty (or enties)**: These are the 'interesting things' in your grid, typically defined by something that moves, is interactive or has some functionality.  Each enty has a property called `cell` which is used as the basis for its location within the grid. 

## API
---------

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


### rcToIndex = (grid, row, column)
Converts a row/column pair to the equivalent array index (ie- as spread out in a single row)


### indexToRc = (grid, index)
Converts an index value to the equivalent row/column
