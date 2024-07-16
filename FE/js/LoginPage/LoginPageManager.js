import { SERVER_ADDRESS } from "../PageRouter.js";
import { SERVER_PORT } from "../PageRouter.js";
import { _connectLobbySocket } from "../connect.js";

class LoginPageManager {
	constructor(app, clientInfo, onLoginSuccess, onEnterSignupPage) {
		console.log("Login Page!");

		this.clientInfo = clientInfo;
		this.onLoginSuccess = onLoginSuccess;
		this.onEnterSignupPage = onEnterSignupPage;
		app.innerHTML = this._getHTML();
	}

	initPage() {
		this.idInput = document.querySelector("#idInput");
		this.pwInput = document.querySelector("#pwInput");
		this.idInput.addEventListener("input", this._updateLoginButton.bind(this));
		this.pwInput.addEventListener("input", this._updateLoginButton.bind(this));

		this.warning = document.querySelector(".warning");

		this.loginButton = document.querySelector("#loginButton");
		this.loginButton.disabled = true;
		this.loginButton.addEventListener("click", this._loginListener.bind(this));

		document.querySelector("#signupButton").addEventListener("click", this.onEnterSignupPage);
	}

	_updateLoginButton() {
		if (this.idInput.value !== "" && this.pwInput.value !== "") {
			this.loginButton.disabled = false;
			this.loginButton.classList.remove("disabledButton");
			this.loginButton.classList.add("activatedButton");
		} else {
			this.loginButton.disabled = true;
			this.loginButton.classList.add("disabledButton");
			this.loginButton.classList.remove("activatedButton");
		}
	}

	async _loginListener(event) {
		event.preventDefault();
		const id = this.idInput.value;
		const pw = this.pwInput.value;
		try {
			await this._loginRequest(id, pw);
			const { socket, userData } = await this._connectGlobalSocket(id, pw);
			const lobbySocket = await _connectLobbySocket(userData.id);

			this.clientInfo.id = userData.id;
			this.clientInfo.nickname = userData.nickname;
			this.clientInfo.avatarUrl = userData.avatarUrl;
			this.clientInfo.socket = socket;
			this.clientInfo.lobbySocket = lobbySocket;
			this.clientInfo.friendInfo = await this._getFriendInfo(this.clientInfo.socket);
			this._setFriendInfoNotifyListener(this.clientInfo.socket);

			this.onLoginSuccess();
		} catch (error) {
			this.warning.textContent = error.message;
		}
	}

	async _loginRequest(id, pw) {
		const userData = {
			username: id,
			password: pw,
		};
		const url = `http://${SERVER_ADDRESS}:${SERVER_PORT}/login`;
		let response;
		try {
			response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userData),
			});
		} catch (error) {
			throw new Error("서버의 응답이 없습니다.");
		}
		if (!response.ok) {
			if (400 <= response.status && response.status < 500) {
				throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
			} else if (500 <= response.status) {
				throw new Error("서버와의 연결이 불안정합니다.");
			}
		}
		const bearerAccessToken = response.headers.get("Authorization");
		const accessToken = bearerAccessToken.replace("Bearer ", "");
		if (!accessToken) throw new Error("서버와의 연결이 불안정합니다.");
		this.accessToken = accessToken;
	}

	async _connectGlobalSocket(id) {
		const socket = new WebSocket(`ws://${SERVER_ADDRESS}:3001/ws/`, ['authorization', this.accessToken]);
		await new Promise(resolve => {
			socket.addEventListener("open", () => {
				resolve();
			});
		});
		const initClientMessage = {
			event: "initClient",
			content: {
				clientId: id,
				accessToken: this.accessToken,
			},
		};
		socket.send(JSON.stringify(initClientMessage));
		const userData = await new Promise(resolve => {
			socket.addEventListener(
				"message",
				function listener(messageEvent) {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "initClientResponse" && content.message === "OK") {
						socket.removeEventListener("message", listener);
						resolve({
							nickname: content.clientNickname,
							avatarUrl: content.clientAvatarUrl,
							id: content.clientId,
						});
					}
				}.bind(this),
			);
		});
		return { socket, userData };
	}

	async _getFriendInfo(socket) {
		const friendInfo = {};
		//ToDo: Promise.all로 리팩토링
		friendInfo.friendList = await this._getFriendList(socket);
		friendInfo.clientListWhoFriendRequestedMe = await this._getClientListWhoFriendRequestedMe(socket);
		friendInfo.clientListIFriendRequested = await this._getClientListIFriendRequested(socket);
		friendInfo.clientListIBlocked = await this._getClientListIBlocked(socket);
		return friendInfo;
	}

	_getFriendList(socket) {
		const getFriendListMessage = {
			event: "getFriendList",
			content: {},
		};
		socket.send(JSON.stringify(getFriendListMessage));
		return new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getFriendListResponse" && content.message === "OK") {
					socket.removeEventListener("message", listener);
					resolve(content.clientList);
				}
			};
			socket.addEventListener("message", listener);
		});
	}

	_getClientListWhoFriendRequestedMe(socket) {
		const getClientListWhoFriendRequestedMeMessage = {
			event: "getClientListWhoFriendRequestedMe",
			content: {},
		};
		socket.send(JSON.stringify(getClientListWhoFriendRequestedMeMessage));
		return new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getClientListWhoFriendRequestedMeResponse" && content.message === "OK") {
					socket.removeEventListener("message", listener);
					resolve(content.clientList);
				}
			};
			socket.addEventListener("message", listener);
		});
	}

	_getClientListIFriendRequested(socket) {
		const getClientListIFriendRequestedMessage = {
			event: "getClientListIFriendRequested",
			content: {},
		};
		socket.send(JSON.stringify(getClientListIFriendRequestedMessage));
		return new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getClientListIFriendRequestedResponse" && content.message === "OK") {
					socket.removeEventListener("message", listener);
					resolve(content.clientList); // TODO : clientList 여야 하지 않을까?
				}
			};
			socket.addEventListener("message", listener);
		});
	}

	_getClientListIBlocked(socket) {
		const getClientListIBlockedMessage = {
			event: "getClientListIBlocked",
			content: {},
		};
		socket.send(JSON.stringify(getClientListIBlockedMessage));
		return new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getClientListIBlockedResponse" && content.message === "OK") {
					socket.removeEventListener("message", listener);
					resolve(content.clientList);
				}
			};
			socket.addEventListener("message", listener);
		});
	}

	_setFriendInfoNotifyListener(socket) {
		socket.addEventListener("message", messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);

			if (event === "notifyFriendRequestReceive") {
				//누군가 나에게 친구 요청
				this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.push(content.clientInfo);
			} else if (event === "notifyFriendRequestCanceled") {
				//누군가 나에게 친구 요청 취소
				this.clientInfo.friendInfo.clientListWhoFriendRequestedMe = this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.filter(client => client.id !== content.clientInfo.id);
			} else if (event === "notifyFriendRequestAccepted") {
				// 누군가 내 친구 요청을 수락
				const acceptedClient = this.clientInfo.friendInfo.clientListIFriendRequested.find(client => client.id === content.clientInfo.id);
				if (acceptedClient) {
					this.clientInfo.friendInfo.clientListIFriendRequested = this.clientInfo.friendInfo.clientListIFriendRequested.filter(client => client.id !== content.clientInfo.id);
					acceptedClient.chat = {
						recentTimestamp: null,
						unreadMessageCount: 0,
					};
					this.clientInfo.friendInfo.friendList.push(acceptedClient);
				}
			} else if (event === "notifyFriendRequestRejected") {
				// 누군가 내 친구 요청을 거절
				const rejectedClient = this.clientInfo.friendInfo.clientListIFriendRequested.find(client => client.id === content.clientInfo.id);
				if (rejectedClient) {
					this.clientInfo.friendInfo.clientListIFriendRequested = this.clientInfo.friendInfo.clientListIFriendRequested.filter(client => client.id !== content.clientInfo.id);
				}
			} else if (event === "notifyFriendDeleted") {
				// 누군가 나를 친구 삭제
				const deletedClient = this.clientInfo.friendInfo.friendList.find(client => client.id === content.clientInfo.id);
				if (deletedClient) {
					this.clientInfo.friendInfo.friendList = this.clientInfo.friendInfo.friendList.filter(client => client.id !== content.clientInfo.id);
				}
			} else if (event === "notifyMessageArrive") {
				// 채팅 메시지 도착
				let friend = this.clientInfo.friendInfo.friendList.find(friend => friend.id === content.sendClientId || friend.id === content.receiveClientId);
				friend.chat.recentMessage = content.message;
				friend.chat.recentTimestamp = content.timestamp;
				friend.chat.unreadMessageCount += 1; // TODO : chattingPage에서 알아서 0으로 초기화
			} else if (event === "notifyFriendActiveStateChange") {
				// 친구의 활성 상태 변경
				const friend = this.clientInfo.friendInfo.friendList.find(friend => friend.id === content.clientId);
				friend.activeState = content.activeState;
			}
		});
	}

	// _getAccessTocken() {
	// 	const cookieString = `; ${document.cookie}`;
	// 	const parts = cookieString.split(`; accessToken=`);
	// 	if (parts.length === 2) {
	// 		return parts.pop().split(';').shift();
	// 	}
	// 	return null;
	// }

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
