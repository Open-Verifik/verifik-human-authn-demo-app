# HumanAuthn Mobile App (Expo)

This is the React Native / Expo implementation of the HumanAuthn application, demonstrating Verifik biometrics.

## Development & Troubleshooting

If you encounter "Cannot connect to Metro" or if port 8081 is in use:

1. **Avoid Root Shells**
   Do not run Expo or ADB commands inside a `sudo` shell (`bash-3.2#`). This locks up ports and leaves ghost processes. Use `exit` to return to your normal user.

2. **Clear the Port**
   If port 8081 is locked, forcefully kill Node processes to release the binding:
   ```bash
   killall node
   ```

3. **Start Cleanly**
   Start the Metro Bundler explicitly clearing the cache:
   ```bash
   pnpm start --android --clear
   ```

4. **Reload the JS Bundle**
   If the emulator UI shows a "zombie screen" (painted but unresponsive components) or "Cannot connect to Metro", click into the emulator window so it has focus and press the `R` key twice (`R` `R`). This forcefully pulls the latest JS bundle from Metro.
