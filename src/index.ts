import {
  AuthenticateOptions,
  Strategy,
  StrategyVerifyCallback,
} from "remix-auth";

import { v4 as uuid } from "uuid";

import createDebug from "debug";
import {
  AppLoadContext,
  json,
  redirect,
  SessionStorage,
} from "@remix-run/server-runtime";
let debug = createDebug("NotionStrategy");

export interface NotionStrategyOptions {
  clientID: string;
  callbackURL: string;
  clientSecret: string;
}

export interface NotionProfile {
  provider: string;
  type: string;
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface NotionExtraParams
  extends Record<string, string | number | Record<string, unknown>> {
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
  bot_id: string;
  owner: Record<string, unknown>;
}

export interface NotionVerifyParams {
  accessToken: string;
  refreshToken: string;
  extraParams: NotionExtraParams;
  profile: NotionProfile;
  context?: AppLoadContext;
}

export interface NotionUser {
  id: string;
  name: string;
  type: "person" | "bot";
  avatar_url: string;
  person?: {
    email: string;
  };
}

export class NotionStrategy<User> extends Strategy<User, NotionVerifyParams> {
  name = "notion";
  protected authorizationURL: string;
  protected tokenURL: string;
  protected clientID: string;
  protected clientSecret: string;
  protected callbackURL: string;
  private sessionStateKey = "notion:state";

  constructor(
    { clientID, callbackURL, clientSecret }: NotionStrategyOptions,
    verify: StrategyVerifyCallback<User, NotionVerifyParams>
  ) {
    super(verify);

    this.authorizationURL = "https://api.notion.com/v1/oauth/authorize";
    this.tokenURL = "https://api.notion.com/v1/oauth/token";
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.callbackURL = callbackURL;
  }

  protected async userProfile(
    accessToken: string,
    extraParams: NotionExtraParams
  ): Promise<NotionProfile> {
    const owner = extraParams.owner;
    if (owner.type !== "user" || !owner.user) {
      return {
        provider: "notion",
        type: "workspace",
      };
    }

    const user = owner.user as NotionUser;

    return {
      provider: "notion",
      type: "user",
      id: user.id,
      name: user.name,
      avatarUrl: user.avatar_url,
      email: user.person?.email,
    };
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ): Promise<User> {
    debug("Request URL", request.url);
    let url = new URL(request.url);
    let session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );

    let user: User | null = session.get(options.sessionKey) ?? null;

    // User is already authenticated
    if (user) {
      debug("User is authenticated");
      return this.success(user, request, sessionStorage, options);
    }

    let callbackURL = new URL(this.callbackURL);
    debug("Callback URL", callbackURL);

    // Redirect the user to the callback URL
    if (url.pathname !== callbackURL.pathname) {
      debug("Redirecting to callback URL");
      let state = this.generateState();
      debug("State", state);
      session.set(this.sessionStateKey, state);
      throw redirect(this.getAuthorizationURL(request, state).toString(), {
        headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
      });
    }

    // Validations of the callback URL params

    let stateUrl = url.searchParams.get("state");
    debug("State from URL", stateUrl);
    if (!stateUrl)
      throw json({ message: "Missing state on URL." }, { status: 400 });

    let stateSession = session.get(this.sessionStateKey);
    debug("State from session", stateSession);
    if (!stateSession) {
      throw json({ message: "Missing state on session." }, { status: 400 });
    }

    if (stateSession === stateUrl) {
      debug("State is valid");
      session.unset(this.sessionStateKey);
    } else throw json({ message: "State doesn't match." }, { status: 400 });

    let code = url.searchParams.get("code");
    if (!code) throw json({ message: "Missing code." }, { status: 400 });

    // Get the access token

    let params = new URLSearchParams();
    params.set("grant_type", "authorization_code");
    params.set("redirect_uri", callbackURL.toString());

    let { accessToken, refreshToken, extraParams } =
      await this.fetchAccessToken(code, params);

    // Get the profile

    let profile = await this.userProfile(accessToken, extraParams);

    // Verify the user and return it, or redirect
    try {
      user = await this.verify({
        accessToken,
        refreshToken,
        extraParams,
        profile,
        context: options.context,
      });
    } catch (error) {
      debug("Failed to verify user", error);
      let message = (error as Error).message;
      return await this.failure(message, request, sessionStorage, options);
    }

    debug("User authenticated");
    return await this.success(user, request, sessionStorage, options);
  }

  private getAuthorizationURL(request: Request, state: string) {
    let params = new URLSearchParams();
    params.set("owner", "user");
    params.set("response_type", "code");
    params.set("client_id", this.clientID);
    params.set("redirect_uri", this.callbackURL);
    params.set("state", state);

    let url = new URL(this.authorizationURL);
    url.search = params.toString();

    return url;
  }

  private generateState() {
    return uuid();
  }

  private async fetchAccessToken(
    code: string,
    params: URLSearchParams
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    extraParams: NotionExtraParams;
  }> {
    if (params.get("grant_type") === "refresh_token") {
      params.set("refresh_token", code);
    } else {
      params.set("code", code);
    }

    // clientID and clientSecret are used as Basic auth credentials
    const auth = Buffer.from(`${this.clientID}:${this.clientSecret}`, "utf8");

    let response = await fetch(this.tokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth.toString("base64")}`,
      },
      body: params,
    });

    if (!response.ok) {
      try {
        let body = await response.text();
        throw new Response(body, { status: 401 });
      } catch (error) {
        throw new Response((error as Error).message, { status: 401 });
      }
    }

    return await this.getAccessToken(response.clone() as unknown as Response);
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string;
    refreshToken: string;
    extraParams: NotionExtraParams;
  }> {
    let { access_token, refresh_token, ...extraParams } = await response.json();
    return {
      accessToken: access_token as string,
      refreshToken: refresh_token as string,
      extraParams,
    } as const;
  }
}
