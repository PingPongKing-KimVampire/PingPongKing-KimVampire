import PingpongPageManager from "./PingpongPage/PingpongPageManager.js";
import LoginPageManager from "./TestPage/LoginPageManager.js";
import WaitingRoomCreationPageManager from "./LobbyPage/WaitingRoomCreationPageManager.js";

import NewLobbyPageManager from "./LobbyPage/LobbyPageManager.js";

export const SERVER_ADDRESS = "127.0.0.1";
export const SERVER_PORT = "3001";

//페이지간 데이터를 공유하는게 너무 힘들다,, 더 좋은 구조로 변경할 수 없을까?
//특히 반드시 this로 등록해야지만 공유하는게 어려움.
class PageRouter {
  constructor() {
    this.app = document.querySelector("#app");
    this.clientInfo = {
      socket: null,
      lobbySocket: null,
      id: null,
      nickname: null,
      roomId: null,
      isReferee: false,
    };
    this.gameInfo = {
      pingpongRoomSocket: null,
      roomId: null,
      title: null,
      teamLeftList: null,
      teamRightList: null,
    };
  }

  async renderPage(url) {
    if (url === "login") {
      const loginPageManager = new LoginPageManager(
        this.app,
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

  _onLoginSuccess(socket, lobbySocket, id, nickname) {
    console.log(this);
    this.clientInfo.socket = socket;
    this.clientInfo.lobbySocket = lobbySocket;
    this.clientInfo.id = id;
    this.clientInfo.nickname = nickname;
    this.renderPage("lobby");
  }

  _onClickWatingRoomCreationButton() {
    this.renderPage("waitingRoomCreation");
  }

  _onEnterWaitingRoom(gameInfo) {
    this.gameInfo = gameInfo;
    this.renderPage("game");
  }
}

export default PageRouter;
