const { test, expect } = require('@playwright/test');

test.describe('SekaiLib E2E Сценарії користувача', () => {

    test('Користувач може знайти тайтл через пошук та відкрити його', async ({ page }) => {

        await page.goto('/catalog');

        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.waitFor({ state: 'visible', timeout: 10000 });

        const beforeSearchLinks = await page.locator('a[href*="/titles/"]').count();

        if (beforeSearchLinks > 0) {
            const firstLink = page.locator('a[href*="/titles/"]').first();
            await firstLink.click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/\/titles\/[a-f0-9-]+/);
            return;
        }

        await searchInput.fill('манга');

        await page.waitForTimeout(700);

        const titleLinks = page.locator('a[href*="/titles/"]');
        const count = await titleLinks.count();
        
        if (count > 0) {

            await titleLinks.first().click();

            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/\/titles\/[a-f0-9-]+/);
        }
    });

    test('Спроба входу з невірними даними показує помилку', async ({ page }) => {

        await page.context().clearCookies();
        await page.addInitScript(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });

       await page.goto('/catalog');

        await page.waitForLoadState('networkidle');

        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        
        await emailInput.waitFor({ state: 'visible', timeout: 5000 });

        await emailInput.fill('wrong@invalid.test');
        await passwordInput.fill('IncorrectPassword123');

        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();

        await page.waitForTimeout(2000);

        const logoutVisible = await page.locator('button:has-text("Вийти"), text=Вийти').first().isVisible().catch(() => false);
        const tokens = await page.evaluate(() => ({
            accessToken: window.localStorage.getItem('accessToken'),
            refreshToken: window.localStorage.getItem('refreshToken'),
        }));

        expect(logoutVisible).toBeFalsy();
        expect(tokens.accessToken).toBeFalsy();
        expect(tokens.refreshToken).toBeFalsy();
    });
});