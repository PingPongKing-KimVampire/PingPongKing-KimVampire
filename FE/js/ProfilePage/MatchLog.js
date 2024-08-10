export function getMatchLogDiv(gameHistory) {
	const date = new Date(gameHistory.timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `
        <div class="matchLog" data-id="${gameHistory.gameId}">
            <div class="matchDate">
                ${year}.${month}.${day}
            </div>
            <div class="matchScoreContainer">
                <img class="matchResultImage" src="images/${gameHistory.result?.toLowerCase()}Icon.svg">
                <div class="scoreFrame">
                    ${gameHistory.score[0]} : ${gameHistory.score[1]}
                </div>
            </div>
            <div class="matchTeamListContainer">
                <div class="matchTeamContainer">
                    ${gameHistory.ability[0] !== "none" ? "<img class='vampireAbilityImage' src='images/ability/" + gameHistory.ability[0] + ".png'>" : "<div></div>"}
                    <img class="match${gameHistory.teamKind[0] === "human" ? "Human" : "Vampire"}TeamImage" src="images/${gameHistory.teamKind[0]}Icon.png">
                </div>
                <div class="vsFrame">VS</div>
                <div class="matchTeamContainer">
                    <img class="match${gameHistory.teamKind[1] === "human" ? "Human" : "Vampire"}TeamImage" src="images/${gameHistory.teamKind[1]}Icon.png">
                    ${gameHistory.ability[1] !== "none" ? "<img class='vampireAbilityImage' src='images/ability/" + gameHistory.ability[1] + ".png'>" : "<div></div>"}
                </div>
            </div>
            ${_getMatchPlayerListContainerDiv(gameHistory.myTeamClientInfoList, gameHistory.opponentTeamClientInfoList)}
        </div>       
        `;
}

function _getMatchPlayerListContainerDiv(myTeamClientInfoList, opponentTeamClientInfoList) {
	return `
        <div class="matchPlayerListContainer">
            <div class="teamPlayerListContainer">
                ${myTeamClientInfoList.map(player => _getPlayerContainerDiv(player, "red")).join("")}
                ${Array.from({ length: 5 - myTeamClientInfoList.length })
									.map(() => _getEmptyPlayerContainerDiv("red"))
									.join("")}
            </div>
            <div class="teamPlayerListContainer">
                ${opponentTeamClientInfoList.map(player => _getPlayerContainerDiv(player, "blue")).join("")}
                ${Array.from({ length: 5 - opponentTeamClientInfoList.length })
									.map(() => _getEmptyPlayerContainerDiv("blue"))
									.join("")}
            </div>
        </div>
        `;
}

function _getPlayerContainerDiv(player, color) {
	return `
        <div class="playerContainer existPlayer" data-id="${player.clientId}">
            <div class="playerAvatarImgFrame ${color}Border">
                <img class="playerAvatarImg" src="${player.avatarUrl}">
            </div>
            <div class="playerNickname">
                <span>${player.nickname}</span>
            </div>
        </div>
        `;
}
function _getEmptyPlayerContainerDiv(color) {
	return `
        <div class="playerContainer">
             <div class="playerAvatarImgFrame ${color}Border">
                 <div class="noAvatar${color === "red" ? "Red" : "Blue"}"></div>
             </div>
             <div class="playerNickname">
                 <span></span>
             </div>
         </div>`;
}

export function setMatchLogPlayerClickListener(renderPage) {
	document.querySelectorAll(".existPlayer").forEach(existPlayer => {
		existPlayer.addEventListener("click", e => {
			e.stopPropagation();
			const id = parseInt(existPlayer.dataset.id);
			renderPage("profile", { id });
		});
	});
}
