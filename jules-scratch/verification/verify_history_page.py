import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the history page
        page.goto("http://localhost:5173/history")

        # Check for the main heading to ensure the page loaded without crashing
        heading = page.locator("h1:has-text('Historique des Matchs')")
        expect(heading).to_be_visible(timeout=10000)

        # Check if there's a message about no matches (for empty DB state)
        no_matches_message = "Aucun match historique trouvé"
        has_no_matches = page.locator(f"text={no_matches_message}").is_visible()

        if not has_no_matches:
            # If the message is not there, there should be matches.
            # Let's wait for at least one card to be present.
            # The component uses Card, so we can look for that.
            first_card = page.locator(".card").first
            expect(first_card).to_be_visible(timeout=10000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/history_page_verification.png")
        print("History page verified successfully.")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
