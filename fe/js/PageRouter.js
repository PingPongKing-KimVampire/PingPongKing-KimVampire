import LobbyPageManager from './LobbyPageManager.js';
import GamePageManager from './GamePageManager.js';
import LoginPageManager from './LoginPageManager.js';
import PingpongRoomPageManager from './PingpongRoomPageManager.js';

class PageRouter {
	constructor() {
		this.app = document.querySelector('#app');
		this.clientInfo = {
			socket: null,
			id: null,
			nickname: null,
			roomId: null,
			isReferee: false
		};
	}

	renderPage(url) {
		if (url === 'login') {
			let loginPageManager = new LoginPageManager(this.app, (socket, id, nickname) => {
				this.clientInfo.socket = socket;
				this.clientInfo.id = id;
				this.clientInfo.nickname = nickname;
				this.renderPage('lobby');
			});
		} else if (url === 'lobby') {
			let lobbyPageManager = new LobbyPageManager(this.app, this.clientInfo, (roomId) => {
				this.clientInfo.roomId = roomId;
				this.renderPage('pingpongRoom');
			});
		} else if (url === 'game') {
			let gamePageManager = new GamePageManager(this.app);
		} else if (url == 'pingpongRoom') {
			let pingpongRoomPageManager = new PingpongRoomPageManager(this.app, this.clientInfo);
		}
	}
}

export default PageRouter;