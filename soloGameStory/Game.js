import Ball from './Ball.js';
import Paddle from './Paddle.js';

class Game {
	constructor() {
		const board = document.querySelector('#playBoard');
		const subBoard = document.querySelector('.subPlayBoard:nth-of-type(2)');
		this.portraitQuery = window.matchMedia('(orientation: portrait');
		this.isPortrait = this.portraitQuery.matches;
		this.ball = new Ball(board, this.isPortrait);
		console.log(this.ball);
		this.paddle = new Paddle(subBoard);
		this.isPlaying = false;
		this.isMyTurn = true;
		this.ballMoveIntervalID = null;
		this.addEventListeners();
	}

	addEventListeners() {
		document.body.addEventListener('mousedown', () => {
			if (this.isPlaying) {
				this.stopGame();
			} else {
				this.startGame();
			}
		});
		this.portraitQuery.addEventListener('change', this.changeOrientation.bind(this));
		window.addEventListener('resize', () => { // TODO : 필요할까?
			if (!this.isPlaying)
				this.ball.init();
		})
	}

	startGame() {
		this.isPlaying = true;
		this.isMyTurn = true;
		this.ball.init(this.isPortrait);
		this.ballMoveIntervalID = setInterval(this.moveBall.bind(this), 1);
	}

	stopGame() {
		this.isPlaying = false;
		clearInterval(this.ballMoveIntervalID);
		this.ball.init(this.isPortrait);
	}

	moveBall() {
		// console.log('moveBall');
		this.ball.move(this.isPortrait);
		this.ball.detectWall(this.isPortrait);
		if (this.isMyTurn) {
			this.ball.detectPaddle(this.isPortrait);
		}
	}

	changeOrientation(e) {
		this.isPortrait = e.matches;
		this.ball.swapDirection();
		this.ball.display(this.isPortrait);
		this.paddle.display();
	}
}

const gameInstance = new Game();

export default gameInstance;