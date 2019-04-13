# Game Grid
Game Grid is a library for creating 2D grid based games or apps.

Some terminology/assumptions:

**grid**: This is the object which contains all of the interesting things

**enty (or enties)**: These are the 'interesting things' in your grid, typically defined by something that moves, is interactive or has some functionality.  Each enty has at least one property called `cell` which is used as the basis for its location within the grid.

### install

```javascript
var gg = require('game-grid')
```



## API
---------

**createGrid**  
`gg.createGrid(width, height)`  
Returns a grid object with the specified width and height.

```javascript
  gg.createGrid(3,3)
  //{ width: 3, height: 3, enties: [] }
```

### move(grid, enty, direction)
Moves a given enty to the next adjacent cell in the given direction.


### examine(grid, cell)
Returns the first enty in a given cell


### examineAll(grid, cell)
Returns an array of all enties in a given cell


### rcToIndex = (grid, row, column)
Converts a row/column pair to the equivalent array index (ie- as spread out in a single row)


### indexToRc = (grid, index)
Converts an index value to the equivalent row/column
