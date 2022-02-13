# NotionStrategy

Allow users to login with Notion.

Setup your application at [Notion integrations](https://www.notion.so/my-integrations)

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## How to use

Notion requires that the `callbackURL` uses **HTTPS**. In development you can use a service like [ngrok](https://ngrok.com/) to be able to test the integration.

```
let notionStrategy = new NotionStrategy(
  {
    clientID: "",
    clientSecret: "",
    callbackURL: "https://domain-name.com/auth/notion/callback",
  },
  async ({ accessToken, extraParams, profile }) => {
    return {
      accessToken,
      id: profile.id,
      name: profile.name,
    };
  }
);

authenticator.use(notionStrategy);

```
