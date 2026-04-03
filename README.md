<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a1291618-522f-4700-823f-e8de53f5060d

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create a `credentials.json` file in the project root using your Google Service Account JSON.
3. Share your target Google Sheet with the `client_email` from `credentials.json` and give it **Editor** access.
4. Create/update `.env` with:
   - `GOOGLE_SHEET_ID=...`
   - `TELEGRAM_BOT_TOKEN=...`
   - `APP_URL=http://localhost:3030`
   - `PORT=3030`
   - `GEMINI_API_KEY=...` (only if Gemini features are used)
5. Run the app:
   `npm run dev` (runs the **backend** workspace: [`backend/src/index.ts`](backend/src/index.ts) → [`backend/src/server.ts`](backend/src/server.ts). The UI lives under [`frontend/`](frontend/).)

## Telegram bot (single poller)

Telegram allows **only one** active `getUpdates` long-polling connection per bot token. If two or more processes use the same `TELEGRAM_BOT_TOKEN` (for example: two terminals running `npm run dev`, a VPS plus your laptop, or PM2 with overlapping workers), you will see **`409 Conflict: terminated by other getUpdates request`**, duplicate replies, or commands handled by stale code.

**Fix:** Stop every extra Node/server that uses this token until only one remains. On Windows you can list Node processes with `Get-Process -Name node` in PowerShell and end duplicates in Task Manager. Server logs include **`pid=...`** when the bot starts so you can tell which process owns polling.

**Verify after cleanup:** Send `/link` once—you should get **one** verification message. Send `/verify` with that code—**one** success reply. Send `/in` when linked—**one** attendance response. If 409 errors disappear from the console, only one poller is active.

**Production (optional):** Switching from polling to a **webhook** (single HTTPS URL registered with Telegram) avoids accidental second pollers; that requires a public URL and `setWebhook`—not configured in this repo by default.

**If “nothing happens” in Telegram:** Check the server console. Repeating **`409 Conflict`** means another machine/process still has your token—stop it. You should see **`[telegram] connected as @YourBot`** once; if 409 spam continues, polling is still contested. **`Quota exceeded`** / **429** from Google Sheets means read/write limits were hit—wait a few minutes or reduce API usage; attendance and sheets may fail until quota recovers.

### Built-in commands vs BotCommands sheet

There are two ways replies are chosen for slash commands:

1. **Built-in (hardcoded in `backend/src/server.ts`)** — `/start`, `/link`, `/verify`, `/unlink`, `/in`, `/today` (`/in` and `/today` both mark attendance). These run first and send fixed or computed messages (welcome text, OTP, attendance, etc.).
2. **BotCommands sheet** — Any other command (e.g. `/chest`, `/shoulder`) is looked up in the `BotCommands` tab; the **response** column text is sent to the user. Rows that duplicate a built-in command name are ignored so the sheet never overrides linking or attendance commands.

If replies look wrong or outdated (e.g. “Unknown command” listing only `/link`…`/start` and no `/in` or `/today`), another server instance is probably still using the same bot token or old code—fix the **single poller** issue above and redeploy.