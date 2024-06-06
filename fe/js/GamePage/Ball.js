class Ball {
	// constructor(angle, speed, radius) {
	// 	this.angle = angle;
	// 	this.speed = speed;
	// 	this.radius = radius;
	// }
	constructor(speed, radius) {
		this.speed = speed;
		this.radius = radius;
	}

	// initBall(boardWidth, boardHeight) {
	// 	this.xPos = boardWidth / 2;
	// 	this.yPos = boardHeight / 2;
	// 	const dir = this._calculateBallDirection();
	// 	this.dx = dir.dx;
	// 	this.dy = dir.dy;
	// 	this.angle = 0;
	// }
	initBall(x, y, angle) {
		this.xPos = x;
		this.yPos = y;
		this.angle = angle;
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

	reversalRandomDx() {
		let rand = Math.floor(Math.random() * 81) - 40; // -40 ~ +40도 사이에서 이동 방향 변화
		this.angle = Math.max(0, Math.min(45, this.angle + rand)); // 최소 각도 0, 최대 각도 45
		const dir = this._calculateBallDirection(this.speed, this.angle);
		this.dx = this.dx < 0 ? dir.dx : -dir.dx; // dx는 부호 반전
		this.dy = this.dy < 0 ? -dir.dy : dir.dy; // dy는 부호 유지
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
