import { expect, test } from "@playwright/test";

test("stays on protected route when refresh succeeds", async ({ page }) => {
  await page.route("**/auth/refresh-token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "success",
        data: { newToken: "fresh-access-token" },
      }),
    });
  });

  await page.route("**/users/profile", async (route) => {
    const authHeader = route.request().headers().authorization;

    if (authHeader === "Bearer fresh-access-token") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Success",
          data: { id: 1, role: "teacher", name: "Teacher Test" },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Token expired", code: "TOKEN_EXPIRED" }),
    });
  });

  await page.goto("/teacher");

  await expect(page).toHaveURL(/\/teacher$/);
});

test("redirects to signin when refresh token is expired", async ({ page }) => {
  await page.route("**/auth/refresh-token", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Refresh token expired",
        code: "AUTH_REFRESH_TOKEN_EXPIRED",
      }),
    });
  });

  await page.goto("/teacher");

  await expect(page).toHaveURL(/\/signin$/);
});

test("refresh queue only calls refresh once for concurrent 401 requests", async ({ page }) => {
  let refreshCallCount = 0;
  let profileCallCount = 0;

  await page.route("**/auth/refresh-token", async (route) => {
    refreshCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "success",
        data: { newToken: "fresh-access-token" },
      }),
    });
  });

  await page.route("**/users/profile", async (route) => {
    profileCallCount += 1;
    const authHeader = route.request().headers().authorization;

    if (authHeader === "Bearer fresh-access-token") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Success",
          data: { id: 1, role: "teacher", name: "Teacher Test" },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Token expired", code: "TOKEN_EXPIRED" }),
    });
  });

  await page.goto("/signin");
  await page.waitForLoadState("networkidle");

  // Ignore PublicRoute initialization refresh attempt and only count calls from concurrent requests.
  refreshCallCount = 0;
  profileCallCount = 0;

  await page.evaluate(() => {
    window.__E2E__?.setAccessToken("expired-access-token");
  });

  const statuses = await page.evaluate(async () => {
    const result = await window.__E2E__?.runProfileRequests(3);
    return result?.map((item) => item.status) ?? [];
  });

  expect(refreshCallCount).toBe(1);
  expect(statuses).toEqual(["fulfilled", "fulfilled", "fulfilled"]);
  expect(profileCallCount).toBeGreaterThanOrEqual(6);
});
