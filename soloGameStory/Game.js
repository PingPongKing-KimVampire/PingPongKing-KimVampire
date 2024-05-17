import Ball from './Ball.js';
import Paddle from './Paddle.js';

class Game {
	constructor() {
		const board = document.querySelector('#playBoard');
		const subBoard = document.querySelector('.subPlayBoard:nth-of-type(2)');
		this.portraitQuery = window.matchMedia('(orientation: portrait');
		this.orientation = this.portraitQuery.matches ? 'portrait' : 'landscape';
		this.ball = new Ball(board, this.orientation);
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
				this.ball.init(this.orientation);
		})
	}

	startGame() {
		this.isPlaying = true;
		this.isMyTurn = true;
		this.ball.init(this.orientation);
		this.ballMoveIntervalID = setInterval(this.moveBall.bind(this), 1);
	}

	stopGame() {
		this.isPlaying = false;
		clearInterval(this.ballMoveIntervalID);
		this.ball.init(this.orientation);
	}

	moveBall() {
		this.ball.move(this.orientation);
		this.ball.detectWall(this.orientation);
		if (this.isMyTurn) {
			this.ball.detectPaddle(this.orientation);
		}
	}

	changeOrientation(e) {
		this.orientation = e.matches ? 'portrait' : 'landscape';
		this.ball.swapDirection();
		this.ball.display(this.orientation);
		this.paddle.display();
	}
}

const gameInstance = new Game();

export default gameInstance;