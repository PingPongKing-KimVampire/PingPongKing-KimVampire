class LoginPageManager {
  constructor(app, onLoginSuccess) {
    console.log("Login Page!");
    app.innerHTML = this._getHTML();
    this.onLoginSuccess = onLoginSuccess;

    // 로그인
    const loginBtn = document.querySelector("#loginButton");
    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      this.socket = new WebSocket("ws://127.0.0.1:3001");
      this.socket.addEventListener("open", () => {
        this.id = parseInt(document.querySelector("#id").value);
        if (isNaN(parseInt(this.id))) return;
        this.nickname = document.querySelector("#nickname").value;
        const initClientMessage = {
          sender: "client",
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
    if (message.event === "registerClientSuccess") {
      // 로그인 성공
      this.onLoginSuccess(this.socket, this.id, this.nickname);
    } else if (message.event == "duplicateClientId") {
      // 중복 ID
      console.log("duplicated ID!");
    }
  };
}

export default LoginPageManager;
