import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the storage management page directly
        page.goto("http://localhost:5173/storage")

        # Wait for the historical data importer to be visible
        importer = page.locator(".historical-data-importer") # I need to add this class
        expect(importer).to_be_visible(timeout=10000)

        # Select season
        page.locator("#season-select").click()
        page.locator("text=2023-24").click()

        # Select league
        page.locator("#league-select").click()
        page.locator("text=English Premier League").click()

        # Click import
        page.locator("button:has-text('Import Data')").click()

        # Wait for the success message
        success_message = page.locator("text=/Successfully imported .* matches/")
        expect(success_message).to_be_visible(timeout=30000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/historical_import_success.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
