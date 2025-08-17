import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173")

        # Wait for the matches to load
        expect(page.locator(".match-card")).to_have_count(1, timeout=30000)

        # Click on the first match
        page.locator(".match-card").first.click()

        # Wait for the prediction component to be visible
        prediction_component = page.locator(".match-prediction")
        expect(prediction_component).to_be_visible(timeout=30000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
