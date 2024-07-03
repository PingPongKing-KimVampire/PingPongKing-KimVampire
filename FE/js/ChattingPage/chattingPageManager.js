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

	_renderEntireMessage(id) {
		//id로 조회
		const messageList = [
			{ senderId: 1, content: '오늘 한 판 고고?' },
			{ senderId: 2, content: '너 개못하잖아' },
			{ senderId: 1, content: '까부네 ㅋㅋ' },
			{ senderId: 2, content: '드루와라' },
		];
        window.onload = function () {
			const messageListContainer = document.querySelector(
				'.messageListContainer'
			);
			messageListContainer.scrollTop = messageListContainer.scrollHeight;
		};

        // messageList.forEach()
	}

	_getHTML() {
		return `
            <button class="chatButton"></button>
            <div class="chatContainer">
                <div class="FriendListContainer">
                    ${this._getFriendListHTML()}
                </div>
                ${this._getMessageBoxContainerHTML()}
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
	_getMessageBoxContainerHTML() {
		return `
        <div class="messageBoxContainer">
            <div class="messageListContainer">
            <div class="messageBubble rightSender">오늘 저녁 뭐 먹을까? 치킨이 땡기는데, 네 생각은 어때? 우리 동네에 새로 생긴 치킨집이 있다던데, 거기 한번 가볼까? 맛있다는 평이 많아서 기대돼. 어떤 메뉴 먹고 싶어? 양념치킨? 후라이드치킨? 아니면 반반치킨? 나는 반반치킨이 좋아. 다양한 맛을 즐길 수 있어서 좋아. 7시에 만나서 같이 먹자. 너도 그때까지 배고프지 않게 간단한 간식 먹고 있어. 그럼 이따 보자!</div>
            <div class="messageBubble leftSender">음... 난 치킨이 정말 좋아. 새로 생긴 치킨집 괜찮을 것 같아. 반반치킨도 좋고, 양념치킨도 좋아. 우리 사이드로 감자튀김도 시키자. 그렇게 하면 완벽한 저녁이 될 거야. 그리고 7시라니, 딱 좋은 시간인 것 같아. 그때까지 나는 간단히 샐러드라도 먹어야겠어. 이따 봐, 기대돼!</div>
            </div>
            <div class="messageInputContainer">
                <input type="text", class="inputBox" spellcheck="false">
                <div class="inputButton">
                    <img class="sendImage" src="images/sendIcon.png"></img>
                </div>
            </div>
        </div>
        `;
	}
}

export default ChattingPageManager;
