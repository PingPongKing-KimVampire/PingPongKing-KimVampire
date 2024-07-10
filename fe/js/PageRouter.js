import PingpongPageManager from './PingpongPage/PingpongPageManager.js';
import LoginPageManager from './TestPage/LoginPageManager.js';
import WaitingRoomCreationPageManager from './LobbyPage/WaitingRoomCreationPageManager.js';
import NewLobbyPageManager from './LobbyPage/LobbyPageManager.js';
import WaitingRoomPageManager from './WaitingRoomPage/WaitingRoomPageManager.js';
import WaitingTournamentPageManager from './TournamentPage/WaitingTournamentPageManager.js';

import TournamentPageManager from './TournamentPage/TournamentPageManager.js';

export const SERVER_ADDRESS = '127.0.0.1';
export const SERVER_PORT = '3001';

class PageRouter {
	constructor() {
		this.app = document.querySelector('#app');
		// this.clientInfo = {
		//   socket: null,
		//   id: null,
		//   nickname: null,
		//   lobbySocket: null,
		//   gameInfo: {
		//     pingpongRoomSocket: null,
		//     roomId: null,
		//     title: null,
		//     teamLeftList: null,
		//     teamRightList: null,
		//     teamLeftMode: null,
		//     teamRightMode: null,
		//     teamLeftTotalPlayerCount: null,
		//     teamRightTotalPlayerCount: null,
		//   },
		// };

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
				teamLeftAbility: null,
				teamRightAbility: null,
			},
			tournamentInfo: null, // TODO : 토너먼트에서 나왔을 때 다시 null로 세팅
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
		if (url === 'login') {
			const loginPageManager = new LoginPageManager(
				this.app,
				this.clientInfo,
				this._onLoginSuccess.bind(this)
			);
			await loginPageManager.initPage();
		} else if (url === 'lobby') {
			const lobbyPageManager = new NewLobbyPageManager(
				this.app,
				this.clientInfo,
				this._onClickWatingRoomCreationButton.bind(this),
				this._onEnterWaitingRoom.bind(this),
				this._onEnterTournamentWaitingQueuePage.bind(this)
			);
			await lobbyPageManager.initPage();
		} else if (url === 'waitingRoomCreation') {
			const waitingRoomCreationPageManager = new WaitingRoomCreationPageManager(
				this.app,
				this.clientInfo,
				this._onEnterWaitingRoom.bind(this)
			);
		} else if (url === 'pingpong') {
			let onExitPingpongGame = this._onExitPingpongGame.bind(this);
			if (this.clientInfo.tournamentInfo === null) {
				onExitPingpongGame = this._joinTournamentPage.bind(this);
			}
			const pingpongPageManager = new PingpongPageManager(
				this.app,
				this.clientInfo,
				onExitPingpongGame
			);
			await pingpongPageManager.initPage();
		} else if (url === 'waitingRoom') {
			const waitingRoomPageManager = new WaitingRoomPageManager(
				this.app,
				this.clientInfo,
				this._onStartPingpongGame.bind(this),
				this._onExitPingpongGame.bind(this)
			);
		} else if (url === 'waitingTournament') {
			const waitingTournamentPageManager = new WaitingTournamentPageManager(
				this.app,
				this.clientInfo,
				this._joinLobbyPage.bind(this),
				this._joinTournamentPage.bind(this)
			);
		} else if (url === 'tournament') {
			const tournamentPageManager = new TournamentPageManager(
				this.app,
				this.clientInfo,
				this._onStartPingpongGame.bind(this),
				this._joinLobbyPage.bind(this)
			);
		}
	}

	_onLoginSuccess() {
		this.renderPage('lobby');
	}

	_onClickWatingRoomCreationButton() {
		this.renderPage('waitingRoomCreation');
	}

	_onEnterWaitingRoom() {
		this.renderPage('waitingRoom');
	}

	_onStartPingpongGame() {
		this.renderPage('pingpong');
	}

	_onExitPingpongGame() {
		this.renderPage('lobby');
	}

	_onEnterTournamentWaitingQueuePage() {
		this.renderPage('waitingTournament');
	}

	_joinLobbyPage() {
		this.renderPage('lobby');
	}

	_joinTournamentPage() {
		this.renderPage('tournament');
	}
}

export default PageRouter;
