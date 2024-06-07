import ScoreManager from './ScoreManager.js';
import Ball from "./Ball.js";

class Referee {
	constructor(clientInfo) {
		this.boardWidth = 1550;
		this.boardHeight = 1000;
		this.paddleHeight = 150;
		this.paddleWidth = 15;
		this.ballRadius = 25;

		this.clientInfo = clientInfo;
		this.players = [];
		this._manageMessageEvent();

		this.isPlaying = false;
		this.isEnd = false;
		this.ballSubWaited = true;
		this.enableSub = false;
		this.turn = 'right';
		this.subTeam = 'right';
		this.ballMoveIntervalID = null;
		this.waitSubIntervalID = null;
		this.scoreManager = null;

		const ballSpeed = 2;
		this.ball = new Ball(ballSpeed, this.ballRadius);
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
			// console.log('sendEnterPossibleMsg');
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
			paddle: {
				x: 0,
				y: 0,
			},
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
					boardWidth: this.boardWidth,
					boardHeight: this.boardHeight,
					paddleWidth: this.paddleWidth,
					paddleHeight: this.paddleHeight,
					ballRadius: this.ballRadius,
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
		this._detectWall();
		this._detectPaddle();
		this._sendBallUpdateMsg(); // 실시간으로 볼 위치 알리기
	}

	_detectWall() {
		if (this.ball.getRightX() >= this.boardWidth) {
			this.scoreManager.getScore('left');
			this.subTeam = 'left';
			this._stopRound();
			console.log(this.isEnd);
			if (!this.isEnd)
				this._readyRound();
			return;
		}
		if (this.ball.getLeftX() <= 0) {
			this.scoreManager.getScore('right');
			this.subTeam = 'right';
			this._stopRound();
			if (!this.isEnd)
				this._readyRound();
			return;
		}

		if (
			this.ball.getBottomY() >= this.boardHeight ||
			this.ball.getTopY() <= 0
		) {
			this.ball.dy = -this.ball.dy;
		}
	}

	_detectPaddle() {
		let ballPrevX;
		let ballNextX;
		if (this.turn === 'right') {
			ballPrevX = this.ball.getLeftX() - this.ball.dx;
			ballNextX = this.ball.getRightX();
		} else if (this.turn === 'left') {
			ballPrevX = this.ball.getRightX() - this.ball.dx;
			ballNextX = this.ball.getLeftX();
		}
		const ballPrevY = this.ball.yPos - this.ball.dy;
		const ballNextY = this.ball.yPos;

		for (const player of this.players) { // 현재 턴인 팀의 패들에 대해 충돌 감지
			if (player.team !== this.turn) continue;
			const paddle = player.paddle;
			const paddleTop = paddle.y - this.paddleHeight / 2;
			const paddleBot = paddle.y + this.paddleHeight / 2;
			if ((player.team === 'right' && ballPrevX <= paddle.x && paddle.x <= ballNextX) ||
				(player.team === 'left' && paddle.x <= ballPrevX && ballNextX <= paddle.x)) {
				const firstXRatio = (paddle.x - ballPrevX) / (ballNextX - ballPrevX);
				const ballYDiff = ballNextY - ballPrevY;
				const collisionY = ballPrevY + firstXRatio * ballYDiff;
				if (paddleTop <= collisionY && collisionY <= paddleBot) {
					this.turn = player.team === 'right' ? 'left' : 'right';
					this.ball.reversalRandomDx();
				}
			}
		}
	}

	_isDetected() {
		let ballPrevX;
		let ballNextX;
		if (this.turn === 'right') {
			ballPrevX = this.ball.getLeftX() - this.ball.dx;
			ballNextX = this.ball.getRightX();
		} else if (this.turn === 'left') {
			ballPrevX = this.ball.getRightX() - this.ball.dx;
			ballNextX = this.ball.getLeftX();
		}
		const ballPrevY = this.ball.yPos - this.ball.dy;
		const ballNextY = this.ball.yPos;

		for (const player of this.players) { // 현재 턴인 팀의 패들에 대해 충돌 감지
			if (player.team !== this.turn) continue;
			const paddle = player.paddle;
			const paddleTop = paddle.y - this.paddleHeight / 2;
			const paddleBot = paddle.y + this.paddleHeight / 2;
			if ((player.team === 'right' && ballPrevX <= paddle.x && paddle.x <= ballNextX) ||
				(player.team === 'left' && paddle.x <= ballPrevX && ballNextX <= paddle.x)) {
				const firstXRatio = (paddle.x - ballPrevX) / (ballNextX - ballPrevX);
				const ballYDiff = ballNextY - ballPrevY;
				const collisionY = ballPrevY + firstXRatio * ballYDiff;
				if (paddleTop <= collisionY && collisionY <= paddleBot) {
					return (true);
				}
			}
		}
		return (false);
	}

	_detectSub(paddle) // TODO : 패들이 완벽히 공의 뒤에 있을 때만 서브 가능하게
	{
		// if (this.enableSub && this._isDetected() === true) {
		if (this._isDetected() === true) {
			this.ball.reversalRandomDx();
			this.ballSubWaited = false;
			clearInterval(this.waitSubIntervalID);
			this._startRound();
			return;
		}
		// if (this.subTeam === 'right') {
		// 	if (paddle.x - this.paddleWidth/2 >= this.ball.getRightX()) {
		// 		this.enableSub = true;
		// 	} else {
		// 		this.enableSub = false;
		// 	}
		// } else if (this.subTeam === 'left') {
		// 	if (paddle.x + this.paddleWidth/2 <= this.ball.getLeftX()) {
		// 		this.enableSub = true;
		// 	} else {
		// 		this.enableSub = false;
		// 	}
		// }
	}

	_startRound() {
		this.isPlaying = true;
		// this.turn = this.subTeam;
		this.ballMoveIntervalID = setInterval(this._moveBall.bind(this));
	}

	_stopRound() {
		this.isPlaying = false;
		clearInterval(this.ballMoveIntervalID);
	}

	_readyRound() {
		// 현재 서브팀 앞으로 공 가져다두기
		let ballInitX = this.boardWidth / 2;
		let ballInitAngle;
		if (this.subTeam === 'left') {
			ballInitX -= this.boardWidth / 4;
			ballInitAngle = 0;
		} else {
			ballInitX += this.boardWidth / 4;
			ballInitAngle = 180;
		}
		this.ball.initBall(ballInitX, this.boardHeight / 2, ballInitAngle);
		this.ballSubWaited = true;
		this._sendBallUpdateMsg();
		this.turn = this.subTeam;
		this._startWaitSub();
	}

	_startWaitSub() {
		const paddle = this.players.find((player) => player.team === this.subTeam).paddle;
		this.enableSub = false;
		this.waitSubIntervalID = setInterval(this._detectSub.bind(this, paddle));
	}

	winGame() {
		this.isEnd = true;
	}

}

export default Referee;
