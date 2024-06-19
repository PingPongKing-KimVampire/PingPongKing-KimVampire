import PingpongPageManager from "./PingpongPage/PingpongPageManager.js";
import LoginPageManager from "./TestPage/LoginPageManager.js";
import WaitingRoomCreationPageManager from "./LobbyPage/WaitingRoomCreationPageManager.js";

import NewLobbyPageManager from "./LobbyPage/LobbyPageManager.js";

export const SERVER_ADDRESS = "127.0.0.1";
export const SERVER_PORT = "3001";

class PageRouter {
  constructor() {
    this.app = document.querySelector("#app");
    this.clientInfo = {
      socket: null,
      id: null,
      nickname: null,
      lobbySocket: null,
      gameInfo: {
        pingpongRoomSocket: null,
        roomId: null,
        title: null,
        teamLeftList: null,
        teamRightList: null,
      },
    };
  }

  async renderPage(url) {
    if (url === "login") {
      const loginPageManager = new LoginPageManager(
        this.app,
        this.clientInfo,
        this._onLoginSuccess.bind(this)
      );
      await loginPageManager.initPage();
    } else if (url === "lobby") {
      const lobbyPageManager = new NewLobbyPageManager(
        this.app,
        this.clientInfo,
        this._onClickWatingRoomCreationButton.bind(this),
        this._onEnterWaitingRoom.bind(this)
      );
      await lobbyPageManager.initPage();
    } else if (url === "waitingRoomCreation") {
      const waitingRoomCreationPageManager = new WaitingRoomCreationPageManager(
        this.app,
        this.clientInfo,
        this._onEnterWaitingRoom.bind(this)
      );
    } else if (url === "game") {
      const pingpongPageManager = new PingpongPageManager(
        this.app,
        this.clientInfo,
        this.gameInfo,
        () => {
          this.renderPage("lobby");
        }
      );
    }
  }

  _onLoginSuccess() {
    this.renderPage("lobby");
  }

  _onClickWatingRoomCreationButton() {
    this.renderPage("waitingRoomCreation");
  }

  _onEnterWaitingRoom() {
    this.renderPage("game");
  }
}

export default PageRouter;
