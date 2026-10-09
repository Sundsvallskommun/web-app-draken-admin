import { expect, test } from './fixtures';

test('renders the authenticated admin start page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Välkommen', exact: true })).toBeVisible();
  await expect(page.getByLabel('Ändringar gäller testmiljön.').first()).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: /Etiketter/ })).toBeVisible();
});

test('renders the labels route without a selected namespace', async ({ page }) => {
  await page.goto('/labels');

  await expect(page.getByRole('heading', { name: 'Etiketter', exact: true })).toBeVisible();
  await expect(page.getByText('Välj ett namespace för att visa etiketter.')).toBeVisible();
  await expect(page.getByPlaceholder('Sök bland etiketter…')).toBeDisabled();
});

test('shows authorization failures on the login page', async ({ page }) => {
  await page.goto('/login?failMessage=NOT_AUTHORIZED');

  await expect(page.getByRole('button', { name: 'Logga in' })).toBeVisible();
  await expect(page.getByText('Du saknar behörighet till adminpanelen.')).toBeVisible();
});
