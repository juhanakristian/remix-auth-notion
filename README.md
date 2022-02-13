# NotionStrategy

Allow users to login with Notion.

Setup your application at [Notion integrations](https://www.notion.so/my-integrations)
The integration should be setup as **Public integration**

Copy **OAuth client ID** and **OAuth client secret** to your `NotionStrategy` setup and setup the **Redirect URI**.

**Notion requires that the redirect URI uses HTTPS**. In development you can use a service like [ngrok](https://ngrok.com/) to be able to test the integration.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## How to use

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
