import Player from "./Player.js";
import PingpongRenderer from "./PingpongRenderer.js";

class PingpongPageManager {
	constructor(app, clientInfo, gameInfo, onExitPingpong) {
		this.clientInfo = clientInfo;
		this.gameInfo = gameInfo;
		this.onExitPingpong = onExitPingpong;
		this.playerList = [];
		this.leftPlayer = { clientId: null, clientNickname: null };
		this.rightPlayer = { clientId: null, clientNickname: null };
		this.sizeInfo = null;

		app.innerHTML = "WAIT START GAME";

		//게임시작 메시지 받으면 시작
		this._getStartGameResponse(this.clientInfo.socket).then(() => {
			app.innerHTML = this._getPingpongHTML();

			this.pingpongRenderer = new PingpongRenderer(
				this.clientInfo,
				this.playerList,
				this.sizeInfo,
				this.gameInfo
			);

			this.player = new Player(this.clientInfo, this.playerList, this.sizeInfo);

			this._manageExitRoom(); // 탁구장 나가기 처리
			this.clientInfo.socket.addEventListener('message', this.closeRoomListener); // 탁구장 폐쇠 감지
		});
	}

	_getStartGameResponse(socket) {
		return new Promise((res, rej) => {
			const listener = (messageEvent) => {
				const message = JSON.parse(messageEvent.data);
				const { sender, receiver, event, content } = message;
				if (receiver.includes("player") && event === "startGame") {
					socket.removeEventListener("message", listener);
					const { playerList, sizeInfo } = content;
					this.sizeInfo = sizeInfo;
					this.playerList = playerList;
					this.leftPlayer = this.playerList.find(
						(player) => player.team === "left"
					);
					this.rightPlayer = this.playerList.find(
						(player) => player.team === "right"
					);
					res();
				}
			};

			socket.addEventListener("message", listener);
		});
	}

	_manageExitRoom() {
		const exitButton = document.querySelector('.exitButton');
		const exitYesButton = document.querySelector('.questionModal .activatedButton:nth-of-type(1)');
		const exitNoButton = document.querySelector('.questionModal .activatedButton:nth-of-type(2)');
		const questionModal = document.querySelector('.questionModal');
		exitButton.addEventListener('click', this._exitButtonClicked.bind(this, questionModal));
		exitYesButton.addEventListener('click', this._exitYesButtonClicked.bind(this));
		exitNoButton.addEventListener('click', this._exitNoButtonClicked.bind(this, questionModal));
	}
	_exitButtonClicked(questionModal) {
		questionModal.style.display = 'flex';
	}
	_exitYesButtonClicked() {
		const sendGiveUpMsg = () => {
			const giveUpMessage = {
				sender: "player",
				receiver: ["referee", "player"],
				event: "giveUpGame",
				content: {
					roomId: this.clientInfo.roomId,
					clientId: this.clientInfo.id,
				}
			}
			this.clientInfo.socket.send(JSON.stringify(giveUpMessage));
		}
		sendGiveUpMsg();
		this._exitPingpongPage();
	}
	_exitNoButtonClicked(questionModal) {
		questionModal.style.display = 'none';
	}

	closeRoomListener = (messageEvent) => {
		const message = JSON.parse(messageEvent.data);
		const { sender, receiver, event, content } = message;

		if (receiver.includes('player') && event === 'closePingpongRoom') {
			this._exitPingpongPage();
		}
	}

	_exitPingpongPage() {
		// PingpongPageManager, PingpongRenderer, Player에서 소켓과의 모든 상호작용 삭제
		this.clientInfo.socket.removeEventListener('message', this.closeRoomListener);
		this.pingpongRenderer.removeListener.call(this.pingpongRenderer);
		this.pingpongRenderer.unsubscribeWindow.call(this.pingpongRenderer);
		this.player.unsubscribeWindow.call(this.player);
		this.onExitPingpong();
		// window.getEventListeners(this.clientInfo.socket);
		// TODO : 남아있는 리스너 확인하기
	}

	_getPingpongHTML() {
		return `
			<div id="gameContainer">
				${this._getDisplayBoardHTML()}
				${this._getPlayBoardHTML()}
			</div>
			${this._getquestionModalHTML()}
		`;
	}

	_getDisplayBoardHTML() {
		return `
			<div id="displayBoard">
				<div id="leftDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">0<div class="playerScoreStroke">0</div></div>
					</div>
					<div class="playerAvatar"></div>
				</div>
				<div class="timeInfo">
					<div id="timeText">01 : 33</div>
				</div>
				<div id="rightDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">0<div class="playerScoreStroke">0</div></div>
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
					<div class="question">상대에게 승리를 선사하시겠습니까?</div>
					<div class="buttonGroup">
						<button class="activatedButton">네</button>
						<button class="activatedButton">아니오</button>
					</div>
				</div>
			</div>
		`;
	}
}

export default PingpongPageManager;
