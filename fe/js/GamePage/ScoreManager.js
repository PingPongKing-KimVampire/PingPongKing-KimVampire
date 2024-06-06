class ScoreManager {
	constructor(clientInfo, winnigScore, onWin, players) {
		this.clientInfo = clientInfo;
		this.winnigScore = winnigScore;
		this.onWin = onWin;

		this.leftTeam = {
			score: 0,
		}
		this.rightTeam = {
			score: 0,
		}
	}

	getScore(teamString) {
		// console.log(`${teamString} get score!`);

		const team = teamString === 'left' ? this.leftTeam : this.rightTeam;
		team.score += 1;
		this._sendUpdateScoreMsg(teamString, team.score);

		if (team.score === this.winnigScore) {
			this.onWin(teamString);
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



}

export default ScoreManager;