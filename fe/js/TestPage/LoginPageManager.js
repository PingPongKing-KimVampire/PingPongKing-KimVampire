const SERVER_ADDRESS = "127.0.0.1";

class LoginPageManager {
  constructor(app, onLoginSuccess) {
    console.log("Login Page!");
    app.innerHTML = this._getHTML();
    this._setRandomId();
    this._setRandomNickname();
    this.onLoginSuccess = onLoginSuccess;

    // 로그인
    const loginButton = document.querySelector("#loginButton");
    loginButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.socket = new WebSocket(`ws://${SERVER_ADDRESS}:3001`);
      this.socket.addEventListener("open", () => {
        this.id = parseInt(document.querySelector("#id").value);
        if (isNaN(parseInt(this.id))) return;
        this.nickname = document.querySelector("#nickname").value;
        const initClientMessage = {
          sender: "unauthenticatedClient",
          receiver: ["server"],
          event: "initClient",
          content: {
            clientId: parseInt(this.id),
            clientNickname: this.nickname,
          },
        };
        this.socket.send(JSON.stringify(initClientMessage));
      });
      this.socket.addEventListener("message", this.listener);
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

  listener = (messageEvent) => {
    this.socket.removeEventListener("message", this.listener);
    const message = JSON.parse(messageEvent.data);
    if (message.receiver.includes("unauthenticatedClient")) {
      if (message.event === "registerClientSuccess") {
        // 로그인 성공
        this.onLoginSuccess(this.socket, this.id, this.nickname);
      } else if (message.event == "duplicateClientId") {
        // 중복 ID
        console.log("duplicated ID!");
      }
    }
  };
}

export default LoginPageManager;
