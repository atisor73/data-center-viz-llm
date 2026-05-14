# Data Centers + Water Stress + LLM

This project was carried out by Trung Nguyen, Alyssa Nguyen, Alena Zeng, and Rosita Fu. 

Attributions:
- Trung Nguyen: Backend LLM Integration
- Alyssa Nguyen: Re-design FracTracking Map
- Alena Zeng: Adding Water Stress Map
- Rosita Fu: Summary Analysis & Deployment

## Render backend

The chat backend can be deployed to Render as a Web Service using [render.yaml](/Users/rf50/uchicago/2026_spring/interaction/final/data-center-viz-llm/render.yaml).

Important details:

- This backend uses `node:sqlite`, which was added in Node `v22.5.0` and no longer requires the experimental flag starting in Node `v22.13.0`, so the repo pins Node `22.13.0`.
- Add `GOOGLE_API_KEY` in the Render dashboard before testing chat.
- The frontend should call the deployed backend at `https://<your-service>.onrender.com/api/chat`.

Render setup:

1. Push the repo to GitHub.
2. In Render, click `New` -> `Blueprint` or `New` -> `Web Service`.
3. Connect the repo.
4. If using the Blueprint flow, Render will read `render.yaml` automatically.
5. Add the `GOOGLE_API_KEY` environment variable.
6. Deploy the service.

After deploy, Render assigns the service a public `onrender.com` URL. In the Render dashboard, open the web service and look on the service overview/settings pages for the generated service URL.
