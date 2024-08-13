import Player from "./Player.js";
import PingpongRenderer from "./PingpongRenderer.js";
import { PingpongConnectionError, isSocketConnected } from "../Error/Error.js";
import windowObservable from "../../WindowObservable.js";

class PingpongPageManager {
	constructor(app, clientInfo, renderPage) {
		this.app = app;
		this.clientInfo = clientInfo;
		this.renderPage = renderPage;
	}

	connectPage() {
		if (!isSocketConnected(this.clientInfo?.gameInfo?.pingpongRoomSocket)) throw new PingpongConnectionError();
	}

	clearPage() {
		this.clientInfo.gameInfo.pingpongRoomSocket.close();
		if (this.player) this.player._clearPlayer();
		this.clientInfo.gameInfo = null;
	}

	async initPage() {
		this.playerList = [];
		this.app.innerHTML = this._getPingpongHTML();
		this.pingpongRenderer = new PingpongRenderer(this.clientInfo);
		if (this.clientInfo.gameInfo.role !== "observer") this.player = new Player(this.clientInfo, this.playerList, this.sizeInfo);
		this._manageExitRoom();
		const closeListener = () => {
			this._cleanupPingpongInteraction();
		};
		this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener("close", closeListener);
		this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener("message", messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (event === "notifyGameEnd") {
				this._renderGameOverImage(content.winTeam);
				this._displayGameOverModal();
				this.clientInfo.gameInfo.pingpongRoomSocket.close();
			}
		});
		this._subscribeWindow();
	}

	_displayGameOverModal() {
		const gameOverModal = document.querySelector("#gameOverModal");
		gameOverModal.style.display = "flex";
		document.querySelector("#gameOverModal button").addEventListener("click", () => {
			if (this.clientInfo.tournamentInfo) {
				this.renderPage("tournament");
				return;
			}
			this.renderPage("lobby");
		});
	}

	_renderGameOverImage(winTeam) {
		let myTeam;
		let myPlayer = this.clientInfo.gameInfo.teamLeftList.find(player => player.id === this.clientInfo.id);
		if (myPlayer) {
			myTeam = "left";
		} else {
			myTeam = "right";
		}
		if (winTeam == myTeam) {
			this._setGameOverImage("win");
		} else {
			this._setGameOverImage("lose");
		}
	}

	_setGameOverImage(result) {
		const gameOverImage = document.querySelector(".gameOverImage");
		const gameOverModal = document.querySelector("#gameOverModal");
		let svgPath;

		switch (result) {
			case "win":
				gameOverImage.classList.add("winImage");
				gameOverModal.classList.add("winBackground");
				break;
			case "lose":
				gameOverImage.classList.add("loseImage");
				gameOverModal.classList.add("loseBackground");
				break;
			case "observer":
				gameOverImage.classList.add("winImage");
				gameOverModal.classList.add("winBackground");
				break;
		}
	}

	_manageExitRoom() {
		const exitButton = document.querySelector(".exitButton");
		const exitYesButton = document.querySelector(".questionModal .activatedButton:nth-of-type(1)");
		const exitNoButton = document.querySelector(".questionModal .activatedButton:nth-of-type(2)");
		const questionModal = document.querySelector(".questionModal");
		exitButton.addEventListener("click", this._exitButtonClicked.bind(this, questionModal));
		exitYesButton.addEventListener("click", this._exitYesButtonClicked.bind(this));
		exitNoButton.addEventListener("click", this._exitNoButtonClicked.bind(this, questionModal));
		this.exitModalState = "INACTIVE";
	}

	_subscribeWindow() {
		this.toggleExitModalByKeyDownRef = this._toggleExitModalByKeyDown.bind(this);
		windowObservable.subscribeKeydown(this.toggleExitModalByKeyDownRef);
		this.exitGameByKeyDownRef = this._exitGameByKeyDown.bind(this);
		windowObservable.subscribeKeydown(this.exitGameByKeyDownRef);
	}

	_unsubscribeWindow() {
		windowObservable.unsubscribeKeydown(this.toggleExitModalByKeyDownRef);
		windowObservable.unsubscribeKeydown(this.exitGameByKeyDownRef);
	}

	_toggleExitModalByKeyDown(e) {
		if (e.code !== "Escape") return;
		const questionModal = document.querySelector(".questionModal");
		if (this.exitModalState === "INACTIVE") {
			this._exitButtonClicked(questionModal);
		} else if (this.exitModalState === "ACTIVE") {
			this._exitNoButtonClicked(questionModal);
		}
	}

	_exitGameByKeyDown(e) {
		if (e.code !== "Enter") return;
		if (this.exitModalState !== "ACTIVE") return;
		this._exitYesButtonClicked();
	}

	_exitButtonClicked(questionModal) {
		this.exitModalState = "ACTIVE";
		questionModal.style.display = "flex";
	}
	_exitYesButtonClicked() {
		this._cleanupPingpongInteraction();
		if (this.clientInfo.tournamentInfo) {
			this.renderPage("tournament");
			return;
		}
		this.renderPage("lobby");
	}
	_exitNoButtonClicked(questionModal) {
		this.exitModalState = "INACTIVE";
		questionModal.style.display = "none";
	}

	_cleanupPingpongInteraction() {
		if (!this.clientInfo?.gameInfo) return;
		this.pingpongRenderer.removeListener.call(this.pingpongRenderer);
		this.pingpongRenderer.unsubscribeWindow.call(this.pingpongRenderer);

		if (this.clientInfo.gameInfo.role !== "observer") {
			this.player.unsubscribeWindow.call(this.player);
		}
		if (this.clientInfo?.gameInfo?.pingpongRoomSocket) this.clientInfo.gameInfo.pingpongRoomSocket.close();
	}

	_getPingpongHTML() {
		return `
			<div id="gameContainer">
				${this._getDisplayBoardHTML()}
				${this._getPlayBoardHTML()}
			</div>
			${this._getquestionModalHTML()}
			${this._getGameOverModalHTML()}
		`;
	}

	_getDisplayBoardHTML() {
		const teamLeftScore = !this.clientInfo.gameInfo.teamLeftScore ? 0 : this.clientInfo.gameInfo.teamLeftScore;
		const teamRightScore = !this.clientInfo.gameInfo.teamRightScore ? 0 : this.clientInfo.gameInfo.teamRightScore;
		return `
			<div id="displayBoard">
				<div id="leftDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">${teamLeftScore}<div class="playerScoreStroke">${teamLeftScore}</div></div>
					</div>
					<div class="playerAvatar"></div>
				</div>
				<div class="timeInfo">
					<div id="timeText">42</div>
				</div>
				<div id="rightDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">${teamRightScore}<div class="playerScoreStroke">${teamRightScore}</div></div>
					</div>
					<div class="playerAvatar"></div>
				</div>
			</div>
		`;
	}

	_getPlayBoardHTML() {
		return `
			<div id="playBoard">
				<div class="subPlayBoard"></div>
				<div class="subPlayBoard"></div>
				<div class="ball"></div>
			</div>
		`;
	}

	_getquestionModalHTML() {
		return `
			<button class="exitButton"></button>
			<div class="questionModal">
				<div class="questionBox">
					<div class="question">${this.clientInfo.gameInfo.role === "observer" ? "관전을 종료하시겠습니까?" : "상대에게 승리를 선사하시겠습니까?"}</div>
					<div class="buttonGroup">
						<button class="activatedButton">네</button>
						<button class="activatedButton">아니오</button>
					</div>
				</div>
			</div>
		`;
	}

	_getGameOverModalHTML() {
		return `
			<div id="gameOverModal">
				<div id="contentBox">
					<div class="gameOverImage"></div>
					<button class="generalButton">나가기</button>
				</div>
			</div>
		`;
	}
}

export default PingpongPageManager;
