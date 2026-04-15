import { expect, test } from "@playwright/test";
import { TestStepHelper } from "../helpers/test-step-helper";

test.describe("Lobby", () => {
  test("should show the landing page with Cluster title", async ({
    page,
  }, testInfo) => {
    const helper = new TestStepHelper(page, testInfo);
    helper.setMetadata(
      "Lobby Landing Page",
      "Verify the initial landing page of Cluster.",
    );

    await page.goto("/");

    await helper.step("landing_page", {
      description: "Landing page with Cluster title",
      verifications: [
        {
          spec: "Heading 'Cluster' is visible",
          check: async () => {
            await expect(
              page.getByRole("heading", { name: "Cluster" }),
            ).toBeVisible();
          },
        },
      ],
    });

    await page.getByRole("link", { name: "lobby" }).click();

    await helper.step("lobby_signin_prompt", {
      description: "Lobby page shows sign-in prompt when not authenticated",
      verifications: [
        {
          spec: "Sign-in message is visible",
          check: async () => {
            await expect(page.getByText("Please sign in.")).toBeVisible();
          },
        },
        {
          spec: "Sign-in button is visible",
          check: async () => {
            await expect(
              page.getByRole("button", { name: /Sign in/i }),
            ).toBeVisible();
          },
        },
      ],
    });

    helper.generateDocs();
  });
});
