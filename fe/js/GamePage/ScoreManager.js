class ScoreManager {
	constructor(clientInfo, onWin) { // TODO 여기서 win 메시지도 보내면 어떨까
		this.clientInfo = clientInfo;
		this.onWin = onWin;
		this.winnigScore = 5;

		this.leftTeam = {
			score: 0,
		}
		this.rightTeam = {
			score: 0,
		}
	}

	getScore(teamString) {
		const team = teamString === 'left' ? this.leftTeam : this.rightTeam;
		team.score += 1;
		this._sendUpdateScoreMsg(teamString, team.score);

		if (team.score === this.winnigScore) {
			this.onWin();
			this._sendWinGameMsg(teamString);
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

export default ScoreManager;