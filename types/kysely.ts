export interface AccountTable{
	id: string|null;
	userId: string;
	type: string;
	provider: string;
	providerAccountId: string;
	refresh_token: string | null;
	access_token: string | null;
	expires_at: number | null;
	token_type: string | null;
	scope: string | null;
	id_token: string| null;
	session_state: string|null;
	oauth_token_secret: string | null;
	oauth_token: string | null;
}

export interface UserTable {
	id: string | null;
	name: string | null;
	email: string;
	email_verified: Date | null;
	image: string | null;
}


export interface SessionTable {
	id: string | null;
	expires: Date;
	sessionToken: string;
	userId: string;
}

export interface VerificationTokenTable {
	identifier: string;
	token: string;
	expires: Date
}

export interface Database{
	users: UserTable,
	accounts: AccountTable,
	session: SessionTable,
	verificationToken: VerificationTokenTable
}