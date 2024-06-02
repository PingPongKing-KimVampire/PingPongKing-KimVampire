class LobbyPageManager {
    constructor(app, socket) {
        console.log("Lobby Page!");
		app.innerHTML = this.getHTML();

        const createRoomBtn = document.querySelector('.createButton');
        createRoomBtn.addEventListener('click', () => {
            const createMessage = {
                sender: 'client',
                receiver: ['server'],
                event: 'createPingpongRoom',
                content: {
                    clientId: 1, // TODO : 로그인 페이지에서 입력 받은 아이디
                }
            }
            console.log(createMessage);
            // socket.send(JSON.stringify(createMessage));
        })
    }

    getHTML() {
        return `
            <button class="createButton">탁구장 생성</button>
		    <button class="enterButton">탁구장 입장</button>
        `;
    }
}

export default LobbyPageManager;