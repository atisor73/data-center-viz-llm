Data Interaction Project to test the efficacy of chatbot integration on user experience within environmental justice mapping tools.

## Setup

Install the Node dependencies:

```bash
npm install
```

Use Node 24 or newer. The backend uses Node's built-in SQLite support for the data chat feature.

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then create a local `.env` file in the project root:

```env
GOOGLE_API_KEY=your_api_key_here
```

Run the backend and frontend in two terminals:

```bash
npm run server
```

```bash
npm run dev
```

## GitHub Pages

This repo is set up to deploy the static frontend to GitHub Pages with GitHub Actions.

- The workflow publishes the built `dist/` output whenever you push to `main`.
- Frontend asset and dataset URLs are base-path aware, so they work under `/data-center-viz-llm/`.
- The Node chat backend in `backend/` does not run on GitHub Pages. In the default Pages deploy, chat is shown as unavailable instead of failing.
- If you later host the backend elsewhere, set `VITE_CHAT_API_URL` in the GitHub repository's Actions variables/secrets so the deployed frontend can call it.

To enable Pages in GitHub:

1. Push this repo to GitHub.
2. In GitHub, open `Settings` -> `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` to trigger the deploy workflow.

## Chatbot Test

The live chatbot test calls Gemini and uses your API quota. Run it in a separate terminal.

```bash
npm run test:chatbot
```

## Secret Scanning

This project uses `pre-commit` with Gitleaks to help prevent API keys and other secrets from being committed.

Install pre-commit:

```bash
pip install pre-commit
```

Enable the hooks for this repo:

```bash
pre-commit install
```

Optional manual scan:

```bash
pre-commit run --all-files
```
