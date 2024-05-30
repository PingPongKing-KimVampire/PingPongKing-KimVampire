class Ball {
  constructor(angle, speed, radius) {
    this.angle = angle;
    this.speed = speed;
    this.radius = radius;
  }

  initBall(boardWidth, boardHeight) {
    this.xPos = boardWidth / 2;
    this.yPos = boardHeight / 2;
    const dir = this._calculateBallDirection();
    this.dx = dir.dx;
    this.dy = dir.dy;
  }

  _calculateBallDirection() {
    const angleRadians = (this.angle * Math.PI) / 180;
    const dx = Math.cos(angleRadians) * this.speed;
    const dy = Math.sin(angleRadians) * this.speed;
    return { dx, dy };
  }

  getRightX() {
    return this.xPos + this.radius;
  }

  getLeftX() {
    return this.xPos - this.radius;
  }

  getTopY() {
    return this.yPos - this.radius;
  }

  getBottomY() {
    return this.yPos + this.radius;
  }
}

export default Ball;
