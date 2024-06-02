import Ball from "./Ball.js";

class Referee {
  constructor() {
    this.isPlaying = false;
    this.isMyTurn = true;
    this.ballMoveIntervalID = null;
    // this.paddle = {
    //   y: this.boardHeight / 2,
    //   x: this.boardWidth / 2 + this.boardWidth / 4,
    // };
    // TODO : Referee가 clientID에 따라 패들을 여러 개 관리해야 하나?
    // TODO : 모든 플레이어가 탁구장에 입장하면, 호스트 클라이언트가 Referee를 생성되어야 하나?
    this.paddles = {
      
    }

    this.boardWidth = 1550;
    this.boardHeight = 1000;
    this.gameContainerRatio = this.boardWidth / this.boardHeight;
    this.paddleHeight = 150;
    this.paddleWidth = 15;

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
    // let curTime = new Date().getTime();
    // let elapsedTime = curTime - this.startTime;
    // console.log("Elapsed time: " + elapsedTime + " ms");

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

    if (ballPrevX <= this.paddle.x && this.paddle.x < ballNextX) {
      const firstXRatio = (this.paddle.x - ballPrevX) / (ballNextX - ballPrevX);
      const ballYDiff = ballNextY - ballPrevY;
      const collisionY = ballPrevY + firstXRatio * ballYDiff;

      if (paddleTop <= collisionY && collisionY <= paddleBot) {
        this.isMyTurn = false;
        this.ball.reversalRandomDx();
      }
    }
  }
}

export default Referee;
