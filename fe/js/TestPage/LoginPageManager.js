import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";

class LoginPageManager {
	constructor(app, clientInfo, onLoginSuccess) {
		console.log("Login Page!");
		this.clientInfo = clientInfo;
		app.innerHTML = this._getHTML();
		this._setRandomId();
		this._setRandomNickname();
		this.onLoginSuccess = onLoginSuccess;
	}

	async initPage() {
		const loginButton = document.querySelector("#loginButton");
		loginButton.addEventListener("click", this._loginListener.bind(this));
	}

	async _connectLobbySocket(id) {
		const lobbySocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`);
		await new Promise(resolve => {
			lobbySocket.addEventListener("open", () => {
				resolve();
			});
		});
		const enterLobbyMessage = {
			event: "enterLobby",
			content: {
				clientId: id,
			},
		};
		lobbySocket.send(JSON.stringify(enterLobbyMessage));

		await new Promise(resolve => {
			lobbySocket.addEventListener(
				"message",
				function listener(messageEvent) {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "enterLobbyResponse" && content.message === "OK") {
						lobbySocket.removeEventListener("message", listener);
						resolve();
					}
				}.bind(this),
			);
		});

		return lobbySocket;
	}

	async _loginListener(event) {
		event.preventDefault();
		const id = parseInt(document.querySelector("#id").value);
		if (isNaN(parseInt(id))) return;
		const nickname = document.querySelector("#nickname").value;
		const socket = await this._connectGlobalSocket(id, nickname);
		const lobbySocket = await this._connectLobbySocket(id);

		this.clientInfo.id = id;
		this.clientInfo.nickname = nickname;
		this.clientInfo.socket = socket;
		this.clientInfo.lobbySocket = lobbySocket;
		this.onLoginSuccess();
	}

	async _connectGlobalSocket(id, nickname) {
		const socket = new WebSocket(`ws://${SERVER_ADDRESS}:3001/ws/`);
		await new Promise(resolve => {
			socket.addEventListener("open", () => {
				resolve();
			});
		});

		const initClientMessage = {
			event: "initClient",
			content: {
				clientId: parseInt(id),
				clientNickname: nickname,
			},
		};
		socket.send(JSON.stringify(initClientMessage));
		await new Promise(resolve => {
			socket.addEventListener("message", messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "initClientResponse") {
					if (content.message === "OK") {
						resolve();
					}
				}
			});
		});

		return socket;
	}

	_setRandomId() {
		const idInput = document.querySelector("#id");
		const randomId = Math.floor(Math.random() * 1000000) + 1;
		idInput.value = randomId;
	}

	_setRandomNickname() {
		const nicknameInput = document.querySelector("#nickname");
		const characters = "가나다라마바사아자카파타하동해물과백두산이마르고닳도록하나님이보우하사우리나라만세";
		let randomNickname = "";
		for (let i = 0; i < 3; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length);
			randomNickname += characters[randomIndex];
		}
		nicknameInput.value = randomNickname;
	}

	_getHTML() {
		return `
		<form>
			<label for="id">아이디</label>
			<input id="id" type="text">
			<label for="nickname">닉네임</label>
			<input id="nickname" type="text">
			<button id="loginButton">로그인</button>
		</form>
		`;
	}
}

export default LoginPageManager;
