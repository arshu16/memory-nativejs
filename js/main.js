var rows,
    column,
    defaultCardSize = 75, //This is in pixels
    cellValueFontSize = defaultCardSize / 2;
    defaultOffset = 20,
    gutterSize = 40;

/* -------- HELPERS ----------- */
Array.prototype.shuffle = function () {
  var i = this.length,
      j, temp;
  if (i === 0) return false;
  while (--i) {
      j = Math.floor(Math.random() * (i + 1));
      temp = this[i];
      this[i] = this[j];
      this[j] = temp;
  }
};

String.prototype.contains = function (it) {
  return this.indexOf(it) != -1;
};

var show = function (el) {
  if (el) {
    el.style.display = 'block';
  }
};
var hide = function (el) {
  if (el) {
    el.style.display = 'none';
  } 
};

function addClass(el, className) { 
  if (!el || el.className === null || hasClass(el, className)) {
    return;
  }
  el.className += ' ' + className + ' ';
}

function hasClass(el, className) {
    return el && el.className && el.className.contains(className);
}

function removeClass(el, className) {
    if (!el || !el.className) return;
    el.className = el.className.replace(className, '');
}

function toggleClass(el, className, tog) {
  var fnToCall = tog ? addClass : removeClass;
  fnToCall(el, className);
}

function createElement(type) {
    return document.createElement(type);
}

function generateCard(element, value, size) {
    element.style.width = element.style.height = size + 'px';
    var text = createElement('p');
    text.innerHTML = value;
    text.className = 'cell-text';
  element.appendChild(text);
}

function setBackgroundImage(element, url, size) {
    element.style.width = element.style.height = size + 'px';
  element.style.backgroundImage = 'url(' + url + ')';
  element.style.backgroundSize = size + 'px ' + size + 'px';
}

function inputChange(value, targetName) {
    switch(targetName) {
        case 'row':
            document.querySelector("input[name='columns']").value = value;
            break;
        case 'column':
            document.querySelector("input[name='rows']").value = value;
            break;
        default: 
            window.console.error('This should not happen');
    }
}

//Function to show form 
function showForm() {
    removeClass(document.querySelector('#grid-form'), 'hidden');
    addClass(document.querySelector('#grid-container'), 'hidden');
}

//Function to hide form
function hideForm() {
    addClass(document.querySelector('#grid-form'), 'hidden');
    removeClass(document.querySelector('#grid-container'), 'hidden');
}

function attachEvent(element, type, callback, context) {
    element.addEventListener(type, function(event){
        callback(event.currentTarget, context);
    });
}

function setName(name) {
    var nameElement = document.querySelector('#name');
    if(!name) {
        nameElement.innerHTML = '';
    } else {
        nameElement.innerHTML = 'Hi ' + name;
    }
    window.localStorage.name = name;
}

function getData(totalPairs) {
    var toBeReturned = [];
    for(var i = 1; i <= totalPairs; i++) {
        toBeReturned.push(i);
        toBeReturned.push(i);
    }
    toBeReturned.shuffle();
    return toBeReturned;
}

function storeGame(game) {
    if(!game) {
        return;
    }
    window.localStorage.game = JSON.stringify(game);
}

/* -------- HELPERS END ------- */


//submit function for the grid form
function handleSubmit(e) {
    if(!e) {
        return;
    }
    e.preventDefault();
    rows = +e.target[1].value;
    columns = +e.target[2].value;
    //If rows not equal to columns or rows and columns not even, show error
    if(rows !== columns || (rows === columns &&  rows % 2 !== 0)) {
        toggleClass(document.querySelector('.error'), 'hidden', false);
        return;
    }
    toggleClass(document.querySelector('.error'), 'hidden', true); //Remove any previous error shown
    setName(e.target[0].value); //Set the name which was entered
    initGame(); //Init the game
}

function initGame(game) {
    hideForm(); //Hide the form and show the grid container 
    if(game) {
        continueGame(game); //Continue game if we have it stored or start a new one
    } else {
        startGame();
    }
}

function continueGame(game) {
    setSize(game.rows); //Contain the matrix inside the view width wise
    var memoryGame = new GameClass({
        boardId: 'grid-container',
    rows: game.rows,
    columns: game.columns,
    data: game.data,
    missingPairs: game.missingPairs,
    alreadyValid: game.alreadyValid
    });
    memoryGame.init();
    centerMatrix(memoryGame.rows);
}

function startGame() {
    setSize(rows);
    var totalPairs = rows * columns / 2,
        data = getData(totalPairs),
        memoryGame = new GameClass({
            boardId: 'grid-container',
            rows: rows,
            columns: columns,
            data: data
        });
    memoryGame.init();
    centerMatrix(columns);
    storeGame(memoryGame);
}

//This function changes the default card size when the matrix cannot the view width wise
//and sets the font size of cell value according to the size
function setSize(size) {
    var totalWidth = (size * (defaultCardSize + defaultOffset));
    var widthFactor = ( totalWidth / window.innerWidth);
    if(widthFactor > 1) { //If the matrix is larger lower the size of card 
        defaultCardSize = ((window.innerWidth - gutterSize) / size) - defaultOffset;
        cellValueFontSize = defaultCardSize / 2;
    }
}

//function to center the matrix
function centerMatrix(columns) {
    var totalWidth = (columns * (defaultCardSize + defaultOffset));
    var widthFactor = ( totalWidth / window.innerWidth);
    var translateX = 50 - ( (widthFactor * 100) / 2);
    window.setTimeout(function(){
        document.querySelector('#grid-container').style.transform = 'translateX(' + translateX + '%)';
    });
}

function GameClass(options) {
  this.rows = options.rows;                            
  this.columns = options.columns;                           
  this.cardSize = options.cardSize || defaultCardSize;                
    this.defaultBackground = 'assets/uc-icon.png';
  this.data = options.data;                                
    this.flipTimeout = options.flipTimeout || 900;  
  this.board = document.querySelector('#' + options.boardId);
  this.missingPairs = options.missingPairs || null;
  this.alreadyValid = options.alreadyValid || [];

  this.init = function () {
    var game = this;
    game.numPairs = game.data.length / 2;
    game.moves = 0;
    game.selectedCard = null;
    game.missingPairs = game.missingPairs || game.numPairs;
    game.drawCards(this.data);
  };

  this.drawCards = function (cells) {
    var game = this;

    var createDOMCard = function (cell) { 
        var front = createElement('div');
        addClass(front, 'front flex');
        generateCard(front, cell, game.cardSize);
        var tick = createElement('span');
        tick.innerHTML = '&#10003;'; //Check unicode
        tick.className = 'tick hidden';
        front.appendChild(tick);
        var back = createElement('div'); 
        addClass(back, 'back');
        addClass(back, 'back-cell-value');
        setBackgroundImage(back, game.defaultBackground, game.cardSize);
        attachEvent(back, 'click', game.clickCard, game);
        var card = createElement('div');
        addClass(card, 'card');
        addClass(front, 'frontX faceX');
        addClass(back, 'backX faceX');
        addClass(card, 'cardX flippedX');
        card.appendChild(front);
        card.appendChild(back);
        card.value = cell;
        card.style.fontSize = cellValueFontSize + 'px';
        if(game.alreadyValid.indexOf(card.value) > -1) {
            toggleClass(card, 'flippedX', false);
            removeClass(card.querySelector('.tick'), 'hidden');
        }
        return card;
    };

    matrixCells = [];
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        matrixCells.push(createDOMCard(cell)); 
    }

    game.board.innerHTML = '';
    var X_OFFSET = defaultOffset, Y_OFFSET = defaultOffset;
    for (var j = 0; j < matrixCells.length; j++) {
        var card = matrixCells[j];
        var rowNum = Math.floor(j / game.rows);
        card.style.top = rowNum * (game.cardSize + Y_OFFSET) + 'px';
        card.style.left = (j % game.rows) * (game.cardSize + X_OFFSET) + 'px';
        game.board.appendChild(card);
    }
  };

  this.clickCard = function (back, game) {
    var card = back.parentElement;
    game.flipCard(card, true); 

        if (!game.selectedCard) {
            game.selectedCard = card;
            return;   
        }

        if (game.isValidPair(game.selectedCard, card)) {
            game.alreadyValid.push(card.value);
            game.missingPairs--;
            game.checkFinish();
            removeClass(game.selectedCard.querySelector('.tick'), 'hidden');
            removeClass(card.querySelector('.tick'), 'hidden');
            game.selectedCard = null;
            storeGame(game);
        } else {    
            if (game.flipping) { 
                game.flipCard(game.selectedCard, false);
                game.selectedCard = null;
                game.flipping = false;
            }
            game.flipping = true;
            window.setTimeout(function() { 
                game.flipCard(game.selectedCard, false);
                game.flipCard(card, false);
                game.selectedCard = null;
                game.flipping = false;
            } , game.flipTimeout);
        }
  };

  this.flipCard = function (card, toggle) {
      if (!card) return;
      toggleClass(card, 'flippedX', !toggle);
  };

  this.isValidPair = function (a, b) {
      return a && b && a.value === b.value;
  };

  this.checkFinish = function () {
      var game = this;
      if (game.missingPairs <= 0) {
        alert('You Won');
        setName();
        showForm();
        window.localStorage.removeItem('game');
      }
  };
}

//Equivalent to jquery dom ready
document.addEventListener("DOMContentLoaded", function(event) { 
    var game = window.localStorage.game ? JSON.parse(window.localStorage.game) : null;
    if(game && game.missingPairs) {
        setName(window.localStorage.name);
        hideForm();
        initGame(game);
    } else {
        setName();
        document.getElementById('grid-form').addEventListener('submit', handleSubmit);
        showForm();
    }
});