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

```ts
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

In `routes/auth/notion.tsx`

```tsx
import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = () => redirect("/login");

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("notion", request);
};
```

In `routes/auth/notion/callback.tsx`

```tsx
import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = async ({ request }) => {
  return authenticator.authenticate("notion", request, {
    successRedirect: "/success",
    failureRedirect: "/login",
  });
};
```

Now you can direct the user to login by making a Form with POST to `/auth/notion`

```tsx
import { Form } from "remix";

export default function Index() {
  return (
    <Form action="/auth/notion" method="post">
      <button>Login with Notion</button>
    </Form>
  );
}
```
