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
   `npm run dev`
