# Data Safety, Content Rating, and Policy Disclosures

This document is the answer key for every Play Console questionnaire that
blocks your release. Click each section open in Play Console, copy the
answer here, save, repeat.

If anything in this file disagrees with what's in the **live privacy
policy** at `https://ruh-app.netlify.app/privacy-policy`, the privacy
policy must be updated *first* — Google compares them.

Sources of truth I used:
- `privacy-policy.html` (the live text)
- Android release manifest (runtime permissions declared:
  `android.permission.POST_NOTIFICATIONS`,
  `android.permission.ACCESS_FINE_LOCATION`, and
  `android.permission.ACCESS_COARSE_LOCATION`)
- `netlify/functions/push-subscription.mjs` and `push-config.mjs`
  (what actually leaves the device when reminders are enabled)
- `index.html` (no analytics SDK; no ad SDK; only `adhan.min.js`,
  React, Babel, Tailwind)

If the implementation changes, redo the form. Google audits this.

---

## 1. App content — Privacy policy URL

> **Privacy Policy URL**
>
> ```
> https://ruh-app.netlify.app/privacy-policy
> ```

Google fetches this URL during review. Verify it returns 200 OK in an
incognito window before you submit.

---

## 2. App content — Ads

> **Does your app contain ads?** → **No**

Justification: no ad SDKs in the codebase; no `<script>` tags pointing at
ad networks; the privacy policy explicitly says "Ruh does not include
advertising SDKs."

---

## 3. App content — App access

> **Is all functionality available without restrictions?** → **Yes,
> all functionality is available without special access.**

There is no login, no paywall, no region-gating. Internal testers don't
need credentials.

---

## 4. App content — Content rating questionnaire

Play Console runs an IARC-based questionnaire. Honest answers:

| Question | Answer |
| --- | --- |
| Category | **Reference, News, or Educational** |
| Violence | None |
| Sexuality | None |
| Profanity | None |
| Controlled substances | None |
| Gambling | None |
| User-generated content (UGC) | **No** — the diary stays on-device. There is no comment, post, share, or social feature that sends content to other users. |
| Location sharing with other users | No |
| Personal info shared with other users | No |
| Digital purchases | No |
| Real-money gambling | No |
| Unrestricted internet | **Yes** — the TWA opens a Chrome custom tab pointed at the live web app. (Google considers any browser-style content "unrestricted internet.") |
| Mature themes | None |

Expected outcome: **PEGI 3 / Everyone / IARC 3+**.

---

## 5. App content — Target audience and content

> **Target age group** → **18+ only? No.** Pick **All ages** or **Ages 13 and up**.

Recommended: **Ages 13 and up**. The privacy policy says "Ruh is not
directed to children under 13" — selecting "All ages" would force you
into the **Designed for Families** programme, which adds extra ads-policy
and SDK-attestation burden. "13+" is the cleanest match.

> **Does your app unintentionally appeal to children?** → **No**

Justification: branding (Cinzel serif, Quranic terminology, reflection
prompts) reads as adult-oriented.

---

## 6. App content — News apps

> **Is your app a news app?** → **No**

It's a personal reflection tool, not a publisher of current events.

---

## 7. App content — COVID-19 contact tracing and status apps

> Is this a COVID-19 contact tracing or status app? → **No**.

---

## 8. App content — Data safety form (the big one)

This is the public "Data safety" card on the Play Store listing. It must
match the privacy policy. Take it section by section.

### 8.1 Data collection and security

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** (only because of push reminders — see 8.2). |
| Is all of the user data collected by your app encrypted in transit? | **Yes**. Netlify enforces HTTPS site-wide; push subscription endpoints are HTTPS only. |
| Do you provide a way for users to request that their data be deleted? | **Yes**. Turning off reminders deletes the push subscription record server-side; clearing app storage deletes everything else. |

### 8.2 Data types collected, shared, and why

Only enable the rows below. Leave every other category as "Not collected."

#### Personal info

- Name → **Not collected**
- Email address → **Not collected**
- User IDs → **Not collected** (no accounts).
- Address, phone number, race/ethnicity, sexual orientation, etc. →
  **Not collected**.

> Note: the privacy policy mentions "your name or nickname" being stored
> on-device. Google's Data Safety form is about data that **leaves the
> device**. Local-only data is **not** "collected" in this form's
> definition. Do not check Name here.

#### Financial info → **None collected**

#### Health and fitness → **None collected**

#### Messages, photos, videos, audio, files → **None collected**

(The diary stays on-device. Do not check anything in this section.)

#### Location

- Approximate location → **Collected? No** — the app may request Android/browser
  location permission for prayer-time and qibla features, but GPS/device
  location is not sent to your servers.
- Precise location → **Collected? No** — same.

> Justification: the Android wrapper declares coarse/fine location because the
> TWA location-delegation library can pass device location permission through to
> the web app. Prayer-time calculation and qibla direction run on-device. The
> push-subscription endpoint stores a free-text location *label* (e.g.
> "Kuala Lumpur") supplied by the user, not GPS coordinates. A user-typed city
> label is disclosed below under **App activity → Other user-generated
> content**.

#### Web browsing → **None collected**

#### App activity

- App interactions → **Not collected**
- In-app search history → **Not collected**
- Installed apps → **Not collected**
- Other user-generated content → **Collected: yes** (city/location label, if user enables reminders)
- Other actions → **Not collected**

For "Other user-generated content":
- **Collected** = Yes
- **Shared with third parties** = No
- **Optional or required** = **Optional** (only if user enables reminders)
- **Why is this data collected?** = **App functionality** (to schedule
  prayer reminders for the right city/timezone)
- **Is data processed ephemerally?** = No (stored as part of the
  subscription record until user turns reminders off)

#### App info and performance → **None collected**

(No crash logs, no diagnostics SDK.)

#### Device or other IDs

- Device or other IDs → **Collected: yes**

Justification: the push subscription endpoint is a Web Push endpoint URL
unique to the device + browser. Google's definition of "Device or other
IDs" includes any persistent identifier tied to the device, so the safest
answer is yes.

- **Shared with third parties** = **Yes** — Web Push messages are
  delivered through the browser's push provider (FCM for Chromium-based
  Android browsers / TWA). You as the developer don't talk to FCM
  directly, but the subscription endpoint *is* an FCM endpoint, so
  declare it.
- **Optional or required** = **Optional**
- **Why is this data collected?** = **App functionality**

### 8.3 Security practices

- Data is encrypted in transit → **Yes** (TLS via Netlify)
- Users can request data be deleted → **Yes** (toggle off reminders;
  clear app storage)
- Committed to Play Families Policy → **N/A** (not in the Designed for
  Families program)
- Independent security review → **No** (be honest)

### 8.4 Data practices summary that Google generates

After you save the form, Google will render a summary card. Expect:

- "Data shared with third parties: Device or other IDs (optional)"
- "Data collected: Other user-generated content, Device or other IDs
  (both optional, both for app functionality)"
- "Data is encrypted in transit"
- "You can request that data be deleted"

If the rendered summary surprises you, you got an answer wrong. Re-open
and reconcile against `push-subscription.mjs`.

---

## 9. Government apps

> Is your app developed by or on behalf of a government? → **No**

---

## 10. Financial features

> Does your app offer financial features (loans, money transfer,
> insurance, investments)? → **No**

---

## 11. Health

> Does your app provide health-related content? → **No** (Quranic
> reflection isn't health content under Google's definition; it's
> spiritual/lifestyle).

---

## 12. Permissions — declared in the manifest

The release APK declares:

| Permission | Reason |
| --- | --- |
| `android.permission.POST_NOTIFICATIONS` | Required to deliver opt-in prayer reminders. Asked at runtime, not at install. |
| `android.permission.ACCESS_FINE_LOCATION` | Added by the TWA location-delegation library so prayer-time/qibla features can ask for device location when the user chooses that flow. No background location. |
| `android.permission.ACCESS_COARSE_LOCATION` | Same as above; allows approximate location if the user grants it. No background location. |

If Play Console asks for "sensitive permission" justification it'll only
be for any of: SMS, Call Log, AccessibilityService, All files access,
Background location. **You declared none of these**, so this section
should not block you. If Play Console asks why location is used, answer:
prayer times and qibla direction, only while the user is using the app, no
background location, and GPS coordinates are not sent to the developer's
server.

---

## 13. App category and tags (already in listing-copy.md)

Repeated here for completeness: **Lifestyle**, tags pick from {Islamic,
Quran, Prayer, Dhikr, Reflection}.

---

## 14. Country/region availability

Recommended starting setting: **All countries**.

Caveats to know:
- Some regions (e.g., China) won't be served regardless because the Play
  Store doesn't operate there.
- If you anticipate any regulatory question (e.g., religion-related
  content in restrictive countries), you can exclude specific countries
  here later. Defaults to all is safe for an Islamic reflection app.

---

## 15. Pricing and distribution

- **Free**: Yes
- **Paid**: No
- **In-app products**: No
- **Subscriptions**: No
- **Distributed on Play Store**: Yes
- **Distributed via other channels**: Optional (you may also ship the
  signed APK to your own site for sideload — that's separate from this
  submission).
