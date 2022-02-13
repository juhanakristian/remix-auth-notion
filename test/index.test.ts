import { createCookieSessionStorage } from "@remix-run/server-runtime";
import { NotionStrategy } from "../src";

describe(NotionStrategy, () => {
  let verify = jest.fn();
  // You will probably need a sessionStorage to test the strategy.
  let sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3t"] },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should have the name of the strategy", () => {
    let strategy = new NotionStrategy(
      {
        clientID: "clientID",
        callbackURL: "callbackURL",
        clientSecret: "clientSecret",
      },
      verify
    );
    expect(strategy.name).toBe("notion");
  });
});
