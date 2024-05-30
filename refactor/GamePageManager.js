import EventHandler from './EventHandler.js';
import Referee from './Referee.js';
import Player from './Player.js';
import GameObjectRenderer from './GameObjectRenderer.js';
import GameResizeObserver from './GameResizeObserver.js';

class GamePageManager {
	constructor(app) {
		app.innerHTML = this.getHTML();

		this.eventHandler = new EventHandler();
		this.eventHandler.setupEventListeners('resize');
		this.eventHandler.setupEventListeners('mousedown');
		this.eventHandler.setupEventListeners('mousemove');
		// TODO : 방향 변경 이벤트 등록

		this.referee = new Referee();
		this.gameObjectRenderer = new GameObjectRenderer(this.referee); // TODO : gameObjectRenderer, referee 둘이 양방향 상관관계다
		
		this.subBoard = document.querySelector('.subPlayBoard:nth-of-type(2)');
		const newRect = this.subBoard.getBoundingClientRect();
		this.subBoardRect = {
			top: newRect.top,
			left: newRect.left,
			height: newRect.height,
			width: newRect.width
		}

		const gameResizeObserver = new GameResizeObserver(this.UpdateSubBoard.bind(this));
		this.eventHandler.subscribe('resize', gameResizeObserver);

		this.player = new Player(this.eventHandler, this.referee, this.gameObjectRenderer, this.subBoardRect);
	}

	UpdateSubBoard() {
		const newRect = this.subBoard.getBoundingClientRect();
		this.subBoardRect.top = newRect.top;
		this.subBoardRect.left = newRect.left;
		this.subBoardRect.height = newRect.height;
		this.subBoardRect.width = newRect.width;
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
}

export default GamePageManager;