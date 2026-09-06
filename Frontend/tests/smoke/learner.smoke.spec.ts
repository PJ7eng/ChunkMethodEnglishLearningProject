import { expect, test, type Page } from "@playwright/test";

const user = {
  id: "user-1",
  email: "learner@example.com",
  name: "Smoke Learner",
  role: "learner",
  emailVerified: true,
};

const chunk = {
  id: "chunk-1",
  phrase: "check in",
  translation: "辦理登記",
  pinyin: "",
  category: "travel",
  options: ["check in", "check out", "turn in"],
  answer: "check in",
  examples: ["We can check in after three."],
  blank: "We need to ___ at the hotel.",
  needsReview: true,
  mastered: false,
};

async function mockApi(page: Page) {
  let signedIn = false;
  let notes = [
    {
      id: "note-1",
      english: "break the ice",
      translation: "打破僵局",
      category: "smalltalk",
      createdAt: Date.now(),
    },
  ];
  await page.route("http://localhost:3000/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", json: body });

    if (path === "/auth/register" || path === "/auth/login") {
      signedIn = true;
      return json({ success: true, message: "ok", token: "access-token", user });
    }
    if (path === "/auth/me") {
      return signedIn
        ? json({ success: true, message: "ok", user })
        : json({ message: "Unauthorized" }, 401);
    }
    if (path === "/auth/logout" || path === "/auth/account") {
      signedIn = false;
      return json({ success: true });
    }
    if (path === "/auth/account/export") {
      return json({ exportedAt: "2026-08-17T00:00:00.000Z", user });
    }
    if (path === "/preferences") {
      return json({
        dailyGoal: 10,
        soundEnabled: false,
        reminderEnabled: false,
        hapticEnabled: false,
        autoNextEnabled: false,
      });
    }
    if (path === "/progress/today") {
      return json({
        completedCount: 0,
        goal: 10,
        streak: 2,
        date: "2026-08-17",
      });
    }
    if (path === "/progress/stats/categories") {
      return json({
        learned: [{ id: "travel", value: 1 }],
        mastered: [],
        needsReview: [{ id: "travel", value: 1 }],
        totals: { learned: 1, mastered: 0, needsReview: 1 },
      });
    }
    if (path === "/progress/streak") {
      return json({
        currentStreak: 2,
        longestStreak: 3,
        totalPracticedDays: 3,
        weekData: [],
      });
    }
    if (path === "/progress/review") return json([chunk]);
    if (path === "/progress/answer") {
      return json({
        mastered: false,
        answerCount: 2,
        reviewCount: 1,
        needsReview: false,
      });
    }
    if (path === "/chunks/random") return json(chunk);
    if (path === "/notes/stats/categories") return json([]);
    if (path === "/notes" && method === "GET") return json(notes);
    if (path === "/notes" && method === "POST") {
      const body = request.postDataJSON();
      const created = {
        id: "note-2",
        ...body,
        createdAt: Date.now(),
      };
      notes = [created, ...notes];
      return json(created, 201);
    }
    if (path.startsWith("/notes/") && method === "PATCH") {
      const id = path.split("/").at(-1);
      const patch = request.postDataJSON();
      const current = notes.find((note) => note.id === id)!;
      const updated = { ...current, ...patch };
      notes = notes.map((note) => (note.id === id ? updated : note));
      return json(updated);
    }
    return json({});
  });
}

async function login(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("輸入郵箱").fill("learner@example.com");
  await page.getByPlaceholder("輸入密碼").fill("secure-pass");
  await page.getByRole("button", { name: "登錄", exact: true }).click();
  await expect(page.getByRole("button", { name: "Home" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("registration and login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "沒有帳號？點此註冊" }).click();
  await page.getByPlaceholder("輸入用戶名").fill("Smoke Learner");
  await page.getByPlaceholder("輸入郵箱").fill("learner@example.com");
  await page.getByPlaceholder("設置密碼（至少 8 位）").fill("secure-pass");
  await page.getByPlaceholder("再次輸入密碼").fill("secure-pass");
  await page.getByRole("button", { name: "創建帳號" }).click();
  await expect(page.getByText("Ready to learn?")).toBeVisible();

  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page.getByText("歡迎回來！")).toBeVisible();

  await page.getByPlaceholder("輸入郵箱").fill("learner@example.com");
  await page.getByPlaceholder("輸入密碼").fill("secure-pass");
  await page.getByRole("button", { name: "登錄", exact: true }).click();
  await expect(page.getByText("Ready to learn?")).toBeVisible();
});

test("learning and due review", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Draw a Chunk" }).click();
  await expect(page.getByText('"check in"', { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: /Tap to reveal translation/ })
    .click();
  await page.getByRole("button", { name: "I remembered" }).click();
  await page.getByRole("button", { name: "Exit" }).click();

  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await page.getByRole("button", { name: "check in" }).click();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.getByText("Review complete!")).toBeVisible();
});

test("notes create and edit", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Notes" }).click();
  await expect(page.getByText("break the ice")).toBeVisible();
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByPlaceholder("e.g. How's it going?").fill("on the same page");
  await page.getByPlaceholder("e.g. 最近怎么样？").fill("有共識");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("on the same page")).toBeVisible();

  await page.getByText("on the same page").click();
  await page.getByPlaceholder("e.g. How's it going?").fill("on the same wavelength");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("on the same wavelength")).toBeVisible();
});

test("export, account deletion, and logout", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Open settings" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出我的資料" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "chunkmaster-account.json",
  );

  page.once("dialog", (dialog) => dialog.accept("secure-pass"));
  await page.getByRole("button", { name: "刪除帳號" }).click();
  await expect(page.getByText("歡迎回來！")).toBeVisible();

  await page.getByPlaceholder("輸入郵箱").fill("learner@example.com");
  await page.getByPlaceholder("輸入密碼").fill("secure-pass");
  await page.getByRole("button", { name: "登錄", exact: true }).click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page.getByText("歡迎回來！")).toBeVisible();
});
