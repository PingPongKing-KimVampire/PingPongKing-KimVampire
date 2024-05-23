class GamePage {
	constructor(gameManager) {
		this.gameManager = gameManager;
	}

	getHTML() {
		return `
			<div id="gameContainer">
				${this.getDisplayBoardHTML()}
				${this.getPlayBoardHTML()}
			</div>
			${this.getExitModalHTML()}
		`;
	}

	getDisplayBoardHTML() {
		return `
			<div id="displayBoard">
				<div id="leftDisplayBoard">
					<div class="playerInfo">
						<div class="playerName">김철수</div>
						<div class="playerScore">11<div class="playerScoreStroke">11</div></div>
					</div>
					<div class="playerAvatar"><img src="images/playerA.png"></div>
				</div>
				<div class="timeInfo">
					<div id="timeText">01 : 33</div>
				</div>
				<div id="rightDisplayBoard">
					<div class="playerInfo">
						<div class="playerName">이영희</div>
						<div class="playerScore">8<div class="playerScoreStroke">8</div></div>
					</div>
					<div class="playerAvatar"><img src="images/playerB.png"></div>
				</div>
			</div>
		`;
	}

	getPlayBoardHTML() {
		return `
			<div id="playBoard">
				<div class="subPlayBoard"></div>
				<div class="subPlayBoard"><div class="paddle"></div></div>
				<div class="ball"></div>
			</div>
		`;
	}

	getExitModalHTML() {
		return `
			<button class="exitButton"></button>
			<div class="exitModal">
				<div class="questionBox">
					<div class="question">상대에게 승리를 선사하시겠습니까?</div>
					<div class="buttonGroup">
						<button class="yesButton">네</button>
						<button class="noButton">아니오</button>
					</div>
				</div>
			</div>
		`;
	}

	initialize() {
		this.gameManager.initialize();
	}
}

export default GamePage;