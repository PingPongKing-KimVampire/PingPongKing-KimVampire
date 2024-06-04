import OrientationEventHandler from "./OrientationEventHandler.js";
import GameOrientationObserver from "./GameOrientationObserver.js";

class GameObjectRenderer {
	constructor(clientInfo, playerList, gameInfo) {
		this.clientInfo = clientInfo;
		this.players = [];
		this.me = null;

		this.setGameSizeInfo(gameInfo);
		this.setPlayers(playerList);

		this.manageMessageEvent();

		this.ball = document.querySelector('.ball');

		// TODO : 공/패들의 위치 기억하기
		// this.renderBall({0, 0});
		// this.renderPaddle();
		
		this.gameContainer = document.querySelector('#gameContainer');
		this.VCPercent = 90;

		this.orientationEventHandler = new OrientationEventHandler();
		const updateOrientationObserver = new GameOrientationObserver(this.updateOrientation.bind(this));
		this.orientationEventHandler.subscribe(updateOrientationObserver);
		this.orientationEventHandler.notify();
	}

	manageMessageEvent() {
		this.clientInfo.socket.addEventListener('message', (messageEvent) => {
			const message = JSON.parse(messageEvent.data);
			const { sender, receiver, event, content } = message;
			// TODO : 혹시 roomId도 확인해야 하나?
			if (receiver.includes('player')) {
				if (event === 'updatePaddleLocation') { // 패들 위치 변경
					this.renderPaddle(content);
				} else if (event === 'updateBallLocation') { // 공 위치 변경
					this.renderBall(content);
				}
			}
		});
	}

	setGameSizeInfo(gameInfo) {
		this.boardWidth = gameInfo.boardWidth;
		this.boardHeight = gameInfo.boardHeight;
		this.gameContainerRatio = this.boardWidth / this.boardHeight;
		this.paddleHeightPercent = gameInfo.paddleHeight / this.boardHeight * 100;
		this.paddleWidthPercent = gameInfo.paddleWidth / this.boardWidth * 100;
		this.ballSizePercent = gameInfo.ballRadius*2 / this.boardWidth * 100;
	}

	setPlayers(playerList) {
		console.log('setPlayers', playerList);
		const leftBoard = document.querySelector('.subPlayBoard:nth-of-type(1)');
		const rightBoard = document.querySelector('.subPlayBoard:nth-of-type(2');
		for (const {clientId, team} of playerList) {
			const player = {
				id: clientId,
				team: team,
				paddle: this.createPaddle(team, leftBoard, rightBoard), // 패들 생성하기
			}
			this.players.push(player);
			console.log('setPlayer', clientId, this.clientInfo.id);
			if (clientId === this.clientInfo.id)
				this.me = player;
		}
	}

	createPaddle(team, leftBoard, rightBoard) {
		const paddle = document.createElement('div');
		paddle.classList.add('paddle');
		if (team === 'left') {
			leftBoard.appendChild(paddle);
		} else {
			rightBoard.appendChild(paddle);
		}
		return paddle;
	}

	updateOrientation(orientation) {
		this.orientation = orientation;
		this.updateGameContainer();
		// this.renderBall();
		// this.renderPaddle();
	}

	renderBall({xPosition, yPosition}) {
		if (this.orientation === 'portrait') {
			this.ball.style.height = `${this.ballSizePercent}%`;
			this.ball.style.width = 'auto';
		} else if (this.orientation === 'landscape') {
			this.ball.style.width = `${this.ballSizePercent}%`;
			this.ball.style.height = 'auto';
		}
		this.ball.style.aspectRatio = '1/1';

		const yPercent = yPosition / this.boardHeight * 100;
		const xPercent = xPosition / this.boardWidth * 100;
		if (this.orientation === 'portrait') {
			this.ball.style.top = this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
			this.ball.style.left = `${100 - yPercent}%`;
		} else if (this.orientation === 'landscape') {
			this.ball.style.top = `${yPercent}%`;
			this.ball.style.left = this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
		}
		this.ball.style.transform = `translate(-50%, -50%)`;
	}

	renderPaddle({clientId, xPosition, yPosition}) {
		const yPercent = yPosition / this.boardHeight * 100;
		const xPercent = (xPosition - this.boardWidth / 2) / (this.boardWidth / 2) * 100;

		const player = this.players.find(player => player.id === clientId);
		// TODO : paddle의 height, width를 매번 재설정해 줄 필요가 있을까?
		if (this.orientation === 'portrait') {
			player.paddle.style.height = `${this.paddleWidthPercent * 2}%`;
			player.paddle.style.width = `${this.paddleHeightPercent}%`;
			player.paddle.style.top = this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
			player.paddle.style.left = `${100 - yPercent}%`;
		} else if (this.orientation === 'landscape') {
			player.paddle.style.height = `${this.paddleHeightPercent}%`;
			player.paddle.style.width = `${this.paddleWidthPercent * 2}%`;
			player.paddle.style.top = `${yPercent}%`;
			player.paddle.style.left = this.me.team === 'right' ? `${xPercent}%` : `${100 - xPercent}%`;
		}
		player.paddle.style.transform = `translate(-50%, -50%)`;
	}

	updateGameContainer() {
		const ratio = this.gameContainerRatio;
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