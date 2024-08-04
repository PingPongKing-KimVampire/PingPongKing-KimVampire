export class AccessTokenNotFoundError extends Error {
	constructor() {
		super("accessToken is not found");
		this.name = "AccessTokenNotFoundError";
	}
}

export class ProfileTargetNotFound extends Error {
	constructor() {
		super("profile target is not found");
		this.name = "ProfileTargetNotFound";
	}
}

export class GameInfoNotSettingError extends Error {
	constructor() {
		super("gameInfo is not setting");
		this.name = "GameInfoNotSettingError";
	}
}

export class TournamentInfodNotSettingError extends Error {
	constructor() {
		super("tournamentInfo is not setting");
		this.name = "TournamentInfodNotSettingError";
	}
}

export class LobbyConnectionError extends Error {
	constructor() {
		super("lobbySocket is not connected");
		this.name = "LobbyConnectionError";
	}
}

export class GlobalConnectionError extends Error {
	constructor() {
		super("global socket is not connected");
		this.name = "GlobalConnectionError";
	}
}

export class PingpongConnectionError extends Error {
	constructor() {
		super("pingpong socket is not connected");
		this.name = "PingpongConnectionError";
	}
}

export function isSocketConnected(socket) {
	if (!socket) return false;
	return socket?.readyState === 1;
}
