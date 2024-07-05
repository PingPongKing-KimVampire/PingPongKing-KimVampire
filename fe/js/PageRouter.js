import PingpongPageManager from "./PingpongPage/PingpongPageManager.js";
import LoginPageManager from "./LoginPage/LoginPageManager.js";
import WaitingRoomCreationPageManager from "./LobbyPage/WaitingRoomCreationPageManager.js";
import NewLobbyPageManager from "./LobbyPage/LobbyPageManager.js";
import WaitingRoomPageManager from "./WaitingRoomPage/WaitingRoomPageManager.js";
import SignupPageManager from "./SignupPage/SignupPageManager.js";
import EditProfilePageManager from "./EdifProfilePage/EditProfilePageManager.js";
import FriendManagementPageManager from "./FriendManagementPage/FriendManagementPageManager.js";
import ChattingPageManager from "./ChattingPage/chattingPageManager.js";

export const SERVER_ADDRESS = "127.0.0.1";
export const SERVER_PORT = "3001";

class PageRouter {
	constructor() {
		this.app = document.querySelector("#app");
		this.clientInfo = {
			socket: null,
			id: null,
			nickname: null,
			avatarUrl: null,
			lobbySocket: null,
			gameInfo: {
				pingpongRoomSocket: null,
				roomId: null,
				title: null,
				teamLeftList: null,
				teamRightList: null,
				teamLeftMode: null,
				teamRightMode: null,
				teamLeftTotalPlayerCount: null,
				teamRightTotalPlayerCount: null,
			},
			friendInfo: {
				friendList: [
					{
						id: null,
						nickname: null,
						avatarUrl: null,
						activeState: null,
						chat: {
							recentMessage: null,
							recentTimestamp: null,
							unreadMessageCount: null,
						},
					},
				],
				clientListWhoFriendRequestedMe: [
					{
						id: null,
						nickname: null,
						avatarUrl: null,
					},
				],
				clientListIFriendRequested: [
					{
						id: null,
						nickname: null,
						avatarUrl: null,
					},
				],
				clientListIBlocked: [
					{
						id: null,
						nickname: null,
						avatarUrl: null,
					},
				],
			},
		};
	}

	async renderPage(url) {
		if (url === "login") {
			this._loadCSS(["css/LoginPage/LoginPage.css"]);
			const loginPageManager = new LoginPageManager(this.app, this.clientInfo, this._onLoginSuccess.bind(this), this._onEnterSignup.bind(this));
			await loginPageManager.initPage();
		} else if (url === "lobby") {
			this._loadCSS(["css/LobbyPage/lobbyPage.css"]);
			const lobbyPageManager = new NewLobbyPageManager(this.app, this.clientInfo, this._onClickWatingRoomCreationButton.bind(this), this._onEnterWaitingRoom.bind(this), this._renderFriendManagementPage.bind(this));
			await lobbyPageManager.initPage();
		} else if (url === "waitingRoomCreation") {
			this._loadCSS(["css/LobbyPage/waitingRoomCreationPage.css"]);
			const waitingRoomCreationPageManager = new WaitingRoomCreationPageManager(this.app, this.clientInfo, this._onEnterWaitingRoom.bind(this));
		} else if (url === "pingpong") {
			this._loadCSS(["css/PingpongPage/pingpongPage.css"]);
			const pingpongPageManager = new PingpongPageManager(this.app, this.clientInfo, this._onExitPingpongGame.bind(this));
			await pingpongPageManager.initPage();
		} else if (url === "waitingRoom") {
			this._loadCSS(["css/WaitingRoomPage/waitingRoomPage.css", "css/WaitingRoomPage/abilitySelectionModal.css"]);
			const waitingRoomPageManager = new WaitingRoomPageManager(this.app, this.clientInfo, this._onStartPingpongGame.bind(this), this._onExitPingpongGame.bind(this));
		} else if (url === "signup") {
			this._loadCSS(["css/SignupPage/signupPage.css"]);
			const signupPageManager = new SignupPageManager(this.app, this.clientInfo, this._onSignupSuccess.bind(this));
		} else if (url === "editProfile") {
			this._loadCSS(["css/EditProfilePage/editProfilePage.css"]);
			const editProfilePageManager = new EditProfilePageManager(this.app, this.clientInfo);
		} else if (url === "friendManagement") {
			this._loadCSS(["css/FriendManagementPage/friendManagementPage.css"]);
			const friendManagementPageManager = new FriendManagementPageManager(this.app, this.clientInfo);
		} else if (url === "chatting") {
			this._loadCSS(["css/ChattingPage/chattingPage.css", "css/ChattingPage/friendList.css"]);
			const chattingPageManager = new ChattingPageManager(this.clientInfo);
		}
	}

	_onLoginSuccess() {
		this.renderPage("friendManagement");
	}

	_onEnterSignup() {
		this.renderPage("signup");
	}

	_onClickWatingRoomCreationButton() {
		this.renderPage("waitingRoomCreation");
	}

	_onEnterWaitingRoom() {
		this.renderPage("waitingRoom");
	}

	_onStartPingpongGame() {
		this.renderPage("pingpong");
	}

	_onExitPingpongGame() {
		this.renderPage("lobby");
	}

	_onSignupSuccess() {
		this.renderPage("login");
	}

	_renderFriendManagementPage() {
		this.renderPage("friendManagement");
	}

	_loadCSS(filenames) {
		// 동적으로 추가된 기존 CSS 파일 제거하기
		const existingLinks = document.querySelectorAll('link[data-dynamic="true"]');
		existingLinks.forEach(link => {
			link.remove();
		});
		// 새로운 CSS 파일 동적으로 추가
		filenames.forEach(filename => {
			const newLink = document.createElement("link");
			newLink.rel = "stylesheet";
			newLink.href = filename;
			newLink.setAttribute("data-dynamic", "true");
			document.head.appendChild(newLink);
		});
	}
}

export default PageRouter;
