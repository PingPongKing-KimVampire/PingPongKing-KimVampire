import PingpongBoard from "./PingpongBoard.js";

class Referee {
	constructor(clientInfo, players) {
		const sizeInfo = {
			boardWidth: 1550,
			boardHeight: 1000,
			paddleHeight: 150,
			paddleWidth: 15,
			ballRadius: 25,
		}

		this.clientInfo = clientInfo;
		this._sendStartGameMsg(players, sizeInfo);

		this.scoreInfo = {
			winningScore: 5,
			left: 0,
			right: 0,
		}

		this.ballMoveIntervalID = null;
		this.pongBoard = new PingpongBoard(clientInfo, players, sizeInfo);
		this._readyRound();
	}

	_sendStartGameMsg(players, sizeInfo) { // 게임 시작 메시지 보내기
		const clientList = players.map(player => ({
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
					boardWidth: sizeInfo.boardWidth,
					boardHeight: sizeInfo.boardHeight,
					paddleWidth: sizeInfo.paddleWidth,
					paddleHeight: sizeInfo.paddleHeight,
					ballRadius: sizeInfo.ballRadius,
				}
			}
		};
		this.clientInfo.socket.send(JSON.stringify(startMessage));
	}

	// 다음 라운드 준비 (서브 준비)
	_readyRound() {
		this.pongBoard.setBallSubPosition(); // 현재 서브팀 앞으로 공 가져다두기
		this.pongBoard.startWaitServe(this._startRound.bind(this)); // 서브 기다리기
		// 서브가 감지되면 _startRound 호출
	}

	// 라운드 시작
	_startRound() {
		this.ballMoveIntervalID = setInterval(
			this.pongBoard._moveBall.bind(this.pongBoard, this._isOverRound.bind(this))
			// 공이 왼/오 벽과 충돌하면 _isOverRound 호출
		);
	}

	_isOverRound(scoreTeam) {
		this._stopRound();
		this._updateScore(scoreTeam);
		if (this._isDecidedWinner(scoreTeam) == false)
			this._readyRound();
	}

	// 라운드 끝
	_stopRound() {
		clearInterval(this.ballMoveIntervalID);
	}

	// 점수 관리
	_updateScore(scoreTeam) {
		if (scoreTeam === 'left') {
			this.scoreInfo.left += 1;
			this._sendUpdateScoreMsg('left', this.scoreInfo.left);
		} else {
			this.scoreInfo.right += 1;
			this._sendUpdateScoreMsg('right', this.scoreInfo.right);
		}
	}
	_sendUpdateScoreMsg(team, score) {
		const updateScoreMessage = {
			sender: "referee",
			receiver: ["player"],
			event: "updateScore",
			content: {
				roomId: this.clientInfo.roomId,
				team, // TODO : first/second 인가, left/right 인가?
				score,
			}
		}
		this.clientInfo.socket.send(JSON.stringify(updateScoreMessage));
	}

	// 승패 관리
	_isDecidedWinner(scoreTeam) {
		if (this.scoreInfo.left === this.scoreInfo.winningScore ||
			this.scoreInfo.right === this.scoreInfo.winningScore) {
			this._sendWinGameMsg(scoreTeam);
			return (true);
		}
		return (false);
	}
	_sendWinGameMsg(team) {
		const winGameMessage = {
			sender: "referee",
			receiver: ["player"],
			event: "winGame",
			content: {
				team, // TODO : first, second 인가 / left, right 인가?
				roomId: this.clientInfo.roomId,
			}
		}
		this.clientInfo.socket.send(JSON.stringify(winGameMessage));
	}
}

export default Referee;