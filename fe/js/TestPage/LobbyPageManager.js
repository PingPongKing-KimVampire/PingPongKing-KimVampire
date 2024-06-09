import WaitingRoom from "../GamePage/WaitingRoom.js";

class LobbyPageManager {
	constructor(app, clientInfo, onEnterSuccess) {
		console.log("Lobby Page!");
		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;
		this.onEnterSuccess = onEnterSuccess;
		this.enteredPlayers = [];

		// 탁구장 생성
		const createRoomButton = document.querySelector('.createButton');
		createRoomButton.addEventListener('click', () => {
			const createMessage = {
				sender: 'client',
				receiver: ['server'],
				event: 'createPingpongRoom',
				content: {
					clientId: `${clientInfo.id}`, // TODO : 로그인 페이지에서 입력 받은 아이디
				}
			}
			this.clientInfo.socket.send(JSON.stringify(createMessage));
		})

		// 탁구장 조회
		const getRoomButton = document.querySelector('.getRoomButton');
		getRoomButton.addEventListener('click', () => {
			const getRoomMessage = {
				sender: "client",
				receiver: ["server"],
				event: "getPingpongRoomList",
				content: {}
			}
			this.clientInfo.socket.send(JSON.stringify(getRoomMessage));
		});

		// 탁구장 입장
		const enterRoomButton = document.querySelector('.enterRoomButton');
		enterRoomButton.addEventListener('click', () => {
			const roomIdInput = document.querySelector('#roomIdInput');
			this.enterRoom(roomIdInput.value);
		})

		this.clientInfo.socket.addEventListener('message', this.listener);
	}

	listener = (messageEvent) => {
		const message = JSON.parse(messageEvent.data);
		const { sender, receiver, event, content } = message;
		// console.log(message);

		if (receiver.includes('client')) {
			if (event === 'appointReferee') { // 심판 임명 응답
				this.clientInfo.isReferee = true;
				this.clientInfo.roomId = content.roomId;
				// TODO : gameMode와 personnel도 전달하기
				const waitingRoom = new WaitingRoom(this.clientInfo);
				this.enterRoom(content.roomId);
			} else if (event === 'getPingpongRoomResponse') { // 탁구장 조회 응답
				console.log(content.roomIdList);
			} else if (event === 'enterPingpongRoomResponse') { // 탁구장 입장 응답
				console.log('enterPingpongRoomResponse', message);
				this.onEnterSuccess(content.roomId);
				this.clientInfo.socket.removeEventListener('message', this.listener);
			}
		}
	}

	enterRoom(roomId) {
		const enterMessage = {
			sender: "client",
			receiver: ["referee"],
			event: "enterPingpongRoom",
			content: {
				roomId,
				clientId: this.clientInfo.id,
				clientNickname: this.clientInfo.nickname
			}
		}
		this.clientInfo.socket.send(JSON.stringify(enterMessage));
	};

	_getHTML() {
		return `
			<button class="createButton">탁구장 생성</button>
			<input type="text" id="roomIdInput">
			<button class="enterRoomButton">탁구장 입장</button>
			<button class="getRoomButton">탁구장 조회</button>
		`;
	}
}

export default LobbyPageManager;