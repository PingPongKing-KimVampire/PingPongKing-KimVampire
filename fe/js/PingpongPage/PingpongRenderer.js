import windowObservable from '../../WindowObservable.js';

class PingpongRenderer {
	constructor(clientInfo) {
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
					ballRadius: null,
				},
				teamLeftAbility: null,
				teamRightAbility: null,
			},
		};
		// const playerInfo = {
		// 	clientId: null,
		// 	clientNickname: null,
		// 	readyState: null
		// }
		this.clientInfo = clientInfo;

		//하드코딩
		// this.clientInfo.gameInfo.teamLeftAbility = 'ghostSmasher';

		this._initPingpongRenderer();
		this._setDisplayBoard(
			this.clientInfo.gameInfo.teamLeftMode,
			this.clientInfo.gameInfo.teamRightMode,
			this.clientInfo.gameInfo.teamLeftList.length,
			this.clientInfo.gameInfo.teamRightList.length
		);
		this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener(
			'message',
			this.listener
		);
		this._subscribeWindow();
		this._updateGameContainer();
	}

	_initPingpongRenderer() {
		this.players = [];
		this.me = null;

		this.ball = {
			element: document.querySelector('.ball'),
			xPos: 50,
			yPos: 50,
		};

		this._setGameSizeInfo();
		this._setPlayers(
			this.clientInfo.gameInfo.teamLeftList,
			this.clientInfo.gameInfo.teamRightList
		);
		this.gameContainer = document.querySelector('#gameContainer');
		this.VCPercent = 90;
		this.orientation = windowObservable.getOrientation();
		this.leftScore = document.querySelector('#leftDisplayBoard .playerScore');
		this.rightScore = document.querySelector('#rightDisplayBoard .playerScore');
		this.leftBoard = document.querySelector('.subPlayBoard:nth-of-type(1)');
		this.rightBoard = document.querySelector('.subPlayBoard:nth-of-type(2)');
	}

	_setDisplayBoard(
		leftMode,
		rightMode,
		leftTotalPlayerCount,
		rightTotalPlayerCount
	) {
		this._setDisplayName(leftMode, rightMode);
		this._setDisplayAvatar(leftTotalPlayerCount, rightTotalPlayerCount);
	}
	_setDisplayName(leftMode, rightMode) {
		const leftName = document.querySelector('#leftDisplayBoard .playerName');
		const rightName = document.querySelector('#rightDisplayBoard .playerName');

		if (this.me.team === 'left') {
			leftName.innerText = leftMode;
			rightName.innerText = rightMode;
		} else {
			rightName.innerText = leftMode;
			leftName.innerText = rightMode;
		}
	}
	_setDisplayAvatar(leftTotalPlayerCount, rightTotalPlayerCount) {
		const leftAvatar = document.querySelector(
			'#leftDisplayBoard .playerAvatar'
		);
		const rightAvatar = document.querySelector(
			'#rightDisplayBoard .playerAvatar'
		);

		const appendImage = (avatar, src, count = 1) => {
			for (let i = 0; i < count; i++) {
				const img = document.createElement('img');
				img.src = src;
				img.style.maxWidth = `${100 / count}%`;
				avatar.appendChild(img);
			}
		};
		appendImage(leftAvatar, 'images/playerA.png', leftTotalPlayerCount);
		appendImage(rightAvatar, 'images/playerB.png', rightTotalPlayerCount);
	}

	listener = (messageEvent) => {
		const message = JSON.parse(messageEvent.data);
		const { event, content } = message;
		if (event === 'notifyPaddleLocationUpdate') {
			// 패들 위치 변경
			this._updatePaddle(content);
			this._renderPaddle(content);
		} else if (event === 'notifyBallLocationUpdate') {
			// 공 위치 변경
			this._updateBall(content);
			this._renderBall(content);
		} else if (event === 'notifyScoreUpdate') {
			// 점수 변경
			this._updateScore(content);
		} else if (event === 'notifyGameEnd') {
			// 게임 승리
			this._endGame(content);
		} else if (event === 'notifyGameGiveUp') {
			// 누군가의 기권 선언
			this._removePlayer(content);
		} else if (event === 'notifyUnghostBall') {
			if (this._isVampire(this.me)) {
				this._makeBallTranslucent();
			} else {
				this._makeBallTransparent();
			}
		} else if (event === 'notifyUnghostBall') {
			this._makeBallOpaque();
		}
	};

	//반투명
	_makeBallTranslucent() {
		this.ball.element.style.opcacity = '0.5';
	}

	//불투명
	_makeBallOpaque() {
		this.ball.element.style.opcacity = '1';
	}

	//투명
	_makeBallTransparent() {
		this.ball.element.style.opcacity = '0';
	}

	_isVampire(player) {
		const team = player.team;
		if (team === 'left')
			return this.clientInfo.gameInfo.teamLeftMode === 'vampire';
		else if (team === 'right')
			return this.clientInfo.gameInfo.teamRightMode === 'vampire';
	}

	removeListener() {
		this.clientInfo.gameInfo.pingpongRoomSocket.removeEventListener(
			'message',
			this.listener
		);
	}

	_subscribeWindow() {
		this.updateGameContainerRef = this._updateGameContainer.bind(this);
		windowObservable.subscribeResize(this.updateGameContainerRef);
		this.updateOrientationRef = this._updateOrientation.bind(this);
		windowObservable.subscribeOrientationChange(this.updateOrientationRef);
	}

	unsubscribeWindow() {
		windowObservable.unsubscribeResize(this.updateGameContainerRef);
		windowObservable.unsubscribeOrientationChange(this.updateOrientationRef);
	}

	_setGameSizeInfo() {
		this.boardWidth = this.clientInfo.gameInfo.sizeInfo.boardWidth;
		this.boardHeight = this.clientInfo.gameInfo.sizeInfo.boardHeight;
		this.gameContainerRatio = this.boardWidth / this.boardHeight;
		this.ballSizePercent =
			((this.clientInfo.gameInfo.sizeInfo.ballRadius * 2) / this.boardWidth) *
			100;
	}

	_setPlayers(teamLeftList, teamRightList) {
		const board = document.querySelector('#playBoard');
		for (const {
			clientId,
			clientNickname,
			ability,
			paddleHeight,
			paddleWidth,
		} of teamLeftList) {
			const player = {
				id: clientId,
				nickName: clientNickname,
				team: 'left',
				ability,
				paddleHeight,
				paddleWidth,
				paddle: {
					element: this._createPaddle(board), // 패들 생성하기
					xPos: 0,
					yPos: 0,
				},
			};
			this.players.push(player);
			if (clientId === this.clientInfo.id) this.me = player;
			console.log(this.me);
			console.log(this.clientInfo.gameInfo);
		}
		for (const {
			clientId,
			clientNickname,
			ability,
			paddleHeight,
			paddleWidth,
		} of teamRightList) {
			const player = {
				id: clientId,
				nickName: clientNickname,
				team: 'right',
				ability,
				paddleHeight,
				paddleWidth,
				paddle: {
					element: this._createPaddle(board), // 패들 생성하기
					xPos: 0,
					yPos: 0,
				},
			};
			this.players.push(player);
			if (clientId === this.clientInfo.id) this.me = player;
		}
	}

	_removePlayer({ clientId }) {
		const playerToRemove = this.players.find(
			(player) => player.id === clientId
		);
		playerToRemove.paddle.element.remove();
		this.players = this.players.filter((player) => player.id !== clientId);
	}

	_createPaddle(board) {
		const paddle = document.createElement('div');
		paddle.classList.add('paddle');
		board.appendChild(paddle);
		return paddle;
	}

	_updateOrientation(orientation) {
		this.orientation = orientation;
		this._updateGameContainer();
		this._renderBall({ xPosition: this.ball.xPos, yPosition: this.ball.yPos });
		this.players.forEach((player) =>
			this._renderPaddle({
				clientId: player.id,
				xPosition: player.paddle.xPos,
				yPosition: player.paddle.yPos,
			})
		);
	}

	_updatePaddle({ clientId, xPosition, yPosition }) {
		const player = this.players.find((player) => player.id === clientId);
		if (player) {
			player.paddle.xPos = xPosition;
			player.paddle.yPos = yPosition;
		}
	}

	_updateBall({ xPosition, yPosition }) {
		this.ball.xPos = xPosition;
		this.ball.yPos = yPosition;
	}

	_renderBall({ xPosition, yPosition }) {
		if (this.orientation === 'portrait') {
			this.ball.element.style.height = `${this.ballSizePercent}%`;
			this.ball.element.style.width = 'auto';
		} else if (this.orientation === 'landscape') {
			this.ball.element.style.width = `${this.ballSizePercent}%`;
			this.ball.element.style.height = 'auto';
		}
		this.ball.element.style.aspectRatio = '1/1';

		const yPercent = (yPosition / this.boardHeight) * 100;
		const xPercent = (xPosition / this.boardWidth) * 100;
		if (this.orientation === 'portrait') {
			this.ball.element.style.top =
				this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
			this.ball.element.style.left = `${100 - yPercent}%`;
		} else if (this.orientation === 'landscape') {
			this.ball.element.style.top = `${yPercent}%`;
			this.ball.element.style.left =
				this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
		}
		this.ball.element.style.transform = `translate(-50%, -50%)`;
	}

	_renderPaddle({ clientId, xPosition, yPosition }) {
		const yPercent = (yPosition / this.boardHeight) * 100;
		const xPercent = (xPosition / this.boardWidth) * 100;

		const player = this.players.find((player) => player.id === clientId);

		// TODO : paddle의 height, width를 매번 재설정해 줄 필요가 있을까?
		// player.paddle.element.style.color = "blue";
		const paddleHeightPercent = (player.paddleHeight / this.boardHeight) * 100;
		const paddleWidthPercent = (player.paddleWidth / this.boardWidth) * 100;
		if (this.orientation === 'portrait') {
			player.paddle.element.style.height = `${paddleWidthPercent}%`;
			player.paddle.element.style.width = `${paddleHeightPercent}%`;
			player.paddle.element.style.top =
				this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
			player.paddle.element.style.left = `${100 - yPercent}%`;
		} else if (this.orientation === 'landscape') {
			player.paddle.element.style.height = `${paddleHeightPercent}%`;
			player.paddle.element.style.width = `${paddleWidthPercent}%`;
			player.paddle.element.style.top = `${yPercent}%`;
			player.paddle.element.style.left =
				this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
		}
		player.paddle.element.style.transform = `translate(-50%, -50%)`;
	}

	_updateScore({ team, score }) {
		const updatedHTML = `${score}<div class="playerScoreStroke">${score}</div>`;
		if (team === this.me.team) {
			this.rightScore.innerHTML = updatedHTML;
		} else {
			this.leftScore.innerHTML = updatedHTML;
		}
	}

	_endGame({ winTeam }) {
		const winBoard =
			this.me.team === winTeam ? this.rightBoard : this.leftBoard;
		const loseBoard = this.me.team === team ? this.leftBoard : this.rightBoard;
		winBoard.style.backgroundColor = 'blue';
		loseBoard.style.backgroundColor = 'red';
	}

	_updateGameContainer() {
		const ratio = this.gameContainerRatio;
		if (this.orientation === 'portrait') {
			// 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
			if (window.innerHeight / window.innerWidth < ratio) {
				this.gameContainer.style.height = `${this.VCPercent}vh`;
				this.gameContainer.style.width = `${this.VCPercent / ratio}vh`;
			} else {
				// 뷰포트 높이가 충분함 -> 뷰포트 너비 기준
				this.gameContainer.style.width = `${this.VCPercent}vw`;
				this.gameContainer.style.height = `${this.VCPercent * ratio}vw`;
			}
		} else if (this.orientation === 'landscape') {
			// 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
			if (window.innerWidth / window.innerHeight < ratio) {
				this.gameContainer.style.width = `${this.VCPercent}vw`;
				this.gameContainer.style.height = `${this.VCPercent / ratio}vw`;
			} else {
				// 뷰포트 너비가 충분함 -> 뷰포트 높이 기준
				this.gameContainer.style.height = `${this.VCPercent}vh`;
				this.gameContainer.style.width = `${this.VCPercent * ratio}vh`;
			}
		}
	}
}

export default PingpongRenderer;
