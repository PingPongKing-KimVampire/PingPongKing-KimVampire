class ChattingPageManager{
    constructor(app, clientInfo){
        console.log("Chatting Page!");

        this.clientInfo = clientInfo;
        // TODO : 임시 하드코딩
        this.clientInfo.friendInfo.friendList = [{
                id: 1,  nickname: '조뱀파이어어어어어어',  avatarUrl: 'images/playerA.png',  activeState: true, 
                recentMessage: { message: "하이하이이이이이이이이이이이이", timeStamp: "2024-07-02T14:30:00Z" } 
            }, {
                id: 2,  nickname: '박뱀파이어',  avatarUrl: 'images/humanIcon.png',  activeState: true, 
                recentMessage: { message: "하이하이", timeStamp: "2024-07-02T20:15:02Z" }
            }, {
                id: 3,  nickname: '이뱀파이어',  avatarUrl: 'images/playerB.png',  activeState: false, 
                recentMessage: { message: "하이하이", timeStamp: "2024-07-02T20:15:01Z" } 
            }, {
                id: 4,  nickname: '김뱀파이어',  avatarUrl: 'images/playerA.png',  activeState: true, 
                recentMessage: { message: "하이하이", timeStamp: "2024-07-03T07:50:00Z" }
            }, {
                id: 5, nickname: '최뱀파이어', avatarUrl: 'images/playerA.png', activeState: true, 
                recentMessage: { message: "하이하이", timeStamp: "2024-07-03T07:55:00Z" } 
            }, {
                id: 6, nickname: '정뱀파이어', avatarUrl: 'images/playerA.png', activeState: false, 
                recentMessage: { message: "하이하이", timeStamp: "2024-07-03T10:30:00Z" } 
            },
        ];
        app.innerHTML = this._getHTML();
        this._initPage();
    }

    _initPage(){
        document.querySelector(".chatButton").addEventListener("click", ()=>{
            console.log("here");
        });

        this.selectedFriendItem = null;
        this.selectedInviteButton = null;
        this._setSelectedFriendItem(document.querySelector('.friendItem'));
        this._setFriendItems();
    }

    _setFriendItems() { // TODO : 리렌더링 시 호출
        document.querySelectorAll('.friendItem').forEach((item) => {
            item.addEventListener('click', (event) => {
                if (event.target.classList.contains('inviteButton')) {
                    console.log('초대 버튼 클릭');
                    // TODO : 초대 버튼 클릭 시 구현
                    return;
                }
                this._setSelectedFriendItem(item);
                // TODO : 대화 데이터 조회 API & 채팅방 렌더링
            });
        });
    }

    // TODO : 대기실 페이지일 때만 초대 버튼 표시하기
    _setSelectedFriendItem(friendItem) {
        if (this.selectedFriendItem) {
            this.selectedFriendItem.classList.remove('selectedFriendItem');
            this.selectedInviteButton.classList.add('invisible');
        }
        this.selectedFriendItem = friendItem;
        this.selectedInviteButton = friendItem.querySelector('.inviteButton');
        this.selectedFriendItem.classList.add('selectedFriendItem');
        this.selectedInviteButton.classList.remove('invisible');
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
        const _getFriendItemHTML = function(friend) {
            return  `
                <button class="friendItem" data-id="${friend.id}">
                    <div class="avatarContainer">
                        <div class="avatarImgFrame">
                            <img class="avatarImg" src="${friend.avatarUrl}">
                        </div>
                        <div class="activeState ${!friend.activeState ? 'invisible' : ''}"></div>
                    </div>
                    <div class="infoBox">
                        <div class="nickname">${friend.nickname}</div>
                        <div class="recentMessage">${friend.recentMessage.message}</div>
                    </div>
                    <div class="inviteButton invisible ${!friend.activeState ? 'disabledInviteButton' : ''}">초대</div>
                </button>
            `;
        }
        // 최근에 대화한 순으로 정렬
        const sortedFriendList = this.clientInfo.friendInfo.friendList.slice().sort((friend1, friend2) => {
            return new Date(friend2.recentMessage.timeStamp) - new Date(friend1.recentMessage.timeStamp);;
        });
        const friendListHTML = sortedFriendList.reduce((acc, currnet) => {
            return acc + _getFriendItemHTML(currnet);
        }, '');
        return friendListHTML;
    }
}

export default ChattingPageManager;