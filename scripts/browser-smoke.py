import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("BROWSER_SMOKE_BASE_URL", "http://127.0.0.1:3101")
ARTIFACTS = Path("artifacts/browser-smoke")


def assert_page(page, path: str, expected_text: str) -> None:
    response = page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=90_000)
    assert response is not None and response.ok, f"{path} returned {response.status if response else 'no response'}"
    page.get_by_text(expected_text, exact=False).first.wait_for(state="visible")
    has_overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    assert not has_overflow, f"{path} has horizontal overflow"


def main() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.set_default_timeout(60_000)
        page_errors: list[str] = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))

        assert_page(page, "/privacy", "Privacy")
        page.screenshot(path=str(ARTIFACTS / "privacy.png"), full_page=True)
        assert_page(page, "/terms", "Terms")

        assert_page(page, "/login", "Sign in")
        page.get_by_label("Email").wait_for(state="visible")
        page.locator('input[type="password"]').wait_for(state="visible")
        page.keyboard.press("Tab")
        assert page.evaluate("document.activeElement !== document.body"), "Login page has no keyboard focus target"
        page.screenshot(path=str(ARTIFACTS / "login.png"), full_page=True)

        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page.wait_for_url("**/login**")

        assert not page_errors, f"Browser page errors: {page_errors}"
        browser.close()
        print("Browser smoke passed: login, privacy, terms, and protected-route redirect")


if __name__ == "__main__":
    main()
