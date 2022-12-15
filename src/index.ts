/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import {Router} from "itty-router";
import {AuthHandler, AuthAction, AuthOptions} from "@auth/core"
import { CamelCasePlugin, Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { AccountTable, Database, UserTable } from "../types/kysely";
import { Adapter, AdapterUser } from "@auth/core/adapters"
import Google, {GoogleProfile} from "@auth/core/providers/google"
import KyselyAdapter from "../lib/adapter";

interface IRequest extends Request {
	method: MethodType // method is required to be on the interface
	url: string // url is required to be on the interface
	optional?: string
  }

type MethodType = 'GET' | 'POST'| 'ALL';

interface IRequest extends Request {
	method: MethodType // method is required to be on the interface
	url: string // url is required to be on the interface
	optional?: string
}

const router = Router<IRequest, {}>();


export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	DB: D1Database
}


router.get("/find", async (request, env: Env, context: ExecutionContext) => {
	const db = new Kysely<Database>({
		dialect: new D1Dialect({
			database: env.DB
		}),
		plugins: [new CamelCasePlugin()]
	})
	const result = await db.selectFrom("users").selectAll().execute();
	if(!result){
		return new Response("No value found", {
			status: 404
		})
	}
	return new Response(JSON.stringify(result), {
		headers: {
			"Content-Type": "application/json"
		}
	});
})



router.get("/api/auth/*", (request: Request, env: Env) => {
	const nextAuth =  request.url // start with request url
    .slice("/api/auth/".length) // make relative to baseUrl
    .replace(/\?.*/, "") // remove query part, use only path part
    .split("/");
	const newRequest = new Request(`${request.url}?nextauth=${nextAuth}`, request)

	const db = new Kysely<Database>({
		dialect: new D1Dialect({
			database: env.DB
		})
	})
	
	
	
	return AuthHandler(newRequest, {
		adapter: KyselyAdapter(db),
		providers: [
			Google({
				clientId: "",
				clientSecret: ""
			})
		],
		trustHost: true

	})
})

router.post("/api/auth/*", (request: Request, env: Env) => {

	const db = new Kysely<Database>({
		dialect: new D1Dialect({
			database: env.DB
		})
	})

	const authOptions: AuthOptions = {
		debug: true,
		callbacks:{
			signIn({user}){
				return true;
			}
		},
		adapter: KyselyAdapter(db), 	
		providers: [
			Google({
				clientId: "dsadasdas",
				clientSecret: "adadas"
			})
		],
		secret: "4a4d5a44fa1703e3049fcdcbab548b7523504421d94405a2f47990586008d503",
		trustHost: true,
		
		
	}

	
	
	return AuthHandler(request, authOptions)
})

router.post("/create", async(request: IRequest, env:Env) => {
	const db = new Kysely<Database>({
		dialect: new D1Dialect({
			database: env.DB
		})
	})
	
	const data: Omit<UserTable, "id"> = await request.json?.();
	const result = await db.insertInto("users")
	.values([{...data, id: null}])
	.execute();

	return new Response(JSON.stringify(result), {
		headers: {
			"Content-Type": "application/json"
		}
	});
})

router.all("*", () => new Response("Not Found", {status: 404}))

export default {
	fetch: router.handle		
};
