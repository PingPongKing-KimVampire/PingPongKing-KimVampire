import windowObservable from "../../WindowObservable.js"

class FriendManagementPageManager {
	constructor(app, clientInfo) {
		console.log('Friend Management Page!');

		// TODO : 임시 하드 코딩
		this.clientList = [
			{ id: 3, nickname: "김뱀파이어", avatarUrl: "images/playerA.png" }, 
			{ id: 3, nickname: "이뱀파이어", avatarUrl: "images/playerB.png" }, 
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/humanIcon.png" }, 
			{ id: 3, nickname: "조뱀파이어", avatarUrl: "images/playerA.png" }, 
			{ id: 3, nickname: "양뱀파이어", avatarUrl: "images/vampireIcon.png" }, 
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/playerB.png" }, 
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/humanIcon.png" }, 
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/playerB.png" }, 
			{ id: 3, nickname: "조뱀파이어", avatarUrl: "images/playerA.png" }, 
			{ id: 3, nickname: "양뱀파이어", avatarUrl: "images/vampireIcon.png" }
		];

		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;

		this._initPage();
	}

	_initPage() {
		this._setTabButtons();
		this._autoSetScrollTrackColor();
		this._subscribeWindow();
	}

	_setTabButtons() {
		this.searchContainer = document.querySelector('#searchContainer');
		this.userListContainer = document.querySelector('.userListContainer');
		document.querySelector('#searchUserButton') // 유저 검색 탭
				.addEventListener('click', this._setSearchContainer.bind(this, true));
		document.querySelector('#friendRequestButton') // 친구 요청 목록 탭
				.addEventListener('click', this._setSearchContainer.bind(this, false));
		document.querySelector('#myFriendButton') // 내 친구 관리 탭
				.addEventListener('click', this._setSearchContainer.bind(this, false));
		document.querySelector('#blockUserButton') // 차단 유저 관리 탭
				.addEventListener('click', this._setSearchContainer.bind(this, false));
	}

	_setSearchContainer(visible) {
		if (visible) {
			this.searchContainer.classList.add('visible');
			this.searchContainer.classList.remove('invisible');
			this.userListContainer.style.height = '91%';
		} else {
			this.searchContainer.classList.remove('visible');
			this.searchContainer.classList.add('invisible');
			this.userListContainer.style.height = '100%';
		}
	}

	_subscribeWindow() {
		this._autoSetScrollTrackColorRef = this._autoSetScrollTrackColor.bind(this);
		windowObservable.subscribeResize(this._autoSetScrollTrackColor);
	}
	_unsubscribeWindow() { // TODO : 페이지 나갈 시 호출
		windowObservable.unsubscribeResize(this._autoSetScrollTrackColorRef);
	}

	_autoSetScrollTrackColor() { // TODO : 표시되는 리스트가 업데이트될 때도 호출해줘야 하지 않을까? 로비에서도?
		const userListContainier = document.querySelector('.userListContainer');
		if (
			userListContainier.scrollHeight > 
			userListContainier.clientHeight
		) {
			userListContainier.classList.add('transparent-scrolltrack');
			userListContainier.classList.remove('scrollbar-scrolltrack');
		} else {
			userListContainier.classList.remove('transparent-scrolltrack');
			userListContainier.classList.add('scrollbar-scrolltrack');
		}
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="container">
				${this._getTabContainerHTML()}
				<div id="contentContainer">
					<div id="innerContentContainer">
						${this._getSearchContainerHTML()}
						${this._getUserListContainerHTML()}
					</div>
				</div>
		</div>
		`;
	}
	_getTabContainerHTML() {
		return `
			<div id="tabContainer">
				<button class="tabButton" id="searchUserButton">유저 검색</button>
				<button class="tabButton" id="friendRequestButton">친구 요청 목록</button>
				<button class="tabButton" id="myFriendButton">내 친구 관리</button>
				<button class="tabButton" id="blockUserButton">차단 유저 관리</button>
			</div>
		`;
	}
	_getSearchContainerHTML() {
		return `
			<div id="searchContainer" class="visible">
				<input id="userSearchInput" placeholder="닉네임을 입력하세요.">
			</div>
		`;
	}
	_getUserListContainerHTML() {
		const userItemsHTML = this.clientList.reduce((acc, current) => {
			return acc + this._getUserItemHTML(current);
		}, "");
		console.log(userItemsHTML);
		return `
			<div class="userListContainer">
				${userItemsHTML}
			</div>
		`;
	}
	_getUserItemHTML(user) {
		return `
			<div class="userItem">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${user.avatarUrl}">
				</div>
				<div class="nickname">${user.nickname}</div>
				<div class="buttonGroup">
					<div class="userManagementButton friendRequestButtton activatedButton">친구 요청</div>
					<div class="userManagementButton userBlockButtton activatedButton">차단</div>
				</div>
			</div>
		`;
	}
}

export default FriendManagementPageManager;