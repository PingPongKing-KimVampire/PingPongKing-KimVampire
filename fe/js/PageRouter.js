import PingpongPageManager from "./PingpongPage/PingpongPageManager.js";
import LoginPageManager from "./LoginPage/LoginPageManager.js";
import WaitingRoomCreationPageManager from "./LobbyPage/WaitingRoomCreationPageManager.js";
import NewLobbyPageManager from "./LobbyPage/LobbyPageManager.js";
import WaitingRoomPageManager from "./WaitingRoomPage/WaitingRoomPageManager.js";
import SignupPageManager from "./SignupPage/SignupPageManager.js";
import EditProfilePageManager from "./EdifProfilePage/EditProfilePageManager.js";
import FriendManagementPageManager from "./FriendManagementPage/FriendManagementPageManager.js";
import ChattingPageManager from "./ChattingPage/chattingPageManager.js";
import WaitingTournamentPageManager from "./TournamentPage/WaitingTournamentPageManager.js";
import ProfilePageManager from "./ProfilePage/ProfilePageManager.js";
import TournamentAnimationPageManager from "./TournamentPage/TournamentAnimationPageManager.js";

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
			currentPage: null,
			nextPage: null,
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
			tournamentInfo: null,
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
		if (url === "chatting") {
			this._loadCSS(["css/ChattingPage/chattingPage.css", "css/ChattingPage/friendList.css"]);
			const chattingPageManager = new ChattingPageManager(this.clientInfo);
			return;
		}
		try {
			this.clientInfo.nextPage = url;
			if (url === "login") {
				this._loadCSS(["css/LoginPage/LoginPage.css"]);
				this.nextPageManager = new LoginPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "signup") {
				this._loadCSS(["css/SignupPage/signupPage.css"]);
				this.nextPageManager = new SignupPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "lobby") {
				this._loadCSS(["css/LobbyPage/lobbyPage.css"]);
				this.nextPageManager = new NewLobbyPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "waitingRoomCreation") {
				this._loadCSS(["css/LobbyPage/waitingRoomCreationPage.css"]);
				this.nextPageManager = new WaitingRoomCreationPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "waitingRoom") {
				this._loadCSS(["css/WaitingRoomPage/waitingRoomPage.css", "css/WaitingRoomPage/abilitySelectionModal.css"]);
				this.nextPageManager = new WaitingRoomPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "pingpong") {
				this._loadCSS(["css/PingpongPage/pingpongPage.css"]);
				this.nextPageManager = new PingpongPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "profile") {
				this._loadCSS(["css/ProfilePage/profilePage.css"]);
				this.nextPageManager = new ProfilePageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "editProfile") {
				this._loadCSS(["css/EditProfilePage/editProfilePage.css"]);
				this.nextPageManager = new EditProfilePageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "friendManagement") {
				this._loadCSS(["css/FriendManagementPage/friendManagementPage.css"]);
				this.nextPageManager = new FriendManagementPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "waitingTournament") {
				this._loadCSS(["css/WaitingTournamentPage/waitingTournamentPage.css"]);
				this.nextPageManager = new WaitingTournamentPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			} else if (url === "tournament") {
				this._loadCSS(["css/TournamentPage/tournamentPage.css"]);
				this.nextPageManager = new TournamentAnimationPageManager(this.app, this.clientInfo, this.renderPage.bind(this));
			}
			await this.nextPageManager.connectPage();
			if (this.currentPageManager) await this.currentPageManager.clearPage();

			this.clientInfo.currentPage = url;
			this.currentPageManager = this.nextPageManager;
			this.nextPageManager = null;
			await this.currentPageManager.initPage();
		} catch (e) {
			console.log(e);
			this.clientInfo.nextPage = null;
			// 실패했을경우 nextPageManager에 대한 clearPage를 해야할까?
			// this.nextPageManager.clearPage();
			this.nextPage = null;
		}
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
