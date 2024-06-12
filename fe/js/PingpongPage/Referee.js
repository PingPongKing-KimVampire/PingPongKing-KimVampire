import PingpongBoard from "./PingpongBoard.js";

class Referee {
	constructor(clientInfo, players) {
		const sizeInfo = {
			boardWidth: 1550,
			boardHeight: 1000,
			paddleHeight: 150,
			paddleWidth: 15,
			ballRadius: 25,
		};

		this.clientInfo = clientInfo;

		this.clientInfo.socket.addEventListener('message', this.listener);
		this._sendStartGameMsg(players, sizeInfo);

		this.scoreInfo = {
			winningScore: 5,
			left: 0,
			right: 0,
		};

		this.ballMoveIntervalID = null;
		this.pingpongBoard = new PingpongBoard(clientInfo, players, sizeInfo);
		this._readyRound();
	}

	listener = (messageEvent) => {
		const message = JSON.parse(messageEvent.data);
		const { sender, receiver, event, content } = message;
		if (receiver.includes('referee') && event === 'giveUpGame') {
			this._giveUpGame(content);
		}
	}

	_sendStartGameMsg(players, sizeInfo) {
		// 게임 시작 메시지 보내기
		const clientList = players.map((player) => ({
			clientId: player.id,
			clientNickname: player.nickname,
			team: player.team,
		}));
		const startMessage = {
			sender: "referee",
			receiver: ["player", "server"],
			event: "startGame",
			content: {
				roomId: this.clientInfo.roomId,
				playerList: clientList,
				sizeInfo,
			},
		};
		this.clientInfo.socket.send(JSON.stringify(startMessage));
	}

	// 다음 라운드 준비 (서브 준비)
	_readyRound() {
		this.pingpongBoard.setBallSubPosition(); // 현재 서브팀 앞으로 공 가져다두기
		this.pingpongBoard.startWaitServe(this._startRound.bind(this)); // 서브 기다리기
		// 서브가 감지되면 _startRound 호출
	}

	// 라운드 시작
	_startRound() {
		this.ballMoveIntervalID = setInterval(
			this.pingpongBoard._moveBall.bind(
				this.pingpongBoard,
				this._isOverRound.bind(this)
			)
			// 공이 왼/오 벽과 충돌하면 _isOverRound 호출
		);
	}
	_isOverRound(scoreTeam) {
		this._stopRound();
		this._updateScore(scoreTeam);
		if (this._isDecidedWinner(scoreTeam) === true) {
			this._endGame(scoreTeam);
		} else {
			this._readyRound();
		}
	}

	// 라운드 끝
	_stopRound() {
		clearInterval(this.ballMoveIntervalID);
	}

	// 점수 관리

	_updateScore(scoreTeam) {
		if (scoreTeam === "left") {
			this.scoreInfo.left += 1;
			this._sendUpdateScoreMsg("left", this.scoreInfo.left);
		} else {
			this.scoreInfo.right += 1;
			this._sendUpdateScoreMsg("right", this.scoreInfo.right);
		}
	}

	_sendUpdateScoreMsg(team, score) {
		const updateScoreMessage = {
			sender: "referee",
			receiver: ["player"],
			event: "updateScore",
			content: {
				roomId: this.clientInfo.roomId,
				team,
				score,
			},
		};
		this.clientInfo.socket.send(JSON.stringify(updateScoreMessage));
	}

	// 승패 및 게임 종료 관리

	_isDecidedWinner(scoreTeam) {
		if (
			this.scoreInfo.left === this.scoreInfo.winningScore ||
			this.scoreInfo.right === this.scoreInfo.winningScore
		) {
			return true;
		}
		return false;
	}

	_giveUpGame({ clientId }) {
		const players = this.pingpongBoard.players;
		const giveUpTeam = players.find((player) => player.id === clientId).team;
		const sameTeamPlayers = players.filter((player) => player.team === giveUpTeam);
		if (sameTeamPlayers.length === 1) { // 핑퐁을 완전히 종료
			const winTeam = giveUpTeam === 'left' ? 'right' : 'left';
			this._endGame(winTeam);
		} else { // 기권을 쓴 플레이어만 제거
			this.pingpongBoard.removePlayer(clientId);
		}
	}

	_endGame(winTeam) {
		this._sendWinGameMsg(winTeam);
		this.pingpongBoard.removeListener.call(this.pingpongBoard);
		this.clientInfo.socket.removeEventListener('message', this.listener);
		setTimeout(this._sendCloseRoomMsg.bind(this), 3000); // 승패 결정 3초 후에 탁구장 폐쇄 메시지 전송
	}

	_sendWinGameMsg(team) {
		const winGameMessage = {
			sender: "referee",
			receiver: ["player"],
			event: "winGame",
			content: {
				team,
				roomId: this.clientInfo.roomId,
			},
		};
		this.clientInfo.socket.send(JSON.stringify(winGameMessage));
	}

	_sendCloseRoomMsg() {
		const closeRoomMessage = {
			sender: "referee",
			receiver: ["player", "server"],
			event: "closePingpongRoom",
			content: {
				 roomId: this.clientInfo.roomId,
				 closeReason: "gameManagerDisconnected" // TODO : reason을 뭐라고 적어야 하지?
			}
		}
		this.clientInfo.socket.send(JSON.stringify(closeRoomMessage));
	}
}

export default Referee;
