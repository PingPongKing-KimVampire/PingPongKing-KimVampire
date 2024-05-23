import Ball from './Ball.js';
import Paddle from './Paddle.js';

class GameManager {
	constructor() {
		this.isPlaying = false;
		this.isMyTurn = true;
		this.ballMoveIntervalID = null;
		this.WHRatio = 155 / 100; // gameContainer의 너비 대 높이 비율 (portrait에선 높이 대 너비)
		this.VCPercent = 90; // 뷰포트 기준 gameContainer의 퍼센테이지
	}

	initialize() {
		this.gameContainer = document.querySelector('#gameContainer');
		this.portraitQuery = window.matchMedia('(orientation: portrait');
		this.orientation = this.portraitQuery.matches ? 'portrait' : 'landscape';
		this.updateGameContainerRatio();
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
		window.addEventListener('resize', this.updateGameContainerRatio.bind(this));
		this.portraitQuery.addEventListener('change', this.changeOrientation.bind(this));
	}

	updateGameContainerRatio() {
		if (this.orientation === 'portrait') {
			// 뷰포트 높이가 너비에 비해 일정 수준 이상 작아짐 -> 뷰포트 높이 기준
			if (window.innerHeight / window.innerWidth < this.WHRatio) {
				this.gameContainer.style.height = `${this.VCPercent}vh`;
				this.gameContainer.style.width = `${this.VCPercent / this.WHRatio}vh`;
			} else { // 뷰포트 높이가 충분함 -> 뷰포트 너비 기준
				this.gameContainer.style.width = `${this.VCPercent}vw`;
				this.gameContainer.style.height = `${this.VCPercent * this.WHRatio}vw`;
			}
		} else {				// landscape
			// 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
			if (window.innerWidth / window.innerHeight < this.WHRatio) {
				this.gameContainer.style.width = `${this.VCPercent}vw`;
				this.gameContainer.style.height = `${this.VCPercent / this.WHRatio}vw`;
			} else { // 뷰포트 너비가 충분함 -> 뷰포트 높이 기준
				this.gameContainer.style.height = `${this.VCPercent}vh`;
				this.gameContainer.style.width = `${this.VCPercent * this.WHRatio}vh`;
			}
		}
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
		this.updateGameContainerRatio();
		if (!this.isPlaying) {
			this.ball.init();
		} else {
			this.ball.swapDirection();
			this.ball.display();
		}
		this.paddle.display();
	}
}

export default GameManager;