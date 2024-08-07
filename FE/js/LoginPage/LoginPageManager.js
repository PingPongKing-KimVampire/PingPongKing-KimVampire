import { SERVER_ADDRESS } from "../PageRouter.js";
import { SERVER_PORT } from "../PageRouter.js";

class LoginPageManager {
	constructor(app, clientInfo, renderPage) {
		console.log("Login Page!");

		this.clientInfo = clientInfo;
		this.renderPage = renderPage;
		this.app = app;
	}

	connectPage() {
		// 이미 웹소켓에 연결되어 있는 사용자는 어떻게 처리할 것인가? 로비페이지로 라우팅?
		// 네이버는 그냥 내비둔다. 네이버를 따라하자.
	}

	clearPage() {}

	initPage() {
		this.app.innerHTML = this._getHTML();
		this.idInput = document.querySelector("#idInput");
		this.pwInput = document.querySelector("#pwInput");
		this.idInput.addEventListener("input", this._updateLoginButton.bind(this));
		this.pwInput.addEventListener("input", this._updateLoginButton.bind(this));

		this.warning = document.querySelector(".warning");

		this.loginButton = document.querySelector("#loginButton");
		this.loginButton.disabled = true;
		this.loginButton.addEventListener("click", this._loginListener.bind(this));

		document.querySelector("#signupButton").addEventListener("click", () => {
			if (this.isAttemptingLogin) return;
			this.renderPage("signup");
		});
		this.isAttemptingLogin = false;
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
		if (this.isAttemptingLogin) return;
		this.isAttemptingLogin = true;

		const id = this.idInput.value;
		const pw = this.pwInput.value;
		try {
			await this._loginRequest(id, pw);
			const { socket, userData } = await this._connectGlobalSocket(id, pw);

			this.clientInfo.id = userData.id;
			this.clientInfo.nickname = userData.nickname;
			this.clientInfo.avatarUrl = userData.avatarUrl;
			this.clientInfo.socket = socket;
			this.clientInfo.friendInfo = await this._getFriendInfo(this.clientInfo.socket);
			this.clientInfo.accessToken = this.accessToken;
			this._setFriendInfoNotifyListener(this.clientInfo.socket);
			this._setInviteListener(this.clientInfo.socket);
			this.handleSocketDisconnection(this.clientInfo.socket);

			this.renderPage("chatting");
			this.renderPage("lobby");
		} catch (error) {
			this.warning.textContent = error.message;
			this.isAttemptingLogin = false;
		}
	}

	async _loginRequest(id, pw) {
		const userData = {
			username: id,
			password: pw,
		};
		const url = `http://${SERVER_ADDRESS}:${SERVER_PORT}/api/login`;
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
		const socket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/`, ["authorization", this.accessToken]);
		await new Promise(resolve => {
			socket.addEventListener("open", () => {
				resolve();
			});
		});
		const initClientMessage = {
			event: "initClient",
			content: {
				clientId: id,
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
							nickname: content.nickname,
							avatarUrl: content.avatarUrl,
							id: content.id,
						});
					}
				}.bind(this),
			);
		});
		return { socket, userData };
	}

	async _getFriendInfo(socket) {
		const [friendList, clientListWhoFriendRequestedMe, clientListIFriendRequested, clientListIBlocked] = await Promise.all([
			this._getFriendList(socket),
			this._getClientListWhoFriendRequestedMe(socket),
			this._getClientListIFriendRequested(socket),
			this._getClientListIBlocked(socket),
		]);

		return {
			friendList,
			clientListWhoFriendRequestedMe,
			clientListIFriendRequested,
			clientListIBlocked,
		};
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

	_setInviteListener(socket) {
		let isModalActive = false;
		socket.addEventListener("message", messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (event === "notifyGameInviteArrive") {
				const disableInvitePageList = ["waitingRoom", "pingpong", "waitingTournament", "tournament", "login", "signup"];
				if (disableInvitePageList.includes(this.clientInfo.currentPage)) return;
				if (isModalActive) return;
				isModalActive = true;
				const questionModalElement = document.createElement("div");
				questionModalElement.classList.add("questionModal");
				questionModalElement.style.display = "flex";
				questionModalElement.innerHTML = `
				<div class="questionBox">
					<div class="title"></div>
					<div class="question"> 당신의 친구 ${content.clientNickname}님이 초대하셨습니다.<br>도전을 받아들일까용?</div>
					<div class="buttonGroup">
						<button class="activatedButton">네</button>
						<button class="activatedButton">아니오</button>
					</div>
	  			</div>
				`;
				const yesButtonElement = questionModalElement.querySelector(".activatedButton:nth-of-type(1)");
				const noButtonElement = questionModalElement.querySelector(".activatedButton:nth-of-type(2)");
				yesButtonElement.addEventListener("click", e => {
					e.stopPropagation();
					this.clientInfo.gameInfo = {
						roomId: content.waitingRoomInfo.roomId,
						title: content.waitingRoomInfo.title,
						teamLeftMode: content.waitingRoomInfo.leftMode,
						teamRightMode: content.waitingRoomInfo.rightMode,
						teamLeftTotalPlayerCount: 1,
						teamRightTotalPlayerCount: content.waitingRoomInfo.maxPlayerCount - 1,
					};
					isModalActive = false;
					questionModalElement.remove();
					this.renderPage("waitingRoom");
				});
				noButtonElement.addEventListener("click", e => {
					e.stopPropagation();
					isModalActive = false;
					questionModalElement.remove();
				});
				this.app.append(questionModalElement);
			}
		});
	}

	handleSocketDisconnection(socket) {
		socket.addEventListener("close", () => {
			this.renderPage("error");
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
