import PingpongPageManager from "./PingpongPage/PingpongPageManager.js";
import LoginPageManager from "./TestPage/LoginPageManager.js";
import WaitingRoomCreationPageManager from "./LobbyPage/WaitingRoomCreationPageManager.js";
import NewLobbyPageManager from "./LobbyPage/LobbyPageManager.js";
import WaitingRoomPageManager from "./WaitingRoomPage/WaitingRoomPageManager.js";

export const SERVER_ADDRESS = "127.0.0.1";
export const SERVER_PORT = "3001";

import WaitingRoomPageManager from "./PingpongPage/WaitingRoomPageManager.js";

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
        teamLeftMode: null,
        teamRightMode: null,
        teamLeftTotalPlayerCount: null,
        teamRightTotalPlayerCount: null,
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
    } else if (url === "pingpong") {
      const pingpongPageManager = new PingpongPageManager(
        this.app,
        this.clientInfo,
        this._onExitPingpongGame.bind(this)
      );
      await pingpongPageManager.initPage();
    } else if (url === "waitingRoom") {
      const waitingRoomPageManager = new WaitingRoomPageManager(
        this.app,
        this.clientInfo,
        this._onStartPingpongGame.bind(this),
        this._onExitPingpongGame.bind(this)
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
    this.renderPage("waitingRoom");
  }

  _onStartPingpongGame() {
    this.renderPage("pingpong");
  }

  _onExitPingpongGame() {
    this.renderPage("lobby");
  }
}

export default PageRouter;
