const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await p.goto('http://localhost:8870/math-dialogue/solo/teacher/?org=TEST01'); await p.waitForSelector('[data-pk="login"]');
  await p.evaluate(() => document.querySelector('[data-pk="login"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[2] + '/shot-login.png' });
  await p.fill('#k-login-id', 'sensei'); await p.fill('#k-login-pass', 'pass1234'); await p.click('form[name="kotsu-login"] button[type="submit"]'); await p.waitForSelector('.k-who');
  await p.click('[data-pk="manage"]'); await p.waitForSelector('.k-pk-panel'); await p.fill('input[name="pk-label"]', '田中のiPhone');
  await p.fill('.k-pk-panel input[name="password"]', 'pass1234'); await p.click('[data-pk="add"]'); await p.waitForSelector('[data-pk="done"]');
  await p.screenshot({ path: process.argv[2] + '/shot-panel.png' });
  await b.close();
})();
