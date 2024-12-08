import { describe, expectTypeOf, it } from "vitest";
import type { ProfileAction, UserProfile } from "../../src/common/profiles.ts";

describe("profiles tests", () => {
  it("ProfileAction type check", () => {
    let profileAction: ProfileAction = {
      type: "hi",
    };
    expectTypeOf(profileAction).toMatchTypeOf<UserProfile>(); // Wrong.
    expectTypeOf(profileAction).toMatchTypeOf<ProfileAction>();
    profileAction = {
      type: "hi",
      alias: "anAlias",
      profile_image: "anImageString",
    };
    expectTypeOf(profileAction).toMatchTypeOf<ProfileAction>();
  });
  it("UserProfile type check", () => {
    const userProfile: UserProfile = {
      alias: "anAlias",
      profile_image: "anImageString",
      games: ["game1", "game2"],
    };
    expectTypeOf(userProfile).toMatchTypeOf<UserProfile>();
  });
});
