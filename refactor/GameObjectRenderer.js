import OrientationEventHandler from "./OrientationEventHandler.js";
import GameOrientationObserver from "./GameOrientationObserver.js";

class GameObjectRenderer {
	constructor(referee) {
		this.referee = referee;

		this.ballElement = document.querySelector('.ball');
		this.paddleElement = document.querySelector('.paddle');
		this.renderBall();
		this.renderPaddle();

		// TODO : 이후엔 OrientationEventHandler 생성을 여기서 하면 안 될 것임
		this.orientationEventHandler = new OrientationEventHandler();
		const updateOrientationObserver = new GameOrientationObserver(this.updateOrientation.bind(this));
		this.orientationEventHandler.subscribe(updateOrientationObserver);
		// TODO : 방향 초기화하고 시작하기 위한 임시 코드
		// 모든 옵저버에게 알릴 필요 X, 특정 옵저버에게만 notify할 수 있는 메소드가 필요하려나
		this.orientationEventHandler.notify();

		this.gameContainer = document.querySelector('#gameContainer');
		this.updateGameContainer();
		this.VCPercent = 90;
	}

	updateOrientation(orientation) {
		this.orientation = orientation;
	}

	renderBall() {
		const ballWidthPercent = this.referee.ball.radius*2 / this.referee.boardWidth * 100;
		this.ballElement.style.width = `${ballWidthPercent}%`;
		const yPercent = this.referee.ball.yPos / this.referee.boardHeight * 100;
		const xPercent = this.referee.ball.xPos / this.referee.boardWidth * 100;
		this.ballElement.style.top = `${yPercent}%`;
		this.ballElement.style.left = `${xPercent}%`;
		this.ballElement.style.transform = `translate(-50%, -50%)`;
	}

	renderPaddle() {
		const paddleHeightPercent = this.referee.paddleHeight / this.referee.boardHeight * 100;
		const paddleWidthPercent =  this.referee.paddleWidth / this.referee.boardWidth * 100;
		this.paddleElement.style.height = `${paddleHeightPercent}%`;
		this.paddleElement.style.width = `${paddleWidthPercent * 2}%`;
		const yPercent = this.referee.paddle.y / this.referee.boardHeight * 100;
		const xPercent = (this.referee.paddle.x - this.referee.boardWidth / 2) / (this.referee.boardWidth / 2) * 100;
		this.paddleElement.style.top = `${yPercent}%`;
		this.paddleElement.style.left = `${xPercent}%`;
		this.paddleElement.style.transform = `translate(-50%, -50%)`;
	}

	updateGameContainer() {
		const ratio = this.referee.gameContainerRatio;
		if (this.orientation === 'portrait') {
			// 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
			if (window.innerHeight / window.innerWidth < ratio) {
				this.gameContainer.style.height = `${this.VCPercent}vh`;
				this.gameContainer.style.width = `${this.VCPercent / ratio}vh`;
			} else { // 뷰포트 높이가 충분함 -> 뷰포트 너비 기준
				this.gameContainer.style.width = `${this.VCPercent}vw`;
				this.gameContainer.style.height = `${this.VCPercent * ratio}vw`;
			}
		} else if (this.orientation === 'landscape') {
			// 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
			if (window.innerWidth / window.innerHeight < ratio) {
				this.gameContainer.style.width = `${this.VCPercent}vw`;
				this.gameContainer.style.height = `${this.VCPercent / ratio}vw`;
			} else { // 뷰포트 너비가 충분함 -> 뷰포트 높이 기준
				this.gameContainer.style.height = `${this.VCPercent}vh`;
				this.gameContainer.style.width = `${this.VCPercent * ratio}vh`;
			}
		}
	}
}

export default GameObjectRenderer;