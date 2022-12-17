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
import * as oauth from "oauth4webapi";
import xhr from "xhr";
import Google, {GoogleProfile} from "@auth/core/providers/google"
import KyselyAdapter from "../lib/adapter";

import {Cookie} from "@auth/core/lib/cookie"
import { parse, serialize } from "cookie";

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
			}),
			{
				id: "animelist",
				name: "MyAnimeList",
				type: "oauth",
				authorization: "https://myanimelist.net/v1/oauth2/authorize",
				token: "https://myanimelist.net/v1/oauth2/token",
				userinfo: "https://api.myanimelist.net/v2/users/@me",
				profile(profile) {
					return {
						id: profile.id,
						name: profile.kakao_account?.profile.nickname,
						email: profile.kakao_account?.email,
						image: profile.kakao_account?.profile.profile_image_url,
					  }
				},
				checks: ["state", "pkce"]
			}
		],
		secret: "4a4d5a44fa1703e3049fcdcbab548b7523504421d94405a2f47990586008d504",
		trustHost: true,
	}
	//Comment Test

	
	
	return AuthHandler(request, authOptions)
})

router.post("/api/auth/*", (request: Request, env: Env) => {

	const db = new Kysely<Database>({
		dialect: new D1Dialect({
			database: env.DB
		})
	})

	const authOptions: AuthOptions = {
		debug: false,
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
				}),
				{
					id: "animelist",
					name: "MyAnimeList",
					type: "oauth",
					authorization: "https://myanimelist.net/v1/oauth2/authorize",
					token: "https://myanimelist.net/v1/oauth2/token",
					userinfo: "https://api.myanimelist.net/v2/users/@me",
					clientId: "72114be1f71cb644e832c01865f1a673",
					clientSecret: "0a2f2dfc9969796db96691d8c2f0382c680ed56d751eb4340b0fb8ba061e9253",

					profile(profile) {
						return {
							id: profile.id,
							name: profile.kakao_account?.profile.nickname,
							email: profile.kakao_account?.email,
							image: profile.kakao_account?.profile.profile_image_url,
						  }
					},
					checks: ["state", "pkce"]
				}
			],
		useSecureCookies: false,
		secret: "4a4d5a44fa1703e3049fcdcbab548b7523504421d94405a2f47990586008d504",
		trustHost: true,
		
	}
	//Comment Test

	
	
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

router.get("/api/auth/myanimelist", async (req: Request) => {
	const cookie_req = parse(req.headers.get('cookie') || '');
	console.log(cookie_req["MALHLOGSESSID"])
	for (const pair of req.headers.entries()) {
		console.log(`${pair[0]}: ${pair[1]}`);
	}


	const challenge = oauth.generateRandomCodeVerifier();
	console.log(challenge)
	const url = new URL("https://myanimelist.net/v1/oauth2/authorize");
	url.searchParams.set("response_type", "code"),
	url.searchParams.set("client_id", "72114be1f71cb644e832c01865f1a673"),
	url.searchParams.set("state", "s")
	url.searchParams.set("code_challenge", challenge),
	url.searchParams.set("code_challenge_method", "plain")
	console.log(url.toString())
	
	const headers = new Headers(req.headers)

	const newCookie: Cookie = {
		name: `next-auth.pkce.code_verifier`,
		options: {
		  httpOnly: true,
		  sameSite: "lax",
		  path: "/",
		  secure: false,
		  maxAge: 60 * 15, // 15 minutes in seconds
		},
		value: challenge
	  }
 
    const { name, value, options } = newCookie
    const cookieHeader = serialize(name, value, options)
    if (headers.has("Set-Cookie")) {
      headers.append("Set-Cookie", cookieHeader)
    } else {
      headers.set("Set-Cookie", cookieHeader)
    }
    // headers.set("Set-Cookie", cookieHeader) // TODO: Remove. Seems to be a bug with Headers in the runtime
  

  const body =
    headers.get("content-type") === "application/json"
      ? JSON.stringify(req.body)
      : req.body

  const response = new Response(body, {
    headers,
    status: 302,
  })

 
    response.headers.set("Location", url.toString())
  

  return response
	

})

router.get("/api/auth/myanimelist/redirect", async (request: Request, env: Env) => {
	const reqURL = new URL(request.url)
	const cookie = parse(request.headers.get("Cookie") || "");
	
	const db = new Kysely<Database>({
		dialect: new D1Dialect({
			database: env.DB
		})
	})

	
	const url = new URL("https://myanimelist.net/v1/oauth2/token");
	url.searchParams.set("grant_type", "authorization_code")
	url.searchParams.set("client_id", "72114be1f71cb644e832c01865f1a673"),
	url.searchParams.set("client_secret", "0a2f2dfc9969796db96691d8c2f0382c680ed56d751eb4340b0fb8ba061e9253")
	url.searchParams.set("code_verifier", cookie["next-auth.pkce.code_verifier"]),
	url.searchParams.set("code", reqURL.searchParams.get("code") || "")
	const mal_reponse = await fetch(url.toString(), {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: url.searchParams
	})
	if(!mal_reponse.ok){
		return new Response(null, {
			status: 400
		})
	}
	const result = await mal_reponse.json()

	const kyselyAdapter = KyselyAdapter(db);

	return new Response(JSON.stringify(await mal_reponse.json() ), {
		headers: {
			"Content-Type": "application/json"
		}
	});
})

router.get("/test", async (req) => {
	oauth.discoveryRequest(new URL("https://myanimelist.net/v1/oauth2"), {algorithm: "oauth2"}).then((response) => {
		console.log(response);
		return oauth.processDiscoveryResponse(new URL("https://myanimelist.net/v1/oauth2"), response);
	})
})

router.get("/api/auth/myanimelist/redirect", (req: Request) => {
	const cookie = parse(req.headers.get("Cookie") || "")
	return new Response(cookie["next-auth.pkce.code_verifier"])
})

router.all("*", () => new Response("Not Found", {status: 404}))

router.options("/test", async(req: Request, env: Env)=> {
	return new Response(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "http://cdn.myanimelist.net",
			"Access-Control-Allow-Methods": "PUT, POST, GET",
			"Access-Control-Allow-Headers": "Content-Type"
		}
	})
})


export default {
	fetch: router.handle		
};
