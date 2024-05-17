import gameInstance from './Game.js';

class Ball {
	constructor(ballContainer, isPortrait) {
		this.element = ballContainer.querySelector('.ball');
		this.board = ballContainer;
		this.init(isPortrait);
	}

	init(isPortrait) {
		this.angle = 20;
		this.speed = 0.3;
		const dir = this.calculateDirection(this.speed, this.angle);
		this.dx = dir.dx;
		this.dy = dir.dy;
		const radiusX = ((this.element.clientWidth / 2) / this.board.clientWidth) * 100;
		const radiusY = ((this.element.clientHeight / 2) / this.board.clientHeight) * 100;
		this.cx = 50 - radiusX;
		this.cy = 50 - radiusY;
		this.display();
	}

	calculateDirection(speed, angle) {
		const angleRadians = (angle * Math.PI) / 180;
		const dx = Math.cos(angleRadians) * speed;
		const dy = Math.sin(angleRadians) * speed;
		return { dx, dy };
	}

	move(isPortrait) {
		if (isPortrait) {
			this.cx += this.dy;
			this.cy += this.dx;
		} else {
			this.cx += this.dx;
			this.cy += this.dy;
		}
		this.display(isPortrait);
	}

	display(isPortrait) {
		if (isPortrait) {
			this.element.style.left = '';
			this.element.style.right = `${this.cx}%`;
			this.element.style.top = `${this.cy}%`;
		} else {
			this.element.style.right = '';
			this.element.style.left = `${this.cx}%`;
			this.element.style.top = `${this.cy}%`;
		}
	}

	detectWall(isPortrait) {
		const ballRect = this.element.getBoundingClientRect();
		const boardRect = this.board.getBoundingClientRect();
		console.log(isPortrait);
	
		// 공이 플레이어 편 벽과 충돌한 경우 (게임 중단 & 실점)
		if ((isPortrait && boardRect.bottom <= ballRect.bottom) ||
			(!isPortrait && boardRect.right <= ballRect.right)) {
			gameInstance.stopGame();
			return;
		}
		// 공이 플레이어 반대편 벽과 충돌한 경우 (턴 전환)
		if ((isPortrait && ballRect.top <= boardRect.top) ||
			(!isPortrait && ballRect.left <= boardRect.left)) {
			gameInstance.isMyTurn = true;
			gameInstance.stopGame();
		}
		// 위, 아래쪽 벽과 충돌 시 dy 반전
		if ((isPortrait && (ballRect.left <= boardRect.left || boardRect.right <= ballRect.right)) ||
			(!isPortrait && (ballRect.top <= boardRect.top || boardRect.bottom <= ballRect.bottom))) {
			this.dy = -this.dy;
		}
		// 왼, 오른쪽 벽과 충돌 시 dx 반전
		if ((isPortrait && (ballRect.top <= boardRect.top || boardRect.bottom <= ballRect.bottom)) ||
			!isPortrait && (ballRect.left <= boardRect.left || boardRect.right <= ballRect.right)) {
			this.dx = -this.dx;
		}
	}

	detectPaddle(isPortrait) {
		const ballRect = this.element.getBoundingClientRect();
		const paddleRect = gameInstance.paddle.element.getBoundingClientRect();

		if (isPortrait === false &&
			ballRect.right >= paddleRect.left &&
			ballRect.left < paddleRect.left &&
			ballRect.bottom > paddleRect.top &&
			ballRect.top < paddleRect.bottom)
		{
			this.reversalRandomDx();
			gameInstance.isMyTurn = false;
		}

		if (isPortrait === true &&
			ballRect.top <= paddleRect.bottom &&
			ballRect.bottom > paddleRect.bottom &&
			ballRect.right > paddleRect.left &&
			ballRect.left < paddleRect.right) 
		{
			this.reversalRandomDx();
			gameInstance.isMyTurn = false;
		}
	}

	reversalRandomDx() {
		let rand = Math.floor(Math.random() * 81) - 40; // -40 ~ +40도 사이에서 이동 방향 변화
		this.angle = Math.max(0, Math.min(45, this.angle + rand)); // 최소 각도 0, 최대 각도 45
		const prevDx = this.dx;
		const prevDy = this.dy;
		const dir = this.calculateDirection(this.speed, this.angle);
		this.dx = this.dx < 0 ? dir.dx : -dir.dx; // dx는 부호 반전
		this.dy = this.dy < 0 ? -dir.dy : dir.dy; // dy는 부호 유지
	}

	swapDirection() {
		let temp = this.cx;
		this.cx = this.cy;
		this.cy = temp;
	}
}

export default Ball;