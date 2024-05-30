class GameObjectRenderer {
	constructor(referee) {
		this.referee = referee;

		this.ballElement = document.querySelector('.ball');
		this.paddleElement = document.querySelector('.paddle');
		this.renderBall();
		this.renderPaddle();

		this.gameContainer = document.querySelector('#gameContainer');
		this._updateGameContainerRatio(this.referee.boardWidth / this.referee.boardHeight);
		this.VCPercent = 90;
	}

	renderBall() {
		const yPercent = this.referee.ball.yPos / this.referee.boardHeight * 100;
		const xPercent = this.referee.ball.xPos / this.referee.boardWidth * 100;
		this.ballElement.style.top = `${yPercent}%`;
		this.ballElement.style.left = `${xPercent}%`;
		this.ballElement.style.transform = `translate(-50%, -50%)`;
	}

	renderPaddle() {
		const paddlePercent = this.referee.paddleHeight / this.referee.boardHeight * 100;
		this.paddleElement.style.height = `${paddlePercent}%`;
		const yPercent = this.referee.paddle.y / this.referee.boardHeight * 100 - paddlePercent / 2;
		const xPercent = (this.referee.paddle.x - this.referee.boardWidth / 2) / (this.referee.boardWidth / 2) * 100;
		this.paddleElement.style.top = `${yPercent}%`;
		this.paddleElement.style.left = `${xPercent}%`;
	}

	_updateGameContainerRatio(WHRatio) { // TODO : resize 이벤트 발생 시 호출, portrait도 고려
		// 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
		if (window.innerWidth / window.innerHeight < WHRatio) {
			this.gameContainer.style.width = `${this.VCPercent}vw`;
			this.gameContainer.style.height = `${this.VCPercent / WHRatio}vw`;
		} else { // 뷰포트 너비가 충분함 -> 뷰포트 높이 기준
			this.gameContainer.style.height = `${this.VCPercent}vh`;
			this.gameContainer.style.width = `${this.VCPercent * WHRatio}vh`;
		}
	}
}

export default GameObjectRenderer;