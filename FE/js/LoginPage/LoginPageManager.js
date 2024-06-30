import { SERVER_ADDRESS } from "../PageRouter.js";
import { SERVER_PORT } from "../PageRouter.js";

class LoginPageManager {
	constructor(app, clientInfo, onLoginSuccess, onEnterSignupPage) {
		console.log("Login Page!");

		this.clientInfo = clientInfo;
		this.onLoginSuccess = onLoginSuccess;
		this.onEnterSignupPage = onEnterSignupPage;
		app.innerHTML = this._getHTML();
	}

	initPage() {
		this.idInput = document.querySelector('#idInput');
		this.pwInput = document.querySelector('#pwInput');
		this.idInput.addEventListener('input', this._updateLoginButton.bind(this));
		this.pwInput.addEventListener('input', this._updateLoginButton.bind(this));

		this.warning = document.querySelector('.warning');

		this.loginButton = document.querySelector('#loginButton');
		this.loginButton.disabled = true;
		this.loginButton.addEventListener('click', this._loginListener.bind(this));

		document.querySelector('#signupButton')
			.addEventListener('click', this.onEnterSignupPage);
	}

	_updateLoginButton() {
		if (this.idInput.value !== "" && this.pwInput.value !== "") {
			this.loginButton.disabled = false;
			this.loginButton.classList.remove('disabledButton');
			this.loginButton.classList.add('activatedButton');
		} else {
			this.loginButton.disabled = true;
			this.loginButton.classList.add('disabledButton');
			this.loginButton.classList.remove('activatedButton');
		}
	}

	async _loginListener(event) {
		// event.preventDefault();
		// const id = this.idInput.value;
		// const pw = this.pwInput.value;

		// try {
		// 	await this._loginRequest(id, pw);
		// 	const { socket, userData } = await this._connectGlobalSocket(id, pw);
		// 	const lobbySocket = await this._connectLobbySocket(id);

		// 	this.clientInfo.id = id;
		// 	this.clientInfo.nickname = userData.nickname;
		// 	this.clientInfo.avatarUrl = userData.avatarUrl;
		// 	this.clientInfo.socket = socket;
		// 	this.clientInfo.lobbySocket = lobbySocket;
		// 	this.onLoginSuccess();
		// } catch (error) {
		// 	this.warning.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
		// }
		this.onLoginSuccess();
	}

	async _loginRequest(id, pw) {
		const userData = {
			username: id,
			password: pw
		}
		const url = `http://${SERVER_ADDRESS}:${SERVER_PORT}/login`;
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(userData)
			})
			console.log(response);
			console.log(response.headers.get('Authorization'));
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
		} catch (error) {
			throw error;
		}
	}

	async _connectGlobalSocket(id, pw) {
		const socket = new WebSocket(`ws://${SERVER_ADDRESS}:3001/ws/`);
		await new Promise((resolve) => {
			socket.addEventListener("open", () => {
				resolve();
			});
		});
		const initClientMessage = {
			event: "initClient",
			content: {
				cliendId: id,
				accessToken: this._getAccessTocken()
			},
		};
		socket.send(JSON.stringify(initClientMessage));
		const userData = await new Promise((resolve) => {
			socket.addEventListener(
				'message',
				function listener(messageEvent) {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "initClientResponse" && content.message === "OK") {
						socket.removeEventListener('message', listener);
						resolve({
							nickname: content.clientNickname,
							avatarUrl: content.clientAvatarUrl
						});
					}
				}.bind(this)
			);
		});
		return { socket, userData };
	}
	_getAccessTocken() {
		const cookieString = `; ${document.cookie}`;
		const parts = cookieString.split(`; accessToken=`);
		if (parts.length === 2) {
			return parts.pop().split(';').shift();
		}
		return null;
	}

	async _connectLobbySocket(id) {
		const lobbySocket = new WebSocket(
			`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`
		);
		await new Promise((resolve) => {
			lobbySocket.addEventListener('open', () => {
				resolve();
			});
		});
		const enterLobbyMessage = {
			event: "enterLobby",
			content: {
				cliendId: id,
			},
		};
		lobbySocket.send(JSON.stringify(enterLobbyMessage));
		await new Promise((resolve) => {
			lobbySocket.addEventListener(
				'message',
				function (messageEvent) {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "enterLobbyResponse" && content.message === "OK") {
						lobbySocket.removeEventListener('message', listener);
						resolve();
					}
				}.bind(this)
			);
		});
	}

	_getHTML() {
		return `
			<div id="container">
				<img id="logoImg" src="images/logo.png">
				<form>
					<div id="inputContainer">
						<div class="warning"></div>
						<input class="input" type="text" id="idInput" placeholder="아이디를 입력해주세요.">
						<input class="input" type="password" id="pwInput" placeholder="비밀번호를 입력해주세요.">
					</div>
					<div id="buttonContainer">
						<button class="disabledButton" id="loginButton">로그인</button>
						<button id="signupButton" type="button">회원가입</button>
					</div>
				</form>
			</div>
		`;
	}
}

export default LoginPageManager;