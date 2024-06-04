class RefereeSocketHandler {
	constructor(clientInfo, referee) {
		this.clientInfo = clientInfo;
		this.referee = referee;
		this.manageMessageEvent();
	}

	// TODO : 삭제할 수 있도록 listener 분리하기
	_manageMessageEvent() {
		this.clientInfo.socket.addEventListener('message', (messageEvent) => {
			const message = JSON.parse(messageEvent.data);
			const { sender, receiver, event, content } = message;

			if (receiver.includes('referee')) {
				console.log('referee가 메시지를 받음', message);
				if (event === 'enterPingpongRoom') { // 탁구장 입장 요청
					this._manageEnterRoom(content);
				} else if (event === 'updatePaddleLocation') { // 패들 위치 변경
					this.referee.updatePaddlePosition(content);
				}
			}
		})
	}

	_manageEnterRoom(roomId, clientId, clientNickname) {
		if (this.players.length === 2) { // 입장 불가 // TODO : 모드에 따라 인원 수 설정
			this._sendEnterImpossibleMsg(roomId);
		} else { // 입장 가능
			this.referee.addPlayer(clientId, clientNickname);
			this._sendEnterPossibleMsg(roomId, clientId);
			if (this.players.length === 2) {
				this._sendStartGameMsg();
				this.referee.startGame();
			}
		}
	}
	
	_sendEnterImpossibleMsg(roomId) {
		const impossibleMessage = {
			sender: "server",
			receiver: ["client"],
			event: "noRoom",
			content: {
				roomId,
			}
		}
		this.clientInfo.socket.send(JSON.stringify(impossibleMessage));
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
				clientList: clientList,
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

	
}

export default RefereeSocketHandler;