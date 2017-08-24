let model = {

  grid: [],
  rowsValid: [],
  colsValid: [],
  subgridsValid: [],

  transpose: function(grid) {
    let t = grid[0].map(function(col, i) {
      return grid.map(function(row) {
        return row[i];
      });
    });
    return t;
  },

  checkRow: function(row) {
    let nums = new Array(9).fill(0);
    for (item of row) {
      if (item) {
        nums[item-1] += 1
        if (nums[item-1] > 1) {
          return false;
        }
      }
      else {
        return false;
      }
    }
    return true;
  },

  checkGrid: function(grid, objStr) {
    this[objStr] = grid.map(row => this.checkRow(row));
  },

  checkSubgrid: function(grid, subgridIdx) {
    let newRow = [];
    let row = Math.floor(subgridIdx/3)*3;
    let col = (subgridIdx%3)*3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        newRow.push(grid[row+i][col+j]);
      }
    }
    return this.checkRow(newRow);
  },

  checkSubgrids: function(grid) {
    this.subgridsValid = [...Array(9).keys()].map(subgridIdx => this.checkSubgrid(grid, subgridIdx));
  },

  rowIds: function(idx) {
    return [...Array(9).keys()].map(j => idx*9 + j);
  },

  colIds: function(idx) {
    return [...Array(9).keys()].map(i => i*9 + idx);
  },

  subgridIds: function(idx) {
    let ids = [];
    let row = Math.floor(idx/3)*3;
    let col = (idx%3)*3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ids.push((row+i)*9 + (col+j));
      }
    }
    return ids;
  },

  checkResult: function() {
    return (this.rowsValid.indexOf(false) == -1 &&
            this.colsValid.indexOf(false) == -1 &&
            this.subgridsValid.indexOf(false) == -1);
  },

  sudokuCheck: function(grid) {
    this.checkGrid(grid, 'rowsValid');
    this.checkGrid(this.transpose(grid), 'colsValid');
    this.checkSubgrids(grid);
  }

};

let view = {

  applyTileBorder: function(tile, x, y) {
    let axesBorders = [[x,'borderLeft','borderRight'],[y,'borderTop','borderBottom']];
    for (let item of axesBorders) {
      if (item[0] === 0) {
        tile.style[item[1]] = 'none';
      }
      else if (item[0] === 8) {
        tile.style[item[2]] = 'none';
      }
      else if (item[0]%3 === 0) {
        tile.style[item[1]] = '1px solid black';
      }
      else if (item[0]%3 === 2) {
        tile.style[item[2]] = '1px solid black';
      }
    }
  },

  makeTile: function(array, x, y) {
    let tile = document.createElement('div');
    tile.className = 'tile';
    tile.id = `${y*9 + x}`;
    tile.style.width = `${100/9}%`;
    tile.style.height = `${100/9}%`;
    tile.innerHTML = (array[y][x] > 0 ) ? `${array[y][x]}` : '';
    this.applyTileBorder(tile, x, y);
    return tile;
  },

  updateDisplay: function(array) {
    let gridDisplay = document.querySelector('.grid-display');
    gridDisplay.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        let tile = this.makeTile(array, j, i);
        gridDisplay.appendChild(tile);
      }
    }
    controller.buttonLock = false;
  },

  sleep: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  clearTileBackgrounds: function() {
    for (element of document.getElementsByClassName("tile")) {
      element.style.backgroundColor = 'transparent';
    }
  },

  fadeOut: function(element) {
    let tick = function () {
      element.style.opacity = +element.style.opacity - 0.02;
      if (+element.style.opacity > 0) {
        (window.requestAnimationFrame && requestAnimationFrame(tick)) ||
          setTimeOut(tick, 16);
      }
      else {
        controller.buttonLock = false;
      }
    };
    tick();
  },

  fadeIn: function(element) {
    let tick = function () {
      element.style.opacity = +element.style.opacity + 0.02;
      if (+element.style.opacity < 1) {
        (window.requestAnimationFrame && requestAnimationFrame(tick)) ||
          setTimeOut(tick, 16);
      }
    };
    tick();
  },

  fadeOverlay: async function() {
    let overlay = document.querySelector('.result-overlay-text');
    if (model.checkResult()) {
      overlay.style.backgroundColor = '#009600';
      overlay.innerHTML = 'CORRECT';
    }
    else {
      overlay.style.backgroundColor = '#D70000';
      overlay.innerHTML = 'INCORRECT';
    }
    this.fadeIn(overlay);
    await this.sleep(1500);
    this.fadeOut(overlay);
  },

  animateResult: async function() {
    let idFunc;
    let validArr;
    for (let grouping of ['row', 'col', 'subgrid']) {
      idFunc = model[`${grouping}Ids`];
      validArr = model[`${grouping}sValid`];
      for (let idx of [...Array(9).keys()]) {
        for (tileId of idFunc.call(this, idx)) {
          document.getElementById(tileId).style.backgroundColor = validArr[idx] ? 'rgba(0,150,0,0.65)' : 'rgba(255,0,0,0.65)';
        }
        await this.sleep(100);
      }
      await this.sleep(200);
      this.clearTileBackgrounds();
    }
    await this.sleep(100);
    this.fadeOverlay();
  },

};

let controller = {

  buttonLock: false,

  init: function() {

      const defaultGrid = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
      ];

      document.querySelector('.grid-text-input').value = JSON.stringify(defaultGrid).replace(/],/g,'],\n');
      model.grid = this.strToGrid(document.querySelector('.grid-text-input').value);
      view.updateDisplay(model.grid);
      this.bindUpdate();
      this.bindCheck();

  },

  strToGrid: function(str) {
    str = (str.replace(/\D+/g, '') + '0'.repeat(81)).slice(0,81);
    let grid = [];
    let row = [];
    for (let i = 0; i < 81; i++) {
      row.push(parseInt(str[i]));
      if ((i+1)%9 === 0) {
        grid.push(row);
        row = [];
      }
    }
    return grid;
  },

  bindUpdate: function() {
    document.querySelector('.btn-update').addEventListener('click', function(e) {
      if (controller.buttonLock) {
        return;
      }
      controller.buttonLock = true;
      model.grid = controller.strToGrid(document.querySelector('.grid-text-input').value);
      view.updateDisplay(model.grid);
    });
  },

  bindCheck: function() {
    document.querySelector('.btn-check').addEventListener('click', function(e) {
      if (controller.buttonLock) {
        return;
      }
      controller.buttonLock = true;
      model.sudokuCheck(model.grid);
      view.animateResult();
    });
  }

};

controller.init();
