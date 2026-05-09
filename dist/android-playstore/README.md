# Ruh Android / Google Play Package

This folder collects the Android submission assets for Ruh version 2.

> Important package-name note: the app package was changed to
> `com.alruh.app` after Play Console reported `com.ruh.app` was already in
> use. Any AAB/APK built before that change must not be uploaded. Rebuild the
> release bundle first, then replace `ruh-v2-playstore.aab` and
> `ruh-v2-signed-test.apk` with the new artifacts.

## Upload to Play Console

- `ruh-v2-playstore-com-alruh.aab` - signed Android App Bundle for Google
  Play upload after rebuilding with package name `com.alruh.app`.
- `ruh-v2-playstore-old-com-ruh-do-not-upload.aab` - old signed bundle kept
  only for reference. Do not upload it.
- `store-icon-512.png` - 512 x 512 Play Store icon.
- `privacy-policy.html` - privacy policy content to deploy and use as the Play Console privacy policy URL.
- `assetlinks.json` - Digital Asset Links file that must be deployed to `https://ruh-app.netlify.app/.well-known/assetlinks.json`.

## Test Install

- `ruh-v2-signed-test-old-com-ruh-do-not-install.apk` - old signed APK kept
  only for reference. Do not install it for current testing.

## Target Package Details

- Package name: `com.alruh.app`
- Version code: `2`
- Version name: `2`
- Min SDK: `21`
- Target SDK: `35`
- Upload certificate SHA-256: `3A:DD:55:54:14:83:64:81:EE:08:68:E7:90:72:A8:D6:4B:2B:9E:54:64:E7:71:92:11:D4:BD:BD:B6:E5:63:47`

Before submitting, deploy the current web repo so the following URLs return 200:

- `https://ruh-app.netlify.app/.well-known/assetlinks.json`
- `https://ruh-app.netlify.app/privacy-policy`
