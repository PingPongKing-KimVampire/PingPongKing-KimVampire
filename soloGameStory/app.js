import SPA from './SPA.js';
import GamePage from './GamePage.js';
import GameManager from './GameManager.js';

const spa = new SPA();
const gameManager = new GameManager();
const gamePage = new GamePage(gameManager);

spa.render(gamePage);
gamePage.initialize();