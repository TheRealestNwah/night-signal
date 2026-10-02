import { expect, test } from '@playwright/test';

test('starts, pauses, and resumes the apartment soundscape', async ({ page }) => {
  const audioRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/audio/')) audioRequests.push(new URL(request.url()).pathname); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Rainy\s*Apartment/);
  // Nothing is downloaded or played before a gesture.
  expect(audioRequests).toEqual([]);

  const player = page.getByRole('region', { name: 'Soundscape player' });
  await player.getByRole('button', { name: 'Start listening' }).click();
  await expect(player.getByRole('status')).toHaveText('Now playing');
  expect(audioRequests.sort()).toEqual(['/audio/apartment-lofi.wav', '/audio/apartment-rain.wav']);

  await player.getByRole('button', { name: 'Pause soundscape' }).click();
  await expect(player.getByRole('status')).toHaveText('Paused');
  await player.getByRole('button', { name: 'Play soundscape' }).click();
  await expect(player.getByRole('status')).toHaveText('Now playing');
});

test('switches scenes and keeps playing', async ({ page }) => {
  await page.goto('/');
  const player = page.getByRole('region', { name: 'Soundscape player' });
  await player.getByRole('button', { name: 'Start listening' }).click();
  await expect(player.getByRole('status')).toHaveText('Now playing');

  await page.getByRole('button', { name: /Midnight Highway/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Midnight\s*Highway/);
  await expect(page).toHaveURL(/#highway$/);
  await expect(player.getByRole('status')).toHaveText('Now playing');
  await expect(player.getByLabel('Road hum')).toBeVisible();
  await expect(player.getByLabel('Soft synth')).toBeVisible();
});

test('section links keep the selected scene and audio', async ({ page, isMobile }) => {
  await page.goto('/');
  const player = page.getByRole('region', { name: 'Soundscape player' });
  await player.getByRole('button', { name: 'Start listening' }).click();
  await page.getByRole('button', { name: /Midnight Highway/ }).click();
  await expect(player.getByRole('status')).toHaveText('Now playing');

  // The section link is hidden on phones, so only desktop clicks it.
  if (!isMobile) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'The scenes' }).click();
    await expect(page).toHaveURL(/#highway$/);
    await expect(page.locator('#environments')).toBeInViewport();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Midnight\s*Highway/);
    await expect(player.getByRole('status')).toHaveText('Now playing');
    await expect(player.getByLabel('Road hum')).toBeVisible();
  }

  await page.getByRole('link', { name: 'Skip to the scene' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#highway$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Midnight\s*Highway/);
  await expect(player.getByRole('status')).toHaveText('Now playing');
  await expect(player.getByLabel('Road hum')).toBeVisible();

  // The URL still names the scene, so a reload reopens it.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Midnight\s*Highway/);
});

test('remembers the mix and opens a scene from its link', async ({ page }) => {
  await page.goto('/#arcade');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Empty\s*Arcade/);
  const chimes = page.getByLabel('Chimes');
  await chimes.fill('0.2');
  await page.reload();
  await expect(page.getByLabel('Chimes')).toHaveValue('0.2');
});

test('does not scroll sideways', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
