import { describe, expect, it } from "vitest";
import { missingFirebaseSettings } from "../src/store/firebaseConfig";

describe("Firebase 연결 설정", () => {
  it("미리보기나 로컬 환경의 누락을 감지한다", () => {
    expect(missingFirebaseSettings({})).toEqual([
      "VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_DATABASE_URL",
    ]);
  });
  it("필수 설정이 있으면 앱을 시작할 수 있다", () => {
    expect(missingFirebaseSettings({
      VITE_FIREBASE_API_KEY: "key", VITE_FIREBASE_PROJECT_ID: "project",
      VITE_FIREBASE_DATABASE_URL: "https://example.firebaseio.com",
    })).toEqual([]);
  });
  it("빈 문자열과 공백도 누락으로 처리한다", () => {
    expect(missingFirebaseSettings({ VITE_FIREBASE_API_KEY: " ", VITE_FIREBASE_PROJECT_ID: "", VITE_FIREBASE_DATABASE_URL: "url" }))
      .toEqual(["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID"]);
  });
});
