class PingpongRoomPageManager {
	constructor(app, clientInfo) {
		if (clientInfo.isReferee) {
			app.innerHTML = this._getHTMLForReferre();
			// 공 움직이기
			const sendBallButton = document.querySelector('.sendBallButton');
			sendBallButton.addEventListener('click', () => {
				const ballMessage = {
					sender: "referee",
					receiver: ["player"],
					event: "updateBallLocation",
					content: {
						xPosition: 23.412, //percentage
						yPosition: 32.412, //percentage
						roomId: clientInfo.roomId,
						clientId: clientInfo.id,
					}
				}
				clientInfo.socket.send(JSON.stringify(ballMessage));
			})
		} else {
			app.innerHTML = this._getHTML();
		}

		// 패들 움직이기
		const movePaddleButton = document.querySelector('.movePaddleButton');
		movePaddleButton.addEventListener('click', () => {
			const paddleMessage = {
				sender: "player",
				receiver: [
					"player",
					"referee"
				],
				event: "updatePaddleLocation",
				content: {
					roomId: clientInfo.roomId,
					clientId: clientInfo.id,
					xPosition: 23.412,
					yPosition: 32.412
				}
			}
			clientInfo.socket.send(JSON.stringify(paddleMessage));
		});

		clientInfo.socket.addEventListener('message', (messageEvent) => {
			const message = JSON.parse(messageEvent.data);
			const { sender, receiver, event, content } = message;

			if (receiver.includes('player')) {
				console.log('player가 메시지를 받음', message);
			}
		})
	}

	_getHTML() {
		return `
			<button class="movePaddleButton">패들 움직이기</button>
		`;
	}

	_getHTMLForReferre() {
		return `
			<button class="movePaddleButton">패들 움직이기</button>
			<button class="sendBallButton">공 위치 브로드캐스팅</button>
		`;
	}
}

export default PingpongRoomPageManager;