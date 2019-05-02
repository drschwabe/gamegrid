![gamegrid logo](./logo.svg)

a library for creating 2D grids for games (or apps)

### install

```javascript
const gg = require('gamegrids')
//don't forget the 's'     ^
```

### introduction

*Some terminology...*

**gg**: This is the library

**grid**: This is your grid, you put interesting things in it

(you can optionally combine library & grid into one object by instantiating a var with `new gg.grid(width, height)`)

**enty (or enties)**: These are the interesting things in your grid, typically defined by something that has information, moves, is interactive or has some other functionality you give it (p.s. - you still have to do most of the work).  Each enty has at least one property called `cell` which is used as the basis for its location within the grid.  


## API
---------

**grid**
`new gg.grid(width, height)`  
Instantiates a new grid, passes arguments to gg.create (below)
```javascript
var grid = new gg.grid(3,3)
```

**create**  
`gg.create(width, height)`  
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

#### TODO
- finish documentation (check the library for other functions/features not yet documented)
- fully integrate portable API with all functions (may or may not work in some situations)
- write tests for functions that are not yet tested
- write more tests for functions that are not thoroughly tested
- world domination

#### Tips & Hints  

Functions can also accept a grid as a parameter.  If a grid param is supplied a grid will be returned.  

Otherwise the instance/portable API will be modified in place.

Ex:
```javascript
//portable API / grid in one deal:
var grid = new gg.grid(6,6)
grid.insert('hero')
var grid2 = new gg.grid(12,12)
grid2.insert('zombie')
//(there is a hero in grid one but not grid2)

//alternatively, use functional style:
var grid = gg.create(6,6)
grid = grid.insert('hero')
var grid2 = gg.create(12,12)
grid2 = gg.insert('zombie')
```
