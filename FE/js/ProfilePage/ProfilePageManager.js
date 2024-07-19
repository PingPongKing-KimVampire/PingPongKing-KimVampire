class ProfilePageManager{
    constructor(app, clientInfo, renderLobbyPage){
        console.log("ProfilePage!!!");
        this.clientInfo = clientInfo;
        this.app = app;
        this.renderLobbyPage = renderLobbyPage;

        this.clientInfo = {
            ID: 3,
            nickname: "김뱀파이어",
            avatarUrl: 'images/playerA.png'
        }

        this._initPage();
    }

    async _initPage(){
        this.app.innerHTML = this._getHTML();
    }

    _getHTML(){
        return `
        <button class="exitButton"></button>
        <div id="container">
            <div id="avatarContainer">
                <div class="avatarImgFrame">
                    <img class="avatarImg" src="${this.clientInfo.avatarUrl}">
                </div>
                <div id="WinLossContainer">
                    <div class="nicknameFrame">
                        ${this.clientInfo.nickname}
                    </div>
                    <div class="winLossFrame">
                        10승 100패
                    </div>
                </div>
                <button class="editProfileButton">
                    프로필 편집
                </button>
            </div>
            <div id="matchLogContainer">
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="matchLog">
                    <div class="matchDate">
                        2024.05.05
                    </div>
                    <div class="matchScoreContainer">
                        <img class="matchResultImage" src="images/winIcon.svg">
                        <div class="scoreFrame">
                            11 : 8
                        </div>
                    </div>
                    <div class="matchTeamListContainer">
                        <div class="matchTeamContainer">
                            <img class="vampireAbilityImage" src="images/ability/ghostSmasher.png">
                            <img class="matchTeamImage" src="images/vampireIcon.png">
                        </div>
                        <div class="vsFrame">VS</div>
                        <div class="matchTeamContainer">
                            <img class="matchHumanTeamImage" src="images/humanIcon.png">
                        </div>
                    </div>
                    <div class="matchPlayerListContainer">
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어가세상을지배한다</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>박드라큘라2</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이2222</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <img class="playerAvatarImg" src="images/playerB.png">
                                </div>
                                <div class="playerNickname">
                                    <span>빡빡이부캐</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame redBorder">
                                    <div class="noAvatarRed"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div class="teamPlayerListContainer">
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <img class="playerAvatarImg" src="images/playerA.png">
                                </div>
                                <div class="playerNickname">
                                    <span>김뱀파이어</span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                            <div class="playerContainer">
                                <div class="playerAvatarImgFrame blueBorder">
                                    <div class="noAvatarBlue"></div>
                                </div>
                                <div class="playerNickname">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
}

export default ProfilePageManager;