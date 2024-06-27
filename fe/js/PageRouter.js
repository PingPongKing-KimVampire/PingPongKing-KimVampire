import PingpongPageManager from "./PingpongPage/PingpongPageManager.js";
import LoginPageManager from "./LoginPage/LoginPageManager.js";
import WaitingRoomCreationPageManager from "./LobbyPage/WaitingRoomCreationPageManager.js";
import NewLobbyPageManager from "./LobbyPage/LobbyPageManager.js";
import WaitingRoomPageManager from "./WaitingRoomPage/WaitingRoomPageManager.js";
import SignupPageManager from "./SignupPage/SignupPageManager.js";
import EditProfilePageManager from "./EdifProfilePage/EditProfilePageManager.js";

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
        this._onLoginSuccess.bind(this),
        this._onEnterSignup.bind(this)
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
    } else if (url === "signup") {
      const signupPageManager = new SignupPageManager(
        this.app,
        this.clientInfo,
        this._onSignupSuccess.bind(this)
      );
    } else if (url === "editProfile") {
      const editProfilePageManager = new EditProfilePageManager(
        this.app,
        this.clientInfo,
      )
    }
  }

  _onLoginSuccess() {
    this.renderPage("lobby");
  }

  _onEnterSignup() {
    this.renderPage("signup");
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

  _onSignupSuccess() {
    this.renderPage("login");
  }
}

export default PageRouter;
