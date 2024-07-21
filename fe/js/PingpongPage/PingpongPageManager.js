import Player from './Player.js';
import PingpongRenderer from './PingpongRenderer.js';

class PingpongPageManager {
	constructor(app, clientInfo, onExitPingpong, renderTournament) {
		this.app = app;
		this.clientInfo = {
			socket: null,
			id: null,
			nickname: null,
			lobbySocket: null,
			gameInfo: {
				pingpongRoomSocket: null,
				roomId: null,
				title: null,
				teamLeftList: null,
				teamRightList: null,
				teamLeftMode: null,
				teamRightMode: null,
				sizeInfo: {
					boardWidth: null,
					boardHeight: null,
					// paddleWidth: null,
					// paddleHeight: null,
					ballRadius: null,
				},
			},
		};
		//playerList 정보
		// clientId;
		// clientNickname;
		// readyState;
		// ability;
		// paddleHeight;
		// paddleWidth;

		this.clientInfo = clientInfo;
		this.onExitPingpong = onExitPingpong;
		this.renderTournament = renderTournament;
		this.playerList = [];
	}

	async initPage() {
		//하드코딩
		this.clientInfo.gameInfo.sizeInfo.paddleWidth = 15;
		this.clientInfo.gameInfo.sizeInfo.paddleHeight = 150;
		this.app.innerHTML = this._getPingpongHTML();

		this.pingpongRenderer = new PingpongRenderer(this.clientInfo);
		if(this.clientInfo.gameInfo.role !== "observer")
			this.player = new Player(this.clientInfo, this.playerList, this.sizeInfo);

		this._manageExitRoom(); // 탁구장 나가기 처리

		// 탁구장 폐쇄 감지
		// TODO : 현재 테스트 불가능
		const closeListener = () => {
			this.clientInfo.gameInfo.pingpongRoomSocket.removeEventListener('close', closeListener);
			this._cleanupPingpongInteraction();
			this._displayGameOverModal();
		}
		this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener('close', closeListener);

		// TODO : 탁구장 폐쇄 감지가 불가능해서 임시로 notifyGameEnd API 활용
		this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener('message', (messageEvent) => {
			const { event } = JSON.parse(messageEvent.data);
			if (event === 'notifyGameEnd') {
				console.log('notify game end!');
				this.clientInfo.gameInfo.pingpongRoomSocket.close();
			}
		})
	}

	_manageExitRoom() {
		const exitButton = document.querySelector('.exitButton');
		const exitYesButton = document.querySelector(
			'.questionModal .activatedButton:nth-of-type(1)'
		);
		const exitNoButton = document.querySelector(
			'.questionModal .activatedButton:nth-of-type(2)'
		);
		const questionModal = document.querySelector('.questionModal');
		exitButton.addEventListener(
			'click',
			this._exitButtonClicked.bind(this, questionModal)
		);
		exitYesButton.addEventListener(
			'click',
			this._exitYesButtonClicked.bind(this)
		);
		exitNoButton.addEventListener(
			'click',
			this._exitNoButtonClicked.bind(this, questionModal)
		);
	}
	_exitButtonClicked(questionModal) {
		questionModal.style.display = 'flex';
	}
	_exitYesButtonClicked() {
		this.clientInfo.socket.close();
		this._cleanupPingpongInteraction();
		if(this.clientInfo.tournamentInfo)
		{
			this.renderTournament();
			return;
		}
		this.onExitPingpong();
	}
	_exitNoButtonClicked(questionModal) {
		questionModal.style.display = 'none';
	}

	_cleanupPingpongInteraction() {
		// PingpongPageManager, PingpongRenderer, Player에서 소켓과의 모든 상호작용 삭제
		// TODO : 남아있는 리스너 확인하기
		this.pingpongRenderer.removeListener.call(this.pingpongRenderer);
		this.pingpongRenderer.unsubscribeWindow.call(this.pingpongRenderer);
		this.player.unsubscribeWindow.call(this.player);
	}

	_displayGameOverModal() {
		const gameOverModal = document.querySelector('#gameOverModal');
		gameOverModal.style.display = 'flex';
		document.querySelector('#gameOverModal button').addEventListener('click', () => {
			if(this.clientInfo.tournamentInfo)
			{
				this.renderTournament();
				return;
			}
			this.onExitPingpong();
		});
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
		return `
			<div id="displayBoard">
				<div id="leftDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">0<div class="playerScoreStroke">${!this.clientInfo.gameInfo.teamLeftScore?0:this.clientInfo.gameInfo.teamLeftScore}</div></div>
					</div>
					<div class="playerAvatar"></div>
				</div>
				<div class="timeInfo">
					<div id="timeText">01 : 33</div>
				</div>
				<div id="rightDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">0<div class="playerScoreStroke">${!this.clientInfo.gameInfo.teamRightScore?0:this.clientInfo.gameInfo.teamRightScore}</div></div>
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

	_getGameOverModalHTML() {
		return `
			<div id="gameOverModal">
				<div id="contentBox">
					임시 게임 종료 화면
					<button class="generalButton">나가기</button>
				</div>
			</div>
		`;
	}
}

export default PingpongPageManager;
