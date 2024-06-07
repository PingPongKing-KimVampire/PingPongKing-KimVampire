import ScoreManager from './ScoreManager.js';
import Ball from "./Ball.js";

class Referee {
	constructor(clientInfo) {
		this.sizeInfo = {
			boardWidth: 1550,
			boardHeight: 1000,
			paddleHeight: 150,
			paddleWidth: 15,
			ballRadius: 25,
		}

		this.clientInfo = clientInfo;
		this.players = [];
		this._manageMessageEvent();

		this.gameInfo = {
			isGameEnd: false,
			isWaitingServe: true,
			isEnableServe: false, // TODO : 아직 쓰이지 않음, 이후 구현하기
			turn: 'right',
		}

		this.ballMoveIntervalID = null;
		this.waitSubIntervalID = null;
		this.scoreManager = null;

		const ballSpeed = 2;
		this.ball = new Ball(ballSpeed, this.sizeInfo.ballRadius);
	}

	// TODO : 삭제할 수 있도록 listener 분리하기
	_manageMessageEvent() {
		this.clientInfo.socket.addEventListener('message', (messageEvent) => {
			const message = JSON.parse(messageEvent.data);
			const { sender, receiver, event, content } = message;

			if (receiver.includes('referee')) {
				// console.log('referee가 메시지를 받음', message);
				if (event === 'enterPingpongRoom') { // 탁구장 입장 요청
					this._manageEnterRoom(content);
				} else if (event === 'updatePaddleLocation') { // 패들 위치 변경
					this._updatePaddlePosition(content);
				}
			}
		})
	}

	_manageEnterRoom({ roomId, clientId, clientNickname }) {
		if (this.players.length === 2) { // 입장 불가 // TODO : 모드에 따라 인원 수 설정
			// this._sendEnterImpossibleMsg(roomId);
			// TODO : 입장 불가 메시지 전달
		} else { // 입장 가능
			this._addPlayer(clientId, clientNickname);
			this._sendEnterPossibleMsg(roomId, clientId);
			if (this.players.length === 2) {
				this.scoreManager = new ScoreManager(this.clientInfo, this.winGame.bind(this));
				this._sendStartGameMsg();
				this._readyRound();
			}
		}
	}

	// _sendEnterImpossibleMsg(roomId) {
	// 	const impossibleMessage = {
	// 		sender: "server",
	// 		receiver: ["client"],
	// 		event: "noRoom",
	// 		content: {
	// 			roomId,
	// 		}
	// 	}
	// 	this.clientInfo.socket.send(JSON.stringify(impossibleMessage));
	// }

	_addPlayer(id, nickname) {
		let team = this.players.length ? 'right' : 'left'; // 처음 입장하면 left, 나중에 입장하면 right로 임시 설정
		const player = {
			id: id,
			nickname: nickname,
			team: team,
			paddle: { x: 0, y: 0 },
		}
		this.players.push(player);
	}

	_sendEnterPossibleMsg(roomId, clientId) {
		const possibleMessage = {
			sender: "referee",
			receiver: ["server", "client"],
			event: "enterPingpongRoomResponse",
			content: {
				roomId,
				clientId
			}
		}
		this.clientInfo.socket.send(JSON.stringify(possibleMessage));
	}

	_sendStartGameMsg() {
		const clientList = this.players.map(player => ({
			clientId: player.id,
			clientNickname: player.nickname,
			team: player.team,
		}));
		const startMessage = {
			sender: "referee",
			receiver: ["player"],
			event: "startGame",
			content: {
				roomId: this.clientInfo.roomId,
				playerList: clientList,
				gameInfo: {
					boardWidth: this.sizeInfo.boardWidth,
					boardHeight: this.sizeInfo.boardHeight,
					paddleWidth: this.sizeInfo.paddleWidth,
					paddleHeight: this.sizeInfo.paddleHeight,
					ballRadius: this.sizeInfo.ballRadius,
				}
			}
		};
		this.clientInfo.socket.send(JSON.stringify(startMessage));
	}

	_updatePaddlePosition({ clientId, yPosition, xPosition }) {
		const player = this.players.find(player => player.id === clientId);
		if (player) {
			player.paddle.y = yPosition;
			player.paddle.x = xPosition;
		}
	}

	_sendBallUpdateMsg() {
		const ballMessage = {
			sender: "referee",
			receiver: ["player"],
			event: "updateBallLocation",
			content: {
				xPosition: this.ball.xPos,
				yPosition: this.ball.yPos,
				roomId: this.clientInfo.roomId,
				clientId: this.clientInfo.id,
			}
		}
		this.clientInfo.socket.send(JSON.stringify(ballMessage));
	}

	_moveBall() {
		// 시간 측정
		// let curTime = new Date().getTime();
		// let elapsedTime = curTime - this.startTime;
		// console.log("Elapsed time: " + elapsedTime + " ms");

		this.ball.yPos += this.ball.dy;
		this.ball.xPos += this.ball.dx;
		
		this._handleWallCollision(); // 벽 감지 및 처리
		this._handlePaddleCollision(); // 패들 감지 및 처리
		this._sendBallUpdateMsg(); // 실시간으로 볼 위치 알리기
	}

	// 벽 감지 & 처리하기
	_handleWallCollision() {
		const dir = this._isDetectedWall();
		if (dir === 'top' || dir === 'bottom') {
			this.ball.reversalDy();
		} else if (dir === 'left' || dir === 'right') {
			const scoreTeam = dir === 'left' ? 'right' : 'left';
			this.scoreManager.addScore(scoreTeam);
			this.gameInfo.turn = scoreTeam;
			this._stopRound();
			if (!this.gameInfo.isGameEnd)
				this._readyRound();
		}
	}
	_isDetectedWall() {
		if (this.ball.getRightX() >= this.sizeInfo.boardWidth)
			return 'right';
		if (this.ball.getLeftX() <= 0)
			return 'left';
		if (this.ball.getBottomY() >= this.sizeInfo.boardHeight)
			return 'bottom';
		if (this.ball.getTopY() <= 0)
			return 'top';
		return null;
	}

	
	// 패들 감지 & 처리하기
	_handlePaddleCollision() {
		const ballPosition = this._calculateBallPosition();
		for (const player of this.players) {
			if (this._isDetectedPaddle(player, ballPosition)) {
				this.gameInfo.turn = player.team === 'right' ? 'left' : 'right';
				this.ball.reversalRandomDx();
				break;
			}
		}
	}
	_calculateBallPosition() { // 패들 감지를 위한 볼 위치 정보 구하기
		let ballPrevX;
		let ballNextX;
		if (this.gameInfo.turn === 'right') {
			ballPrevX = this.ball.getLeftX() - this.ball.dx;
			ballNextX = this.ball.getRightX();
		} else if (this.gameInfo.turn === 'left') {
			ballPrevX = this.ball.getRightX() - this.ball.dx;
			ballNextX = this.ball.getLeftX();
		}
		const ballPrevY = this.ball.yPos - this.ball.dy;
		const ballNextY = this.ball.yPos;
		return { ballPrevX, ballNextX, ballPrevY, ballNextY };
	}
	_isDetectedPaddle(player, ballPos) {
		if (player.team != this.gameInfo.turn) return; // 현재 턴인 팀의 플레이어 패들만 감지
		const paddle = player.paddle;
		const paddleTop = paddle.y - this.sizeInfo.paddleHeight / 2;
		const paddleBot = paddle.y + this.sizeInfo.paddleHeight / 2;
		const { ballPrevX, ballNextX, ballPrevY, ballNextY } = ballPos;
		if ((player.team === 'right' && ballPrevX <= paddle.x && paddle.x <= ballNextX) ||
			(player.team === 'left' && paddle.x <= ballPrevX && ballNextX <= paddle.x)) {
			const firstXRatio = (paddle.x - ballPrevX) / (ballNextX - ballPrevX);
			const ballYDiff = ballNextY - ballPrevY;
			const collisionY = ballPrevY + firstXRatio * ballYDiff;
			if (paddleTop <= collisionY && collisionY <= paddleBot) {
				return true;
			}
		}
		return false;
	}

	// 서브 감지 & 처리하기
	_handleSub(player) {
		if (this._isDetectedSub(player)) {
			this.ball.reversalRandomDx(); // TODO : 이거 안 하고 각도 원상복구?
			this.gameInfo.isWaitingServe = false;
			clearInterval(this.waitSubIntervalID);
			this._startRound();
		}
	}
	_isDetectedSub(player) // TODO : 패들이 완벽히 공의 뒤에 있을 때만 서브 가능하기
	{
		const ballPos = this._calculateBallPosition();
		// if (this.gameInfo.isEnableServe && this._isDetectedPaddle(player, ballPos) === true) {
		if (this._isDetectedPaddle(player, ballPos) === true) {
			return true;
		}
		return false;
		// if (this.gameInfo.turn === 'right') {
		// 	if (paddle.x - this.sizeInfo.paddleWidth/2 >= this.ball.getRightX())
		// 		this.gameInfo.isEnableServe = true;
		// 	else
		// 		this.gameInfo.isEnableServe = false;
		// } else if (this.gameInfo.turn === 'left') {
		// 	if (paddle.x + this.sizeInfo.paddleWidth/2 <= this.ball.getLeftX())
		// 		this.gameInfo.isEnableServe = true;
		// 	else
		// 		this.gameInfo.isEnableServe = false;
		// }
	}

	// 라운드 시작 / 끝
	_startRound() {
		this.ballMoveIntervalID = setInterval(this._moveBall.bind(this));
	}
	_stopRound() {
		clearInterval(this.ballMoveIntervalID);
	}

	// 다음 라운드 준비 (서브 준비)
	_readyRound() {
		// 현재 서브팀 앞으로 공 가져다두기
		let ballInitX = this.sizeInfo.boardWidth / 2;
		let ballInitAngle;
		if (this.gameInfo.turn === 'left') {
			ballInitX -= this.sizeInfo.boardWidth / 4;
			ballInitAngle = 0;
		} else if (this.gameInfo.turn === 'right') {
			ballInitX += this.sizeInfo.boardWidth / 4;
			ballInitAngle = 180;
		}
		this.ball.initBall(ballInitX, this.sizeInfo.boardHeight / 2, ballInitAngle);
		this.gameInfo.isWaitingServe = true;
		this._sendBallUpdateMsg();
		// 서브 기다리기
		this._startWaitSub();
	}
	_startWaitSub() {
		const player = this.players.find((player) => player.team === this.gameInfo.turn);
		this.gameInfo.isEnableServe = false;
		this.waitSubIntervalID = setInterval(this._handleSub.bind(this, player));
	}

	winGame() {
		this.gameInfo.isGameEnd = true;
	}

}

export default Referee;
