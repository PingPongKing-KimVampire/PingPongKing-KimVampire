import GamePageManager from './GamePageManager.js';

class PageRouter {
	constructor() {
		this.app = document.querySelector('#app');
	}

	renderPage(url) {
		if (url === 'game')
		{
			let gamePageManager = new GamePageManager(this.app);
		}
	}
}

export default PageRouter;