import LobbyPageManager from './LobbyPageManager.js';
import GamePageManager from './GamePageManager.js';
import LoginPageManager from './LoginPageManager.js';

class PageRouter {
	constructor() {
		this.app = document.querySelector('#app');
	}

	renderPage(url, socket) {
		if (url === 'login') {
			let loginPageManager = new LoginPageManager(this.app, socket, () => {
				this.renderPage('lobby', socket);
			});
		} else if (url === 'lobby') {
			let lobbyPageManager = new LobbyPageManager(this.app);
		} else if (url === 'game') {
			let gamePageManager = new GamePageManager(this.app);
		}
	}
}

export default PageRouter;