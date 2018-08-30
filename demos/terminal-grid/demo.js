const gg = require('../../gg.js')
const _ = require('underscore')

var grid = gg.createGrid(6,6)

var renderGrid = (grid) => {
  grid = gg.populateCells(grid)
  //chunk the grid into smaller arrays (each array a row) 
  var rows = _.chunk(grid.cells, 6)
  var cellCount = 0
  //loop over each row: 
  rows.forEach((row, rowIndex) => {
    var output
    row.forEach((cell, colIndex) => {
      if(colIndex == 0) output = '[' 
      if(cell.enties.length) {
        cell.enties.forEach((enty) => {
          output = output + ` ${enty.name} `
        })
      } else {
        output = output + ` ${ cellCount }, `
      }
      cellCount++ 
    }) //output the value of the row: 
    console.log(output + ' ]')          
  })
}

renderGrid(grid)
