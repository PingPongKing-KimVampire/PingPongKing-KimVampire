import EventHandler from "./EventHandler.js";
import Referee from "./Referee.js";
import Player from "./Player.js";
import GameObjectRenderer from "./GameObjectRenderer.js";
import GameResizeObserver from "./GameResizeObserver.js";

//브라우저의 상태를 구독하는 로직이 너무 여기저기 흩어져있다. 이를 사혼의 구슬조각을 모으듯 모아보자

class GamePageManager {
	constructor(app, clientInfo) {
		this.clientInfo = clientInfo;
		this.playerList = [];
		this.leftPlayer = { clientId: null, clientNickname: null };
		this.rightPlayer = { clientId: null, clientNickname: null };
		this.gameInfo = {
			boardWidth: null,
			boardHeight: null,
			paddleWidth: null,
			paddleHeight: null,
			ballRadius: null,
		};

		app.innerHTML = "WAIT START GAME";

		//게임정보 응답 받으면 시작
		this._getStartGameResponse(this.clientInfo.socket).then(() => {

			app.innerHTML = this.getHTML();

			this.eventHandler = new EventHandler();
			this._addWindowEventListeners();

			this.gameObjectRenderer = new GameObjectRenderer(this.clientInfo, this.playerList, this.gameInfo);

			//서브보드의 크기 구함
			this.subBoard = document.querySelector(".subPlayBoard:nth-of-type(2)");
			const newRect = this.subBoard.getBoundingClientRect();
			this.subBoardRect = {
				top: newRect.top,
				left: newRect.left,
				height: newRect.height,
				width: newRect.width,
			};

			const updateSubBoardObserver = new GameResizeObserver(
				this._updateSubBoard.bind(this)
			);

			this.eventHandler.subscribe("resize", updateSubBoardObserver);
			const updateGameContainerObserver = new GameResizeObserver(
				this.gameObjectRenderer.updateGameContainer.bind(
					this.gameObjectRenderer
				)
			);

			this.eventHandler.subscribe("resize", updateGameContainerObserver);

			this.player = new Player(
				this.clientInfo,
				this.playerList,
				this.gameInfo,
				this.eventHandler,
				this.subBoardRect //이런 정보를 생성자로 보내는게 조금 어색하다. 그러나 렌더러와 동시에 사용하는 정보기 때문에 밖에서 전달하는것도 일리는있다.
			);
		});
	}

	_addWindowEventListeners() {
		this.eventHandler.setupEventListeners("resize");
		// this.eventHandler.setupEventListeners("mousedown");
		this.eventHandler.setupEventListeners("mousemove");
	}

	//remove이벤트 리스너로 변경하기
	_getStartGameResponse(socket) {
		return new Promise((res, rej) => {
			socket.addEventListener(
				"message",
				(eventMessage) => {
					const message = JSON.parse(eventMessage.data);
					const { sender, receiver, event, content } = message;
					console.log("GAME START!!!!");
					console.log(message);
					if (receiver.includes("player") && event === "startGame") {
						const { playerList, gameInfo } = content;
						this.playerList = playerList;
						this.gameInfo = gameInfo;
						this.leftPlayer = this.playerList.find(
							(player) => player.team === "left"
						);
						this.rightPlayer = this.playerList.find(
							(player) => player.team === "right"
						);
						res();
					}
				}
			);
		});
	}

	_updateSubBoard() {
		const newRect = this.subBoard.getBoundingClientRect();
		this.subBoardRect.top = newRect.top;
		this.subBoardRect.left = newRect.left;
		this.subBoardRect.height = newRect.height;
		this.subBoardRect.width = newRect.width;
	}

	getHTML() {
		return `
			<div id="gameContainer">
				${this._getDisplayBoardHTML()}
				${this._getPlayBoardHTML()}
			</div>
			${this._getExitModalHTML()}
		`;
	}

	_getDisplayBoardHTML() {
		return `
			<div id="displayBoard">
				<div id="leftDisplayBoard">
					<div class="playerInfo">
						<div class="playerName">${this.playerList.filter((player) => player.clientId !== this.clientInfo.id)[0].clientNickname}</div>
						<div class="playerScore">11<div class="playerScoreStroke">11</div></div>
					</div>
					<div class="playerAvatar"><img src="images/playerA.png"></div>
				</div>
				<div class="timeInfo">
					<div id="timeText">01 : 33</div>
				</div>
				<div id="rightDisplayBoard">
					<div class="playerInfo">
						<div class="playerName">${this.playerList.filter((player) => player.clientId === this.clientInfo.id)[0].clientNickname}</div>
						<div class="playerScore">8<div class="playerScoreStroke">8</div></div>
					</div>
					<div class="playerAvatar"><img src="images/playerB.png"></div>
				</div>
			</div>
		`;
	}

	_getPlayBoardHTML() {
		return `
			<div id="playBoard">
				<div class="subPlayBoard"></div>
				<div class="subPlayBoard"><div class="paddle"></div></div>
				<div class="ball"></div>
			</div>
		`;
	}

	_getExitModalHTML() {
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
}

export default GamePageManager;
