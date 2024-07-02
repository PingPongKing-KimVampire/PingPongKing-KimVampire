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
                <div class="FriendListContainer"></div>
                <div class="messageContainer"></div>
            </div>
            `
    }
}

export default ChattingPageManager;