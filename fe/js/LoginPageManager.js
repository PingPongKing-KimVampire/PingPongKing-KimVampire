class LoginPageManager {
    constructor(app, socket, onLoginSuccess) {
        console.log("Login Page!");
        app.innerHTML = this._getHTML();
        this.onLoginSuccess = onLoginSuccess;

        const loginBtn = document.querySelector('#loginButton');
        loginBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const id = document.querySelector('#id').value;
            const nickname = document.querySelector('#nickname').value;
            const initClientMessage = {
                sender: 'client',
                receiver: ['server'],
                event: 'initClient',
                content: {
                    clientId: id,
                    clientNickname: nickname,
                }
            }
            console.log(initClientMessage);
            this.onLoginSuccess();
            // TODO : 다른 페이지들에게 어떻게 id, nickname 정보를 전달할 수 있을까?
            // 전역적인 정보를 저장할 GlobalData 객체가 있는 것이 좋을까?
            // socket.send(JSON.stringify(initClientMessage));
        })

        // socket.addEventListener('message', (event) => { 
        //     const message = JSON.parse(event.data);
        //     if (message.event === 'registerClientSuccess') {
        //         this.onLoginSuccess();
        //     }
        //     // 실패인 경우는 아직 처리하지 않음
        // });
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