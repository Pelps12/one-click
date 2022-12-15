import { Adapter } from "@auth/core/adapters";
import { Kysely } from "kysely";
import { AccountTable, Database, UserTable } from "../types/kysely";

export default function KyselyAdapter(db: Kysely<Database>, options= {}) : Adapter<false> {
    return {
        async createUser(user) {
            const newUser: UserTable = {
                id: null,
                name: user.name || null,
                email: user.email,
                email_verified: user.emailVerified,
                image: user.image || null,
            }
            const kyselyUser =  await db.insertInto("users").values([{...newUser}]).returningAll().executeTakeFirst();
            if(kyselyUser && kyselyUser.id){
                return {
                    id: kyselyUser.id,
                    name: kyselyUser.name,
                    email: kyselyUser.email,
                    emailVerified: kyselyUser.email_verified,
                    image: kyselyUser.image
                }
            }else{
                throw new Error("Internal Server Error")
            }
        },
        async getUser(id: string) {
            const kyselyUser = await db.selectFrom("users").selectAll().where("id","=", id).executeTakeFirst();
            if(kyselyUser && kyselyUser.id){
                return {
                    id: kyselyUser.id,
                    name: kyselyUser.name,
                    email: kyselyUser.email,
                    emailVerified: kyselyUser.email_verified,
                    image: kyselyUser.image
                }
            }
            return null
        },
        async getUserByEmail(email: string){
            const kyselyUser = await db.selectFrom("users").selectAll().where("email","=", email).executeTakeFirst();
            if(kyselyUser && kyselyUser.id){
                return {
                    id: kyselyUser.id,
                    name: kyselyUser.name,
                    email: kyselyUser.email,
                    emailVerified: kyselyUser.email_verified,
                    image: kyselyUser.image
                }
            }
            return null
        },
        async getUserByAccount({providerAccountId, provider}){
            const kyselyUser = await db.selectFrom("accounts").innerJoin("users", "users.id", "accounts.userId").where("providerAccountId", "=", providerAccountId).where("provider", "=", provider).selectAll(["users"]).executeTakeFirstOrThrow();
            if(kyselyUser && kyselyUser.id){
                return {
                    id: kyselyUser.id,
                    name: kyselyUser.name,
                    email: kyselyUser.email,
                    emailVerified: kyselyUser.email_verified,
                    image: kyselyUser.image
                }
            }else{
                throw new Error("Internal Server Error")
            }
            
        },
        async updateUser(user){
            if(!user.id){
                throw new Error("Internal Server Error");
            }
            const kyselyUser=  await db.updateTable("users").where("id", "=",  user.id).set(user).returningAll().executeTakeFirst();
            if(kyselyUser && kyselyUser.id){
                return {
                    id: kyselyUser.id,
                    name: kyselyUser.name,
                    email: kyselyUser.email,
                    emailVerified: kyselyUser.email_verified,
                    image: kyselyUser.image
                }
            }
            else{
                throw new Error("Internal Server Error")
            }
        },
        async deleteUser(userId) {
            return
        },
        async linkAccount(account){

            const newAccount: AccountTable = {
                access_token: account.access_token || null,
                expires_at: account.expires_in || null,
                userId: account.userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token || null,
                token_type: account.token_type || null,
                scope: account.scope || null,
                id_token: account.id_token || null,
                id: null,
                session_state: null,
                oauth_token: null,
                oauth_token_secret: null,
            }
            
            const kyselyAccount = await db.insertInto("accounts").values([{...newAccount}]).execute();
            return account;
        },
        async unlinkAccount({providerAccountId, provider}){
            return
        },
        async createSession(session){
            const kyselySession = await db.insertInto("session").values({
                id: null,
                expires: session.expires,
                sessionToken: session.sessionToken,
                userId: session.userId
            }).returningAll().executeTakeFirstOrThrow();
            return {
                expires: kyselySession.expires,
                sessionToken: kyselySession.sessionToken,
                userId: kyselySession.userId
            }
        },
        async getSessionAndUser(sessionToken) {
            const kyselyUser = await db.selectFrom("session").innerJoin("users", "users.id", "session.userId").where("sessionToken", "=", sessionToken).selectAll(["users", "session"]).executeTakeFirstOrThrow();
            
            return {
                session: {
                    userId: kyselyUser.userId,
                    expires: kyselyUser.expires,
                    sessionToken: kyselyUser.sessionToken
                },
                user: {
                    id: kyselyUser.userId,
                    name: kyselyUser.name,
                    email: kyselyUser.email,
                    emailVerified: kyselyUser.email_verified,
                    image: kyselyUser.image
                }
            }
        },
        async updateSession(data) {
            const kyselySession=  await db.updateTable("session").where("sessionToken", "=",  data.sessionToken).set(data).returningAll().executeTakeFirst();
            if(kyselySession){
                return {
                    expires: kyselySession.expires,
                    userId: kyselySession.userId,
                    sessionToken: kyselySession.sessionToken
                }
            }
            else{
                throw new Error("Internal Server Error")
            }
        }	,
        async deleteSession(sessionToken) {
            await db.deleteFrom("session").where("sessionToken", "=", sessionToken).execute();
        }
    }
}