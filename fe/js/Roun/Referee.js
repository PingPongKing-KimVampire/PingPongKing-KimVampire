import Ball from "../GamePage/Ball.js";

// - Referee와 RefereeSocketManager는 양방향 연관 관계가 될 수 없다.
// - RefereeSocketManager가 Referee를 프로퍼티로 가질까?

class Referee {
	constructor(clientInfo) {
		this.boardWidth = 1550;
		this.boardHeight = 1000;
		this.paddleHeight = 150;
		this.paddleWidth = 15;
		this.ballRadius = 25;

		this.clientInfo = clientInfo;
		this.players = [];
		this.manageMessageEvent();

		this.isPlaying = false;
		this.turn = 'right';
		this.ballMoveIntervalID = null;

		const ballFirstAngle = 20;
		const ballSpeed = 8;
		this.ball = new Ball(ballFirstAngle, ballSpeed, this.ballRadius);
		this.ball.initBall(this.boardWidth, this.boardHeight);
	}

	// // TODO : 삭제할 수 있도록 listener 분리하기
	// manageMessageEvent() {
	// 	this.clientInfo.socket.addEventListener('message', (messageEvent) => {
	// 		const message = JSON.parse(messageEvent.data);
	// 		const { sender, receiver, event, content } = message;

	// 		if (receiver.includes('referee')) {
	// 			console.log('referee가 메시지를 받음', message);
	// 			if (event === 'enterPingpongRoom') { // 탁구장 입장 요청
	// 				this.manageEnterRoom(content);
	// 			} else if (event === 'updatePaddleLocation') { // 패들 위치 변경
	// 				this.updatePaddlePosition(content);
	// 			}
	// 		}
	// 	})
	// }

	// manageEnterRoom(roomId, clientId, clientNickname) {
	// 	if (this.players.length === 2) { // 입장 불가 // TODO : 모드에 따라 인원 수 설정
	// 		this.sendEnterImpossibleMsg(roomId);
	// 	} else { // 입장 가능
	// 		this.addPlayer(clientId, clientNickname);
	// 		this.sendEnterPossibleMsg(roomId, clientId);
	// 		if (this.players.length === 2) {
	// 			this.sendStartGameMsg();
	// 			this.startGame();
	// 		}
	// 	}
	// }
	
	// sendEnterImpossibleMsg(roomId) {
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

	addPlayer(id, nickname) {
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

	// sendEnterPossibleMsg(roomId, clientId) {
	// 	const possibleMessage = {
	// 		sender: "referee",
	// 		receiver: ["server", "client"],
	// 		event: "enterPingpongRoomResponse",
	// 		content: {
	// 			roomId,
	// 			clientId
	// 		}
	// 	}
	// 	this.clientInfo.socket.send(JSON.stringify(possibleMessage));
	// }

	// sendStartGameMsg() {
	// 	const clientList = this.players.map(player => ({
	// 		clientId: player.id,
	// 		clientNickname: player.nickname,
	// 		team: player.team,
	// 	}));
	// 	const startMessage = {
	// 		sender: "referee",
	// 		receiver: ["player"],
	// 		event: "startGame",
	// 		content: {
	// 			roomId: this.clientInfo.roomId,
	// 			clientList: clientList,
	// 			gameInfo: {
	// 				boardWidth: this.boardWidth,
	// 				boardHeight: this.boardHeight,
	// 				paddleWidth: this.paddleWidth,
	// 				paddleHeight: this.paddleHeight,
	// 				ballRadius: this.ballRadius,
	// 			}
	// 		}
	// 	};
	// 	this.clientInfo.socket.send(JSON.stringify(startMessage));
	// }

	startGame() {
		if (this.isPlaying) return;

		this.startTime = new Date().getTime();

		this.isPlaying = true;
		this.turn = 'right';
		this.ball.initBall(this.boardWidth, this.boardHeight);
		this.ballMoveIntervalID = setInterval(this._moveBall.bind(this));
	}

	updatePaddlePosition(clientId, yPosition, xPosition) {
		const player = this.players.find(player => player.id === clientId);
		if (player) {
			player.paddle.y = yPosition;
			player.paddle.x = xPosition;
		}
	}

	sendBallUpdateMsg() {
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
		this.sendBallUpdateMsg(); // 실시간으로 볼 위치 알리기
	}

	_detectWall() {
		if (this.ball.getRightX() >= this.boardWidth) {
			this._stopGame();
			return;
		}

		if (this.ball.getLeftX() <= 0) {
			this.isMyTurn = true;
			this.ball.dx = -this.ball.dx;
		}

		if (
			this.ball.getBottomY() >= this.boardHeight ||
			this.ball.getTopY() <= 0
		) {
			this.ball.dy = -this.ball.dy;
		}
	}

	_stopGame() {
		this.isPlaying = false;
		clearInterval(this.ballMoveIntervalID);
		this.ball.initBall(this.boardWidth, this.boardHeight);
		this.sendBallUpdateMsg();
	}

	_detectPaddle() {
		const ballPrevX = this.ball.getLeftX() - this.ball.dx;
		const ballNextX = this.ball.getRightX();
		const ballPrevY = this.ball.yPos - this.ball.dy;
		const ballNextY = this.ball.yPos;

		for (player of this.players) { // 현재 턴인 팀의 패들에 대해 충돌 감지
			if (player.team !== this.turn) continue;
			const paddle = player.paddle;
			const paddleTop = paddle.y - this.paddleHeight / 2;
			const paddleBot = paddle.y + this.paddleHeight / 2;
			if ((player.team === 'right' && ballPrevX <= paddle.x && paddle.x <= ballNextX) ||
				(player.team === 'left' && paddle.x <= ballPrevX && ballNextX <= paddle.x))
			{
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
}

export default Referee;
