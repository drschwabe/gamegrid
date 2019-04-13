# Game Grid
Game Grid is a library for creating 2D grid based games or apps.

### install

```javascript
var gg = require('game-grid')
```

### introduction

Some terminology/assumptions:

**grid**: This is the object which contains all of the interesting things

**enty (or enties)**: These are the 'interesting things' in your grid, typically defined by something that moves, is interactive or has some functionality.  Each enty has at least one property called `cell` which is used as the basis for its location within the grid.


## API
---------

**createGrid**  
`gg.createGrid(width, height)`  
Returns a grid object with the specified width and height.

```javascript
  gg.createGrid(3,3)
  //{ width: 3, height: 3, enties: [] }
```


**insert**  
`gg.insert(grid, cellOrEnty, label, extras)`  
Creates an enty inserted to specified cell with an optional object for extra properties.

```javascript
  gg.insert(myGrid, 2, 'hero')
```


**move**  
`gg.move(grid, enty, direction)`  

Move a given enty (an enty object or its label (string)) to the next adjacent cell in the given direction.

```javascript
  gg.move(myGrid,'hero', 'south')
  //hero is moved one row south in myGrid
```

Enty will not be moved destination cell is either beyond grid's edge (ie- bottom of map) or if the cell is occupied by an existing enty and said enty does not have `{ passable : true }`


### examine(grid, cell)
Returns the first enty in a given cell


### examineAll(grid, cell)
Returns an array of all enties in a given cell


### rcToIndex = (grid, row, column)
Converts a row/column pair to the equivalent array index (ie- as spread out in a single row)


### indexToRc = (grid, index)
Converts an index value (ie- cell number) to the equivalent row/column (array)
