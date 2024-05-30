import MovePaddleObserver from "./MovePaddleObserver.js";
import TogglePlayObserver from "./TogglePlayObserver.js";

class Player {
	constructor(eventHandler, referee, gameObjectRenderer, subBoardRect) {
		this.referee = referee;
		this.gameObjectRenderer = gameObjectRenderer;
		this.subBoardRect = subBoardRect;

		const movePaddleObserver = new MovePaddleObserver(this.sendPaddlePosition.bind(this));
		eventHandler.subscribe('mousemove', movePaddleObserver);
		const togglePlayObserver = new TogglePlayObserver(this.sendStartGame.bind(this));
		eventHandler.subscribe('mousedown', togglePlayObserver);
	}

	sendPaddlePosition(e) {
		const yPos = e.clientY - this.subBoardRect.top;
		const xPos = e.clientX - this.subBoardRect.left;
		let y = (yPos / this.subBoardRect.height) * this.referee.boardHeight;
		let x = this.referee.boardWidth / 2 + (xPos / this.subBoardRect.width) * this.referee.boardWidth / 2;
		x = Math.max(this.referee.boardWidth / 2, Math.min(x, this.referee.boardWidth));
		y = Math.max(0, Math.min(y, this.referee.boardHeight));
		this.referee.updatePaddlePosition(y, x);
		this.gameObjectRenderer.renderPaddle(y, x, this.referee.paddleHeight, this.referee.boardHeight, this.referee.boardWidth);
	}

	sendStartGame() {
		this.referee.startGame(this.gameObjectRenderer);
	}
}

export default Player;