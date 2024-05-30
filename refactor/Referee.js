import Ball from './Ball.js';

class Referee {
	constructor() {
		this.isPlaying = false;
		this.isMyTurn = true;
		this.ballMoveIntervalID = null;
		this.ball = new Ball();
		this.paddle = {
			y: 0,
			x: 0
		};
		this.boardWidth = 1550;
		this.boardHeight = 1000;
		this.paddleHeight = 150;
		this._initBall();
	}

	startGame(gameObjectRenderer) {
		if (this.isPlaying)
			return;
		this.isPlaying = true;
		this.isMyTurn = true;
		this._initBall();
		this.ballMoveIntervalID = setInterval(this._moveBall.bind(this, gameObjectRenderer), 1);
	}

	updatePaddlePosition(y, x) {
		this.paddle.y = y;
		this.paddle.x = x;
	}

	_initBall() {
		this.ball.xPos = this.boardWidth / 2;
		this.ball.yPos = this.boardHeight / 2;
		this.ball.angle = 20;
		this.ball.speed = 5;
		const dir = this._calculateBallDirection(this.ball.speed, this.ball.angle);
		this.ball.dx = dir.dx;
		this.ball.dy = dir.dy;
	}

	_calculateBallDirection(speed, angle) {
		const angleRadians = (angle * Math.PI) / 180;
		const dx = Math.cos(angleRadians) * speed;
		const dy = Math.sin(angleRadians) * speed;
		return { dx, dy };
	}

	_moveBall(gameObjectRenderer) {
		this.ball.yPos += this.ball.dy;
		this.ball.xPos += this.ball.dx;
		this._detectWall();
		if (this.isMyTurn === true)
			this._detectPaddle();
		gameObjectRenderer.renderBall();
	}

	_detectWall() {
		if (this.ball.xPos >= this.boardWidth) {
			// console.log('stop');
			this._stopGame();
			return;
		}

		if (this.ball.xPos <= 0) {
			this.isMyTurn = true;
			this.ball.dx = -this.ball.dx;
		}

		if (this.ball.yPos >= this.boardHeight || this.ball.yPos <= 0) {
			this.ball.dy = -this.ball.dy;
		}
	}

	_stopGame() {
		this.isPlaying = false;
		clearInterval(this.ballMoveIntervalID);
		this._initBall();
	}

	_detectPaddle() {
		const ballPrevX = this.ball.xPos - this.ball.dx;
		const ballNextX = this.ball.xPos;
		const ballPrevY = this.ball.yPos - this.ball.dy;
		const ballNextY = this.ball.yPos;
		if (ballPrevX <= this.paddle.x && this.paddle.x < ballNextX) {
			const firstXRatio = (this.paddle.x - ballPrevX) / (ballNextX - ballPrevX);
			const ballYDiff = ballNextY - ballPrevY;
			const collisionY = ballPrevY + firstXRatio * ballYDiff;
			if (this.paddle.y - this.paddleHeight / 2 <= collisionY && collisionY <= this.paddle.y + this.paddleHeight / 2) {
				this.ball.dx = -this.ball.dx;
			}
		}
	}

}

export default Referee;