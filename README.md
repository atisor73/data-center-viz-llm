Data Interaction Project to test the efficacy of chatbot integration on user experience within environmental justice mapping tools.

## Setup

Install the Node dependencies:

```bash
npm install
```

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then create a local `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

Run the backend and frontend in two terminals:

```bash
npm run server
```

```bash
npm run dev
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
