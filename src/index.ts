import { StrategyVerifyCallback } from "remix-auth";

import {
  OAuth2Profile,
  OAuth2Strategy,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

export interface NotionStrategyOptions {
  clientID: string;
  callbackURL: string;
  clientSecret: string;
}

export interface NotionProfile extends OAuth2Profile {
  type: string;
  avatar_url: string;
}

export interface NotionExtraParams
  extends Record<string, string | number | Record<string, unknown>> {
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
  bot_id: string;
  owner: Record<string, unknown>;
}

export class NotionStrategy<User> extends OAuth2Strategy<
  User,
  NotionProfile,
  NotionExtraParams
> {
  name = "notion";

  constructor(
    { clientID, callbackURL, clientSecret }: NotionStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<NotionProfile, NotionExtraParams>
    >
  ) {
    super(
      {
        clientID,
        callbackURL,
        clientSecret,
        authorizationURL: "https://api.notion.com/v1/oauth/authorize",
        tokenURL: "https://api.notion.com/v1/oauth/token",
      },
      verify
    );
  }

  protected authorizationParams() {
    return new URLSearchParams({
      owner: "user",
      response_type: "code",
    });
  }
}
