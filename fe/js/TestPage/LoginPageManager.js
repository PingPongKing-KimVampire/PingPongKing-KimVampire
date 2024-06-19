import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";

class LoginPageManager {
  constructor(app, onLoginSuccess) {
    console.log("Login Page!");
    app.innerHTML = this._getHTML();
    this._setRandomId();
    this._setRandomNickname();
    this.onLoginSuccess = onLoginSuccess;
  }

  async initPage() {
    const loginButton = document.querySelector("#loginButton");
    loginButton.addEventListener("click", async (event) => {
      event.preventDefault();
      this.id = parseInt(document.querySelector("#id").value);
      if (isNaN(parseInt(this.id))) return;
      this.nickname = document.querySelector("#nickname").value;
      this.socket = new WebSocket(`ws://${SERVER_ADDRESS}:3001/ws/`);
      await new Promise((resolve) => {
        this.socket.addEventListener("open", () => {
          resolve();
        });
      });

      const initClientMessage = {
        event: "initClient",
        content: {
          clientId: parseInt(this.id),
          clientNickname: this.nickname,
        },
      };
      this.socket.send(JSON.stringify(initClientMessage));
      await new Promise((resolve) => {
        this.socket.addEventListener("message", (messageEvent) => {
          const { event, content } = JSON.parse(messageEvent.data);
          if (event === "initClientResponse") {
            if (content.message === "OK") {
              resolve();
            }
            console.log(content.message);
          }
        });
      });

      const lobbySocket = new WebSocket(
        `ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`
      );
      this.lobbySocket = lobbySocket;
      await new Promise((resolve) => {
        this.lobbySocket.addEventListener("open", () => {
          resolve();
        });
      });
      const enterLobbyMessage = {
        event: "enterLobby",
        content: {
          clientId: this.id,
        },
      };
      this.lobbySocket.send(JSON.stringify(enterLobbyMessage));

      await new Promise((resolve) => {
        this.lobbySocket.addEventListener(
          "message",
          function listener(messageEvent) {
            const { event, content } = JSON.parse(messageEvent.data);
            if (event === "enterLobbyResponse" && content.message === "OK") {
              this.lobbySocket.removeEventListener("message", listener);
              resolve();
            }
          }.bind(this)
        );
      });

      this.onLoginSuccess(
        this.socket,
        this.id,
        this.nickname,
        this.lobbySocket
      );
    });
  }

  _setRandomId() {
    const idInput = document.querySelector("#id");
    const randomId = Math.floor(Math.random() * 1000000) + 1;
    idInput.value = randomId;
  }

  _setRandomNickname() {
    const nicknameInput = document.querySelector("#nickname");
    const characters =
      "가나다라마바사아자카파타하동해물과백두산이마르고닳도록하나님이보우하사우리나라만세";
    let randomNickname = "";
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomNickname += characters[randomIndex];
    }
    nicknameInput.value = randomNickname;
  }

  _getHTML() {
    return `
		<form>
			<label for="id">아이디</label>
			<input id="id" type="text">
			<label for="nickname">닉네임</label>
			<input id="nickname" type="text">
			<button id="loginButton">로그인</button>
		</form>
		`;
  }
}

export default LoginPageManager;
