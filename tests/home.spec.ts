import { expect, test } from '@playwright/test';

test.describe('Homepage daily focus', () => {
  test('shows hero messaging and default category links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'WordUp' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scrum Roles' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Play today's puzzle/i })).toHaveAttribute('href', /pm-scrum-roles\/\?category=pm/);
    await expect(page.getByText('Use the Product Management lens to sharpen collaboration, roadmapping, and stakeholder rituals while solving Scrum roles.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Product Management archive' })).toHaveAttribute('href', 'archive-pm.html');
  });

  test('switching category updates the CTA and archive link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Finance & Accounting' }).click();
    await expect(page.getByRole('link', { name: /Play today's puzzle/i })).toHaveAttribute('href', /pm-scrum-roles\/\?category=finance/);
    await expect(page.getByText('Switch to a finance lens by focusing on reporting, controls, and how Scrum roles keep value delivery accountable.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Finance & Accounting archive' })).toHaveAttribute('href', 'archive-accounting.html');
  });
});

test.describe('Puzzle CTA routing', () => {
  test('play more button follows category override', async ({ page }) => {
    await page.goto('/pm-scrum-roles/?category=finance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#play-more-btn')).toHaveAttribute('href', '../archive-accounting.html');
    await expect(page.locator('#play-more-btn')).toHaveText(/Play more/i);
  });
});
