import PingpongPageManager from "./PingpongPage/PingpongPageManager.js";
import LoginPageManager from "./TestPage/LoginPageManager.js";
import LobbyPageManager from "./TestPage/LobbyPageManager.js";
import WaitingRoomCreationPageManager from "./LobbyPage/WaitingRoomCreationPageManager.js";

import NewLobbyPageManager from "./LobbyPage/LobbyPageManager.js";

class PageRouter {
  constructor() {
    this.app = document.querySelector("#app");
    this.clientInfo = {
      socket: null,
      id: null,
      nickname: null,
      roomId: null,
      isReferee: false,
    };
    this.gameInfo;
  }

  async renderPage(url) {
    //콜백함수로 성공상황을 주면 가독성이 조금 떨어지는것 같음
    //하지만 loginPage가 lobbyPage를 몰라도 되는 패턴은 맘에 듬
    //가독성을 높일 수 있는 방법은 없을까?
    if (url === "login") {
      let loginPageManager = new LoginPageManager(
        this.app,
        (socket, id, nickname) => {
          this.clientInfo.socket = socket;
          this.clientInfo.id = id;
          this.clientInfo.nickname = nickname;
          this.renderPage("lobby");
        }
      );
    } else if (url === "lobby") {
      let lobbyPageManager = new LobbyPageManager(
        this.app,
        this.clientInfo,
        (roomId, gameInfo) => {
          this.clientInfo.roomId = roomId;
          this.gameInfo = gameInfo; // TODO : 개선하기
          this.renderPage("game");
        },
        () => {
          this.renderPage("newLobby");
        }
      );
    } else if (url === "game") {
      let pingpongPageManager = new PingpongPageManager(
        this.app,
        this.clientInfo,
        this.gameInfo,
        () => {
          this.renderPage("lobby");
        }
      );
    } else if (url === "waitingRoomCreation") {
      let waitingRoomCreationPageManager = new WaitingRoomCreationPageManager(
        this.app,
        this.clientInfo,
        (roomId, gameInfo) => {
          this.clientInfo.roomId = roomId;
          this.gameInfo = gameInfo;
          this.renderPage("game");
        }
      );
    } else if (url === "newLobby") {
      const lobbyPageManager = new NewLobbyPageManager(
        this.app,
        this.clientInfo,
        () => {
          this.renderPage("waitingRoomCreation");
        },
        (roomId, gameInfo) => {
          console.log(roomId);
          console.log(gameInfo);
          this.clientInfo.roomId = roomId;
          this.gameInfo = gameInfo;
          this.renderPage("game");
        }
      );
      await lobbyPageManager.initPage();
    }
  }
}

export default PageRouter;
