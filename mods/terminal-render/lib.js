const _ = require('underscore')

module.exports = (gg) => {
  gg._render = true
  gg.render = (grid) => {
    if(!grid) grid = gg._grid
    console.log('')
    grid = gg.populateCells(grid)
    //chunk the grid into smaller arrays (each array a row)
    var rows = _.chunk(grid.cells, grid.width)
    var cellCount = 0
    //loop over each row:
    rows.forEach((row, rowIndex) => {
      var output
      row.forEach((cell, colIndex) => {
        if(colIndex == 0) output = '[ '
        if(cell.enties.length) {
          cell.enties.forEach((enty) => {
            output = output + ` ${enty.label} `
          })
        } else {
          output = output + ` . `
        }
        cellCount++
      }) //output the value of the row:
      console.log(output + ' ]')
    })
    console.log('')
    return 
  }
  return gg
}
