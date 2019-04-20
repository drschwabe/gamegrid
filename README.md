# Game Grid
Game Grid is a library for creating 2D grid based games or apps.

### install

```javascript
var gg = require('game-grid')
```

### introduction

Some terminology/assumptions:

**grid**: This is the object which contains all of the interesting things

**enty (or enties)**: These are the 'interesting things' in your grid, typically defined by something that has information, moves, is interactive or has some other  functionality.  Each enty has at least one property called `cell` which is used as the basis for its location within the grid.  


## API
---------

**createGrid**  
`gg.createGrid(width, height)`  
Returns a grid object with the specified width and height.

```javascript
gg.create(3,3)

  [  .  .  .  ]
  [  .  .  .  ]
  [  .  .  .  ]

  //{ width: 3, height: 3, enties: [] }
```


**insert**  
`gg.insert(grid, label, cellOrEnty, extras)`  
Creates an enty inserted to specified cell with an optional object for extra properties.

```javascript
gg.insert('h', 1)

  [  .  h  .  ]
  [  .  .  .  ]
  [  .  .  .  ]

  //{ width: 3, height: 3, enties: [ { label: 'h', cell: 1 } ] }
```


**move**  
`gg.move(enty, direction)`  

Move a given enty (an enty object or its label `string`) to the next adjacent cell in the given direction.

```javascript
gg.move('h', 'south')

  [  .  .  .  ]
  [  .  h  .  ]
  [  .  .  .  ]
```

Enty will not be moved if destination cell is either beyond grid's edge (ie- bottom of map) or if the cell is occupied by an existing enty and said enty has property `{ passable : false }`


**examine**  
`gg.examine(enty)`  

Returns the first enty in a given cell.

```javascript
gg.examine(4)

  [  .  .  .  ]
  [  .  h  .  ]
  [  .  .  .  ]

  //{ label: 'h', cell: 4 }
```


**examineAll**  
`gg.examineAll(cell)`
Returns an array of all enties in a given cell


**indexToRc**  
`gg.indexToRc(cell)`  
Converts an index value (ie- cell number) to the equivalent row/column (array) value.

```javascript
  [  0  1  2  ]
  [  3  4  5  ]
  [  6  7  8  ]

gg.indexToRc(6)
//> [2, 0]
```


**rcToIndex**  
`gg.rcToIndex(row, column)`  
Converts a row/column pair to the equivalent array index (ie- as spread out in a single row)

```javascript
gg.rcToIndex(2, 0)
//> 6
```

### Tips & Hints

Note that all functions can also accept a grid as a parameter.  If a grid param is supplied a grid will be returned otherwise the default grid stored as `gg._grid` is updated (and the function returns `null`)
