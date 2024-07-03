class ChattingPageManager{
    constructor(app, clientInfo){
        console.log("Chatting Page!");
        this.clientInfo = clientInfo;
        app.innerHTML = this._getHTML();
        this._initPage();
    }

    _initPage(){
        document.querySelector(".chatButton").addEventListener("click", ()=>{
            console.log("here");
        })
    }

    _getHTML(){
        return `
            <button class="chatButton"></button>
            <div class="chatContainer">
                <div class="FriendListContainer">
                    ${this._getFriendListHTML()}
                </div>
                <div class="messageContainer"></div>
            </div>
            `
    }
    _getFriendListHTML() {
        return `
            <div class="friendItem">
                <div class="avatarContainer">
                    <div class="avatarImgFrame">
                        <img class="avatarImg" src="images/playerA.png">
                    </div>
                    <div class="activeState"></div>
                </div>
                <div class="infoBox">
                    <div class="nickname">김뱀파이어</div>
                    <div class="recentMessage">하이하이</div>
                </div>
                <div class="inviteButton">초대</div>
            </div>
            <div class="friendItem">
                <div class="avatarContainer">
                    <div class="avatarImgFrame">
                        <img class="avatarImg" src="images/playerA.png">
                    </div>
                    <div class="activeState"></div>
                </div>
                <div class="infoBox">
                    <div class="nickname">김뱀파이어</div>
                    <div class="recentMessage">하이하이</div>
                </div>
                <div class="inviteButton">초대</div>
            </div>
            <div class="friendItem">
                <div class="avatarContainer">
                    <div class="avatarImgFrame">
                        <img class="avatarImg" src="images/playerA.png">
                    </div>
                    <div class="activeState"></div>
                </div>
                <div class="infoBox">
                    <div class="nickname">김뱀파이어</div>
                    <div class="recentMessage">하이하이</div>
                </div>
                <div class="inviteButton">초대</div>
            </div>
            <div class="friendItem">
                <div class="avatarContainer">
                    <div class="avatarImgFrame">
                        <img class="avatarImg" src="images/playerA.png">
                    </div>
                    <div class="activeState"></div>
                </div>
                <div class="infoBox">
                    <div class="nickname">김뱀파이어</div>
                    <div class="recentMessage">하이하이</div>
                </div>
                <div class="inviteButton">초대</div>
            </div>
            <div class="friendItem">
                <div class="avatarContainer">
                    <div class="avatarImgFrame">
                        <img class="avatarImg" src="images/playerA.png">
                    </div>
                    <div class="activeState"></div>
                </div>
                <div class="infoBox">
                    <div class="nickname">김뱀파이어</div>
                    <div class="recentMessage">하이하이</div>
                </div>
                <div class="inviteButton">초대</div>
            </div>
            <div class="friendItem">
                <div class="avatarContainer">
                    <div class="avatarImgFrame">
                        <img class="avatarImg" src="images/playerA.png">
                    </div>
                    <div class="activeState"></div>
                </div>
                <div class="infoBox">
                    <div class="nickname">김뱀파이어</div>
                    <div class="recentMessage">하이하이</div>
                </div>
                <div class="inviteButton">초대</div>
            </div>
        `;
    }
}

export default ChattingPageManager;