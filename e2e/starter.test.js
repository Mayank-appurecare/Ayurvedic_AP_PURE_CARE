describe('Welcome flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // First launch only: AsyncStorage remembers this across reloadReactNative().
    await waitFor(element(by.text('Skip')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Skip')).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('shows the welcome screen after splash', async () => {
    await waitFor(element(by.text('AP Pure Care')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('navigates to Login when the Login button is tapped', async () => {
    await waitFor(element(by.text('Login')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Login')).tap();
    await waitFor(element(by.text('Welcome Back')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('lets a guest continue into the app without logging in', async () => {
    await waitFor(element(by.text('Continue as Guest')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Continue as Guest')).tap();
    await waitFor(element(by.text('Shop by Category')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
