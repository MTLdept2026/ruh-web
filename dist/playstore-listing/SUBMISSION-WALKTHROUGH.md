# Ruh — Play Console submission walkthrough

End-to-end runbook to ship `ruh-v2-playstore.aab` to **Internal testing**
(the safest first track), then **Closed testing**, then Production.

Read the entire document once before you start clicking. There are two
important first-time-publisher gotchas:

1. If your Play Console account is a new personal developer account, Google
   requires a Closed test with at least 12 opted-in testers for 14 continuous
   days before you can apply for Production access.
2. There is a **critical TWA gotcha** in Step 6 that will silently break your
   app on real devices if you skip it.

All the assets referenced live in:

```
ruh-web/dist/android-playstore/        (AAB, APK, assetlinks, privacy policy)
ruh-web/dist/playstore-listing/        (feature graphic, screenshots, copy)
```

Important: the package name is now `com.alruh.app`. If an old AAB still says
`com.ruh.app`, do not upload it. Rebuild the Android bundle first.

---

## Stage 0 — Pre-flight (do this BEFORE you touch Play Console)

Open three browser tabs and confirm each returns 200 OK:

1. `https://ruh-app.netlify.app/` — the live web app loads.
2. `https://ruh-app.netlify.app/.well-known/assetlinks.json` — returns
   the JSON shown below, with `Content-Type: application/json`. (Use
   curl: `curl -i https://ruh-app.netlify.app/.well-known/assetlinks.json`)
3. `https://ruh-app.netlify.app/privacy-policy` — privacy policy page
   loads.

If any of the three is missing, **deploy the current `ruh-web` repo to
Netlify first**. The repo already contains the right `.well-known/`,
`_headers`, and `_redirects` to make those URLs live; nothing else to
change.

As of May 9, 2026, the live app homepage returns 200, but
`/.well-known/assetlinks.json` and `/privacy-policy` returned 404 during a
pre-flight check. Do not submit to Play Console until a fresh Netlify deploy
makes both URLs return 200.

You can also sanity-check Digital Asset Links with Google's tool:

```
https://developers.google.com/digital-asset-links/tools/generator
```

Paste in the package name `com.alruh.app` and the SHA-256 fingerprint
`3A:DD:55:54:14:83:64:81:EE:08:68:E7:90:72:A8:D6:4B:2B:9E:54:64:E7:71:92:11:D4:BD:BD:B6:E5:63:47`
along with the host `ruh-app.netlify.app`, hit **Test statement** —
expect a green check.

---

## Stage 1 — Create the app in Play Console

1. Sign in to Play Console (`play.google.com/console`) with your
   developer account.
2. **Create app** → fill the dialog:
   - **App name**: `Rūḥ — Quranic Reflection`
   - **Default language**: `English (United States) – en-US`
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: tick both ("App content guidelines",
     "US export laws").
3. Click **Create app**. You land on the app dashboard.

---

## Stage 2 — Set up your app (the dashboard checklist)

Play Console's left rail shows a **Set up your app** task list. You
**must** complete every item before any track will accept a release.
Open them in order. Use `data-safety-and-policies.md` as your answer
key.

- **Set privacy policy** →
  `https://ruh-app.netlify.app/privacy-policy`
- **App access** → All functionality available without restrictions
- **Ads** → No ads
- **Content rating** → Run the questionnaire using §4 of the data-safety
  doc. Expected outcome: Everyone / IARC 3+.
- **Target audience and content** → Ages 13+. "Unintentionally appeals
  to children" → No.
- **News apps** → No
- **COVID-19 contact tracing app** → No
- **Data safety** → Use §8 of the data-safety doc. This is the longest
  one; budget 20 minutes.
- **Government apps** → No
- **Financial features** → None
- **Health** → No
- **Select an app category** → **Lifestyle**
- **Provide contact details** → Email + website + (optional) phone.
  Use the values in `listing-copy.md` § Contact.
- **Set up your store listing** → see Stage 3 below; this is where the
  copy and graphics go.

A green check shows up next to each item once it's saved. The "Send
release for review" button on a track is greyed out until every item
in this list is green.

---

## Stage 3 — Store listing

Navigate **Grow → Store presence → Main store listing**.

| Field | Source |
| --- | --- |
| App name | `listing-copy.md` § App name |
| Short description | `listing-copy.md` § Short description |
| Full description | `listing-copy.md` § Full description |
| App icon | `dist/android-playstore/store-icon-512.png` (512×512, ≤1MB) |
| Feature graphic | `dist/playstore-listing/feature-graphic.png` (1024×500) |
| Phone screenshots | All five in `dist/playstore-listing/screenshots/` |
| Tablet screenshots | Skip for now (not required) |
| Promo video | Skip |

Save. The listing must be approved alongside your release; you can keep
editing it after submission.

> Critical sizing: feature graphic must be **exactly 1024×500 px**, JPEG
> or 24-bit PNG (no alpha). Our PNG is 24-bit, no alpha — verified.

---

## Stage 4 — Internal testing track: create a release

1. Navigate **Test → Internal testing → Create new release**.
2. **App integrity / App signing**: Play Console will offer to
   **enroll your app in Play App Signing**. Accept it. (See Stage 6 for
   what this means and the assetlinks fix you must do afterwards.)
3. **App bundles**: Upload
   `dist/android-playstore/ruh-v2-playstore.aab`.
   - First-time uploads may take 1–2 minutes to validate.
   - Expect: package name `com.alruh.app`, version code `2`, version
     name `2`, target SDK 35, min SDK 21.
   - If Play Console shows package name `com.ruh.app`, you uploaded an old
     bundle. Stop, rebuild, and upload the new one.
4. **Release name**: auto-fills as `2 (2)`. Leave it.
5. **Release notes** (per language): paste the Internal testing block
   from `listing-copy.md` § Release notes.
6. Click **Next**. Play Console runs validation. Resolve any blocking
   errors *here*; non-blocking warnings can be ignored for now.

---

## Stage 5 — Add internal testers

1. **Test → Internal testing → Testers** tab.
2. **Create email list** → Name it "Ruh internal" → paste up to 100
   email addresses (one per line). At minimum, include your own.
3. Save the list and tick it on the Testers page.
4. Copy the **Opt-in URL** Play Console shows. Send it to each tester;
   they must open it on the same Google account they registered above
   and accept the opt-in.

---

## Stage 6 — The TWA gotcha: re-add Play App Signing fingerprint to assetlinks.json

**Read this twice.** This is what trips up almost every Trusted Web
Activity submission.

The AAB you uploaded is signed with your **upload key** (SHA-256 ends
`…63:47`). Once you enroll in Play App Signing, Google generates a
**separate App Signing key** and re-signs your AAB with it before
distributing. The phone receives an APK signed with that key — *not*
your upload key. Digital Asset Links verification checks the running
APK's certificate against `assetlinks.json` on your domain. If
`assetlinks.json` only contains the upload fingerprint, **verification
will fail on every install** and the TWA will fall back to a Chrome
custom-tab with the URL bar visible.

Fix:

1. After your release uploads, navigate **Setup → App integrity →
   App signing**.
2. Copy the **App signing key certificate — SHA-256** value. It looks
   like `AB:CD:EF:…` (different from your upload key's `3A:DD:55:…`).
3. Edit `ruh-web/.well-known/assetlinks.json` to include **both**
   fingerprints:

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.alruh.app",
         "sha256_cert_fingerprints": [
           "3A:DD:55:54:14:83:64:81:EE:08:68:E7:90:72:A8:D6:4B:2B:9E:54:64:E7:71:92:11:D4:BD:BD:B6:E5:63:47",
           "<<paste the App Signing SHA-256 here>>"
         ]
       }
     }
   ]
   ```

4. Commit, push, redeploy Netlify, re-verify
   `https://ruh-app.netlify.app/.well-known/assetlinks.json` — both
   fingerprints must be present.
5. Also keep `dist/android-playstore/assetlinks.json` in sync so your
   git history matches the deployed file.

How to know it worked: install the internal-testing APK on a real
device, open it. The app should run **without** a Chrome address bar
strip at the top. If you see the URL bar, the fingerprint match failed
— double-check step 3.

---

## Stage 7 — Push to Internal testing

1. With the release saved, click **Review release** at the bottom of
   the release page.
2. Play Console runs final policy checks. Common warnings on a TWA:
   - "Your app appears to be a web app" → fine, no action needed.
   - "Ad ID permission" → make sure you didn't accidentally tick
     anything in §2 that says you have ads.
3. Click **Start rollout to internal testing**.
4. Status will move from *In progress* → *Available to internal testers*
   within minutes. No human review for Internal testing.

Tell your testers to open the opt-in URL, then either:
- Search "Rūḥ" in Play Store on the same Google account, or
- Tap the direct Play Store URL Play Console gives you on the Internal
  testing page.

---

## Stage 8 — Verify the app on a real device

Smoke test checklist on the first install:

- [ ] App opens **full-screen, no Chrome address bar**. (If the URL
      strip appears, you have an assetlinks fingerprint problem;
      see Stage 6.)
- [ ] Splash screen shows the gold-on-navy Ruh wordmark for ~300 ms.
- [ ] Home screen renders. Bottom nav is visible (Verse, Journey,
      Salawat, Protection, Diary).
- [ ] Daily verse loads. Reflect / Understand / Action tabs work.
- [ ] Salawat counter increments on tap; the chime plays at the 10th tap.
- [ ] Diary entry persists across app close-and-reopen.
- [ ] Prayer-times reminder toggle prompts the
      `POST_NOTIFICATIONS` permission and a test reminder fires.
- [ ] Backgrounding the app for >30 minutes and reopening doesn't
      land on a stale shell (the version-poller in `index.html`
      should reload to current).

---

## Stage 9 — Closed testing, required before Production for new personal accounts

Internal testing is for your own quick QA. Closed testing is the one Google
counts before Production access for new personal developer accounts.

1. Navigate **Test → Closed testing**.
2. Create or manage the default Closed testing track.
3. Add at least **12 testers**. Use real people who can stay opted in.
4. Upload the same AAB, or a newer version with a higher version code.
5. Roll out the Closed test.
6. Send testers the opt-in link. Tell them clearly: **do not opt out for 14
   days**.
7. Ask testers to open the app and try the smoke-test checklist above. Keep a
   short note of feedback and fixes, because Google asks for this later.
8. After 12 testers have been opted in for 14 continuous days, go to the
   app **Dashboard → Apply for production**.

When applying for Production access, Google asks what you tested, what feedback
you received, what you fixed, and why the app is ready. Be specific and honest.

---

## Stage 10 — Production release

Once Google grants Production access:

1. Go to **Test and release → Production → Create new release**.
2. Upload the newest AAB. If you changed anything since Closed testing, make
   sure the version code is higher than the Closed testing build.
3. Paste the Production release notes from `listing-copy.md`.
4. Review warnings. Fix blocking errors; non-blocking TWA warnings are usually
   okay.
5. Start with a small rollout if Play Console offers staged rollout controls,
   then expand after you see no crashes or user complaints.

If any item fails, fix it in the web app, bump `version.json` and the
inline `APP_VERSION` in `index.html`, redeploy Netlify, and the next
TWA open will pick up the change without rebuilding the AAB. (That's
the key advantage of TWA: web changes ship without a Play Console
re-upload.)

The AAB only needs to change for: package name, signing fingerprints,
TWA host, asset links, manifest icon, splash, or notification icon.

---

## Stage 9 — Promote toward production

After Internal testing is verified:

1. **Test → Internal testing → Promote release →** choose **Closed
   testing** or **Open testing**.
2. Closed testing requires **at least 12 testers running for 14 days**
   for new developer accounts before Production is unlocked. Plan for
   this — Google enforces it strictly for accounts created after
   November 2023. (Skip this paragraph if your account predates that.)
3. After the 14-day window, promote again to **Production**.
4. Production submission goes to manual review — typically 1–7 days,
   sometimes 14 for new publishers. Watch the **Publishing overview**
   page; Google emails decisions to your developer-account address.

---

## Stage 10 — Post-launch

Things to do once you're live:

1. **Set up "What's new" template**: every AAB version bump needs new
   release notes. Keep a running file.
2. **Crash & ANR**: Play Console **Quality → Android vitals** shows
   crashes. TWAs rarely crash (the wrapper is minimal), but watch for
   webview/Chrome version issues.
3. **Reviews**: enable email notifications for new reviews; reply
   thoughtfully — your replies show in the listing.
4. **Update cadence**: web app changes ship through Netlify
   continuously without re-uploading the AAB. Only re-upload when you
   bump `appVersionCode` in `twa-manifest.json` and rebuild.

---

## Honest limitations of this runbook

- **I haven't been able to verify your live URLs from this environment**
  (network restrictions). Stage 0 is non-negotiable; do not skip.
- **The screenshots are mockups, not device captures.** They communicate
  the app's design well, but Google policy permits but mildly prefers
  real-device captures. Once you've installed the internal build, take
  five real captures with your phone (Power + Volume Down) and replace
  the mocks before Production.
- **Play Console UI changes constantly.** Menu names in Stages 4–9 may
  differ slightly by the time you read this. The conceptual flow
  (release → tester list → review → roll out) is stable.
- **The 14-day closed-testing requirement** for new developer accounts
  is enforced by Google policy, not this app. If you registered as a
  developer recently, expect that delay before Production.
