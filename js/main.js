var rows,
		column,
		defaultCardSize = 75, //This is in pixels
		defaultOffset = 20;

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
};

function hasClass(el, className) {
    return el && el.className && el.className.contains(className);
};

function removeClass(el, className) {
    if (!el || !el.className) return;
    el.className = el.className.replace(className, '');
};

function toggleClass(el, className, tog) {
    tog ? addClass(el, className) : removeClass(el, className);
};

//submit function for the grid form
function handleSubmit(e) {
	if(!e) {
		return;
	}

	e.preventDefault();
	rows = +e.target[0].value;
	columns = +e.target[1].value;
	if(rows !== columns || (rows === columns &&  rows % 2 !== 0)) {
		toggleClass(document.querySelector('.error'), 'hidden', false);
		return;
	}
	toggleClass(document.querySelector('.error'), 'hidden', true);
	initGame();
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

function initGame() {
	addClass(document.querySelector('#grid-form'), 'hidden');
	removeClass(document.querySelector('#grid-container'), 'hidden');
	var totalPairs = rows * columns / 2,
		data = getData(totalPairs),
		memoryGame = new GameClass({
	    boardId: 'grid-container',
	    rows: rows,
	    columns: columns,
	    data: data
	}),
	translateX = 50 - ( (((columns * (defaultCardSize + defaultOffset)  ) / window.innerWidth) * 100) / 2);
	memoryGame.init();
	window.setTimeout(function(){
		document.querySelector('#grid-container').style.transform = 'translateX(' + translateX + '%)';
	});
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

function createElement(type) {
    return document.createElement(type);
};

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

var GameClass = function (options) {
  this.rows = options.rows;                            
  this.colums = options.columns;                           
  this.cardSize = options.cardSize || defaultCardSize;                
	this.defaultBackground = 'assets/uc-icon.png';
  this.data = options.data;                         
  // this.animate = options.animate && true;               
	this.flipTimeout = options.flipTimeout || 900;  
	// init
  this.board = document.querySelector('#' + options.boardId);

  /** Buscar os badges */
  this.init = function () {
    var game = this;
    game.numPairs = game.data.length / 2;
    game.moves = 0;
    game.selectedCard = null;
    game.missingPairs = game.numPairs;
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
			game.missingPairs--;
			game.checkFinish();
			removeClass(game.selectedCard.querySelector('.tick'), 'hidden');
			removeClass(card.querySelector('.tick'), 'hidden');
			game.selectedCard = null;
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
        removeClass(document.querySelector('#grid-form'), 'hidden');
        addClass(document.querySelector('#grid-container'), 'hidden');
      }
  };
};

function attachEvent(element, type, callback, context) {
	element.addEventListener(type, function(event){
		callback(event.currentTarget, context);
	});
}

//Equivalent to jquery dom ready
document.addEventListener("DOMContentLoaded", function(event) { 
	document.getElementById('grid-form').addEventListener('submit', handleSubmit);
});