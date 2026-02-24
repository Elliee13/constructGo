# Android APK Build and Crash Troubleshooting

This project uses Expo + EAS Build and package id `com.demo.constructgo`.

## Why Hermes can fail to load

`Unable to load Hermes` usually means the APK and native runtime were built with mismatched settings, or stale native artifacts were reused after changing JS engine/architecture flags.

This patch locks build settings to reduce that risk:

- `expo.jsEngine = "hermes"`
- `expo.newArchEnabled = false` (temporary compatibility mode)
- clean EAS cloud rebuild with cache cleared

## Build commands (clean demo APK)

```bash
npm i -g eas-cli
eas login
eas build:configure
```

Then run:

```bash
eas build -p android --profile demo --clear-cache
```

Or via npm script:

```bash
npm run build:android:demo
```

## Native project freshness

This repo currently does not include an `android/` folder.

If you generate native folders later and suspect stale native artifacts, run:

```bash
npm run prebuild:clean
```

Equivalent command:

```bash
npx expo prebuild --clean
```

## Capture the correct crash logs (ADB, not in-app log viewers)

Use `adb logcat` from your computer while launching the app on device.

1) Clear logs:

```bash
adb logcat -c
```

2) Start log capture:

```bash
adb logcat -v time
```

3) Launch `ConstructGo` on device and reproduce the crash.

4) Look for these markers:

- `AndroidRuntime`
- `FATAL EXCEPTION`
- `SoLoader`
- `UnsatisfiedLinkError`
- `com.demo.constructgo`

Optional Windows filter:

```powershell
adb logcat -v time | findstr /i "AndroidRuntime FATAL EXCEPTION SoLoader UnsatisfiedLinkError com.demo.constructgo"
```

## If crash persists on arm64 devices

Rebuild once more with cache clear:

```bash
eas build -p android --profile demo --clear-cache
```

Then reinstall the new APK (remove old app first if needed).
