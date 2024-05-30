import OrientationEventHandler from "./OrientationEventHandler.js";
import GameOrientationObserver from "./GameOrientationObserver.js";

class GameObjectRenderer {
	constructor(referee) {
		this.referee = referee;

		this.ballElement = document.querySelector('.ball');
		this.paddleElement = document.querySelector('.paddle');
		this.renderBall();
		this.renderPaddle();
		
		this.gameContainer = document.querySelector('#gameContainer');
		this.VCPercent = 90;

		// TODO : 이후엔 OrientationEventHandler 생성을 여기서 하면 안 될 것임
		this.orientationEventHandler = new OrientationEventHandler();
		const updateOrientationObserver = new GameOrientationObserver(this.updateOrientation.bind(this));
		this.orientationEventHandler.subscribe(updateOrientationObserver);
		// TODO : 방향 초기화하고 시작하기 위한 임시 코드
		// 모든 옵저버에게 알릴 필요 X, 특정 옵저버에게만 notify할 수 있는 메소드가 필요하려나
		this.orientationEventHandler.notify();
	}

	updateOrientation(orientation) {
		this.orientation = orientation;
		this.updateGameContainer();
		this.renderBall();
		this.renderPaddle();
	}

	renderBall() {
		const ballSizePercent = this.referee.ball.radius*2 / this.referee.boardWidth * 100;
		if (this.orientation === 'portrait') {
			this.ballElement.style.height = `${ballSizePercent}%`;
			this.ballElement.style.width = 'auto';
		} else if (this.orientation === 'landscape') {
			this.ballElement.style.width = `${ballSizePercent}%`;
			this.ballElement.style.height = 'auto';
		}
		this.ballElement.style.aspectRatio = '1/1';

		const yPercent = this.referee.ball.yPos / this.referee.boardHeight * 100;
		const xPercent = this.referee.ball.xPos / this.referee.boardWidth * 100;
		if (this.orientation === 'portrait') {
			this.ballElement.style.top = `${xPercent}%`;
			this.ballElement.style.left = `${100 - yPercent}%`;
		} else if (this.orientation === 'landscape') {
			this.ballElement.style.top = `${yPercent}%`;
			this.ballElement.style.left = `${xPercent}%`;
		}
		this.ballElement.style.transform = `translate(-50%, -50%)`;
	}

	renderPaddle() {
		const heightPercent = this.referee.paddleHeight / this.referee.boardHeight * 100;
		const widthPercent =  this.referee.paddleWidth / this.referee.boardWidth * 100;
		const yPercent = this.referee.paddle.y / this.referee.boardHeight * 100;
		const xPercent = (this.referee.paddle.x - this.referee.boardWidth / 2) / (this.referee.boardWidth / 2) * 100;
		if (this.orientation === 'portrait') {
			this.paddleElement.style.height = `${widthPercent * 2}%`;
			this.paddleElement.style.width = `${heightPercent}%`;
			this.paddleElement.style.top = `${xPercent}%`;
			this.paddleElement.style.left = `${100 - yPercent}%`;
		} else if (this.orientation === 'landscape') {
			this.paddleElement.style.height = `${heightPercent}%`;
			this.paddleElement.style.width = `${widthPercent * 2}%`;
			this.paddleElement.style.top = `${yPercent}%`;
			this.paddleElement.style.left = `${xPercent}%`;
		}
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