import Ball from "./Ball.js";

class Referee {
  constructor() {
    this.isPlaying = false;
    this.isMyTurn = true;
    this.ballMoveIntervalID = null;
    this.paddle = {
      y: this.boardHeight / 2,
      x: this.boardWidth / 2 + this.boardWidth / 4,
    };
    this.boardWidth = 1550;
    this.boardHeight = 1000;
    this.gameContainerRatio = this.boardWidth / this.boardHeight;
    this.paddleHeight = 150;
    this.paddleWidth = 30;

    const ballFirstAngle = 20;
    const ballSpeed = 8;
    const ballRadius = 25;
    this.ball = new Ball(ballFirstAngle, ballSpeed, ballRadius);
    this.ball.initBall(this.boardWidth, this.boardHeight);
  }

  startGame(gameObjectRenderer) {
    if (this.isPlaying) return;

    this.startTime = new Date().getTime();

    this.isPlaying = true;
    this.isMyTurn = true;
    this.ball.initBall(this.boardWidth, this.boardHeight);
    this.ballMoveIntervalID = setInterval(
      this._moveBall.bind(this, gameObjectRenderer)
    );
  }

  updatePaddlePosition(y, x) {
    this.paddle.y = y;
    this.paddle.x = x;
  }

  _moveBall(gameObjectRenderer) {
    // 시간 측정
    let curTime = new Date().getTime();
    let elapsedTime = curTime - this.startTime;
    console.log("Elapsed time: " + elapsedTime + " ms");

    this.ball.yPos += this.ball.dy;
    this.ball.xPos += this.ball.dx;
    this._detectWall();
    if (this.isMyTurn === true) this._detectPaddle();
    gameObjectRenderer.renderBall();
  }

  _detectWall() {
    if (this.ball.getRightX() >= this.boardWidth) {
      this._stopGame();
      return;
    }

    if (this.ball.getLeftX() <= 0) {
      this.isMyTurn = true;
      this.ball.dx = -this.ball.dx;
    }

    if (
      this.ball.getBottomY() >= this.boardHeight ||
      this.ball.getTopY() <= 0
    ) {
      this.ball.dy = -this.ball.dy;
    }
  }

  _stopGame() {
    this.isPlaying = false;
    clearInterval(this.ballMoveIntervalID);
    this.ball.initBall(this.boardWidth, this.boardHeight);
  }

  _detectPaddle() {
    const ballPrevX = this.ball.getLeftX() - this.ball.dx;
    const ballNextX = this.ball.getRightX();
    const ballPrevY = this.ball.yPos - this.ball.dy;
    const ballNextY = this.ball.yPos;

    const paddleTop = this.paddle.y - this.paddleHeight / 2;
    const paddleBot = this.paddle.y + this.paddleHeight / 2;

    // Check if the ball is within the paddle's x range
    if (ballPrevX <= this.paddle.x && this.paddle.x < ballNextX) {
      // Calculate the point of collision on the y-axis
      const firstXRatio = (this.paddle.x - ballPrevX) / (ballNextX - ballPrevX);
      const ballYDiff = ballNextY - ballPrevY;
      const collisionY = ballPrevY + firstXRatio * ballYDiff;

      // Check if the collision point is within the paddle's y range
      if (paddleTop <= collisionY && collisionY <= paddleBot) {
        this.isMyTurn = false;
        this.ball.dx = -this.ball.dx;

        // Optionally adjust the ball's position slightly to prevent sticking
        this.ball.xPos =
          this.paddle.x +
          (this.ball.dx > 0 ? this.ball.radius : -this.ball.radius);
      }
    }
  }
}

export default Referee;
