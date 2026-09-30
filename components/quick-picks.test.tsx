import { describe, expect, test } from "bun:test";
import { isHomeLeaderboardHref } from "./quick-picks";

describe("isHomeLeaderboardHref", () => {
  test.each(["/", "/?weights=open", "/?slm=true", "/?view=speed"])(
    "%s targets the home leaderboard (full page load)",
    (href) => {
      expect(isHomeLeaderboardHref(href)).toBe(true);
    },
  );

  test.each(["/best-for/coding", "/best-for/budget", "/model/nvidia/nemotron-3.5-lightning-30b-a3b"])(
    "%s keeps client-side navigation",
    (href) => {
      expect(isHomeLeaderboardHref(href)).toBe(false);
    },
  );
});
