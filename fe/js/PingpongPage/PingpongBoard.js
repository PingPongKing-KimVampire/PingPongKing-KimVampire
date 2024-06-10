import Ball from './Ball.js';

class PingpongBoard {
	constructor(clientInfo, players, sizeInfo) {
		this.clientInfo = clientInfo;
		this.players = this._setPlayers(players);
		this.sizeInfo = sizeInfo;

		this.turn = 'right';
		this.isWaitingServe = true;
		this.isEnableServe = false; // TODO : 원활한 서브를 위한 변수 (이후 구현하기)
		this.waitServeIntervalID = null;

		const ballSpeed = 2;
		this.ball = new Ball(ballSpeed, this.sizeInfo.ballRadius);

		this.clientInfo.socket.addEventListener('message', this.listener);
	}

	_setPlayers(players) {
		return players.map((player) => {
			return {
				id: player.id,
				nickname: player.nickname, // TODO : 필요없으면 빼기
				team: player.team,
				paddle: { x: 0, y: 0 },
			}
		});
	}

	listener = (messageEvent) => { // TODO : 게임 종료 시 해제하기
		const message = JSON.parse(messageEvent.data);
		const { sender, receiver, event, content } = message;
		if (receiver.includes('referee') && event === 'updatePaddleLocation') {
			this._updatePaddlePosition(content); // 패들 위치 변경
		}
	}

	// 패들 정보 업데이트
	_updatePaddlePosition({ clientId, yPosition, xPosition }) {
		const player = this.players.find(player => player.id === clientId);
		if (player) {
			player.paddle.y = yPosition;
			player.paddle.x = xPosition;
		}
	}

	// 서브 관련 처리

	setBallSubPosition() { // 현재 서브팀 앞으로 공 가져다두기
		let ballInitX = this.sizeInfo.boardWidth / 2;
		let ballInitAngle;
		if (this.turn === 'left') {
			ballInitX -= this.sizeInfo.boardWidth / 4;
			ballInitAngle = 180;
		} else if (this.turn === 'right') {
			ballInitX += this.sizeInfo.boardWidth / 4;
			ballInitAngle = 0;
		}
		this.ball.initBall(ballInitX, this.sizeInfo.boardHeight / 2, ballInitAngle);
		this._sendBallUpdateMsg();
	}

	startWaitServe(onServe) { // 서브 기다리기
		this.isWaitingServe = true;
		this.isEnableServe = false;
		const player = this.players.find((player) => player.team === this.turn);
		this.waitServeIntervalID = setInterval(this._handleServe.bind(this, player, onServe));
	}

	_handleServe(player, onServe) { // 서브 감지 및 처리하기
		const ballPosition = this._calculateBallPosition();
		if (this._isDetectedServe(player, ballPosition)) {
			this.isWaitingServe = false;
			clearInterval(this.waitServeIntervalID);
			onServe();
		}
	}

	// 공 움직임 및 충돌 관리

	_moveBall(onRoundOver) {
		// 시간 측정
		// let curTime = new Date().getTime();
		// let elapsedTime = curTime - this.startTime;
		// console.log("Elapsed time: " + elapsedTime + " ms");

		this.ball.yPos += this.ball.dy;
		this.ball.xPos += this.ball.dx;

		this._handlePaddleCollision(); // 공 - 패들 충돌 처리
		this._handleWallCollision(onRoundOver); // 공 - 벽 충돌 처리
		this._sendBallUpdateMsg(); // 공 위치 브로드캐스팅
	}

	_handlePaddleCollision() { // 공 - 패들 충돌 처리
		const ballPosition = this._calculateBallPosition();
		for (const player of this.players) {
			if (player.team != this.turn)
				continue;
			if (this._isDetectedPaddle(player, ballPosition)) {
				this.turn = player.team === 'right' ? 'left' : 'right';
				this.ball.reversalRandomDx();
				break;
			}
		}
	}

	_handleWallCollision(onRoundOver) { // 공 - 벽 충돌 처리
		const dir = this._isDetectedWall();
		if (dir === 'top' || dir === 'bottom') {
			this.ball.reversalDy();
		} else if (dir === 'left' || dir === 'right') {
			const scoreTeam = dir === 'left' ? 'right' : 'left';
			this.turn = scoreTeam;
			onRoundOver(scoreTeam);
		}
	}

	_sendBallUpdateMsg() { // 공 위치 브로드캐스팅
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

	_calculateBallPosition() { // _isDetectedPaddle 호출을 위한 볼 위치 정보 구하기
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
		return { ballPrevX, ballNextX, ballPrevY, ballNextY };
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

	_isDetectedPaddle(player, ballPos) {
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

	_isDetectedServe(player, ballPos) // TODO : 패들이 완벽히 공의 뒤에 있을 때만 서브 가능하기
	{
		// if (this.gameInfo.isEnableServe && this._isDetectedPaddle(player, this.sizeInfo, ballPos) === true) {
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
}

export default PingpongBoard;