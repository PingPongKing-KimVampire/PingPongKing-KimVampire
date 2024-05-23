import Ball from './Ball.js';
import Paddle from './Paddle.js';

class GameManager {
	constructor() {
		this.isPlaying = false;
		this.isMyTurn = true;
		this.ballMoveIntervalID = null;
	}

	initialize() {
		this.portraitQuery = window.matchMedia('(orientation: portrait');
		this.orientation = this.portraitQuery.matches ? 'portrait' : 'landscape';
		const board = document.querySelector('#playBoard');
		const subBoard = document.querySelector('.subPlayBoard:nth-of-type(2)');
		this.paddle = new Paddle(subBoard);
		this.ball = new Ball(this, board);
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
		window.addEventListener('resize', () => {
			if (!this.isPlaying)
				this.ball.init();
		})
		this.portraitQuery.addEventListener('change', this.changeOrientation.bind(this));
	}

	startGame() {
		this.isPlaying = true;
		this.isMyTurn = true;
		this.ball.init();
		this.ballMoveIntervalID = setInterval(this.moveBall.bind(this), 1);
	}

	stopGame() {
		this.isPlaying = false;
		clearInterval(this.ballMoveIntervalID);
		this.ball.init();
	}

	moveBall() {
		this.ball.move();
		this.ball.detectWall();
		if (this.isMyTurn) {
			this.ball.detectPaddle();
		}
	}

	changeOrientation(e) {
		this.orientation = e.matches ? 'portrait' : 'landscape';
		this.ball.swapDirection();
		this.ball.display();
		this.paddle.display();
	}
}

export default GameManager;