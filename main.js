const cell_num = 25
const max_layer_num = 4
const consecutives = (max) => Array.from(Array(max).keys())
const board_color = d3.scaleOrdinal(d3.schemeGreens[9].slice(4)).domain(consecutives(max_layer_num))

let board_data = Array(cell_num).fill(0)
let board = d3.select("#board")
let cells = board.selectAll("div")
  .data(board_data)
  .join(
    enter => enter.append("div")
      .classed("cell", true)
  )
const nodes = cells.nodes()
const update = () => {
  cells.data(board_data)
    .join(
      enter => enter.append("div")
        .classed("cell", true),
      update => update.style("background-color", d => board_color(d))
    )
}
update()

const player_num  = 2 //up to 4
const player_colors = ["Crimson", "RoyalBlue"]
const player_color_names = ["Red", "Blue"]
let player_pos = [[6, 18], [8, 16]]
const update_player = () => {
  nodes.forEach(n => {
    for (let p = 0; p < player_num; p++) {
      d3.select(n).classed("player" + p, false)
    }
  })
  player_pos.forEach((player, i) => {
    player.forEach(p => {
      d3.select(nodes[p]).classed("player" + i, true)
    })
  })
}
update_player()

const actionables = (i) => {
  let list = []
  if (i >= 5) list.push(i-5) // not top row
  if (i < 20) list.push(i+5) // not bottom row
  if (i % 5 != 0) list.push(i-1) // not leftmost row
  if (i % 5 != 4) list.push(i+1) // not rightmost row
  if (i >= 5 && i % 5 != 0) list.push(i-6)
  if (i >= 5 && i % 5 != 4) list.push(i-4)
  if (i < 20 && i % 5 != 0) list.push(i+4)
  if (i < 20 && i % 5 != 4) list.push(i+6)
  return list
}
const highlight = (nodes, list) => {
  cells.style("border", "none")
  list.forEach(i => {
    d3.select(nodes[i]).style("border", "5px solid " + player_colors[turn])
  })
}
const minus = (A, B) => A.filter(x => !B.includes(x))
const indices = consecutives(cell_num)
const ready = (step, selected) => {
  let neighbors = []
  player_pos[turn].forEach(p => {
    if (selected === undefined || selected === p) {
      switch(step) {
        case 0: //move
          let forbidden = indices.filter(i => Math.abs(board_data[i] - board_data[p]) > 1)
          neighbors = neighbors.concat(minus(actionables(p), forbidden))
          break;
        case 1: //build
          neighbors = neighbors.concat(actionables(p))
          break;
      }
    }
  })
  neighbors = Array.from(new Set(neighbors))
  neighbors = minus(neighbors, player_pos.flat())
  neighbors = minus(neighbors, indices.filter(i => board_data[i] >= max_layer_num))
  highlight(cells.nodes(), neighbors)
  return neighbors
}

const step_names = ["move", "build"]
let turn = 0
let step = 0
let current_player_pos = -1
let neighbors = ready(step)
cells.on("click", function(event, d) {
  const click_idx = nodes.indexOf(this)

  if (step === 0 && player_pos[turn].includes(click_idx)) { //click player
    if (current_player_pos > 0) {
      d3.select(nodes[current_player_pos]).classed("selected", false)
    }
    d3.select(nodes[click_idx]).classed("selected", true)
    current_player_pos = click_idx

  } else if (current_player_pos >= 0 && neighbors.includes(click_idx)) { //click neighbors
    switch(step) {
      case 0: //move
        if (board_data[click_idx] === 3) { //winning condition
          console.log("congrats!")

        } else {
          const idx = player_pos[turn].indexOf(current_player_pos);
          if (idx > -1) {
            player_pos[turn].splice(idx, 1);
          }
          player_pos[turn].push(click_idx)
          update_player()

          d3.select(nodes[current_player_pos]).classed("selected", false)
          d3.select(nodes[click_idx]).classed("selected", true)
          current_player_pos = click_idx
        }
        break;
      case 1: //build
        board_data[click_idx]++
        update()

        turn = (turn + 1) % player_num

        d3.select(nodes[current_player_pos]).classed("selected", false)
        current_player_pos = -1
        break;
    }
    step = (step + 1) % 2
  }
  set_status()
  neighbors = ready(step, current_player_pos >= 0 ? current_player_pos : undefined)
})

const status = d3.select(".status")
const set_status = () => {
  status
    .style("color", player_colors[turn])
    .html(`<span class="bold">${player_color_names[turn]}</span> turn to <span class="bold">${step_names[step]}</span>`)
}
set_status()