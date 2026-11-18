<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# MindCare

MindCare has a Vite/React frontend and an Express API server. They can be run and deployed independently.

## Run locally

Install frontend dependencies from the repository root and backend dependencies from its own folder:

```sh
npm install
cd backend
npm install
```

Keep the frontend and backend settings separate. The root `.env` should contain only `VITE_API_URL=http://localhost:3000`. Copy `backend/.env.example` to `backend/.env` and set the backend's environment values. In particular, the About, crisis helpline, and soundscape APIs require a reachable `MONGODB_URI`; image, CV, and audio uploads also require a server-side `CLOUDINARY_URL`. Never put Cloudinary credentials in a frontend environment variable.

Run the API server in one terminal (from the repository root):

```sh
npm run dev:server
```

From the repository root in another terminal, run the frontend:

```sh
npm run dev
```

Vite serves the frontend on port 5173. The browser calls the backend directly using `VITE_API_URL`; no Vite API proxy is used. Set `CORS_ORIGINS` in `backend/.env` to the exact frontend origin(s).

## Deploy separately

### API server

Deploy the `backend/` folder as a standalone Node.js service. Use `npm install` as the install command and `npm start` as the start command. The backend has its own dependencies, lockfile, TypeScript config, and environment example. The service listens on the host-provided `PORT` (or 3000 locally).

Configure these environment variables on the API service:

- `MONGODB_URI`
- `CLOUDINARY_URL` in the form `cloudinary://<api_key>:<api_secret>@<cloud_name>` for admin-managed soundscape audio and About card images/CVs
- `GEMINI_API_KEY` and/or any AI provider keys used by the server
- `AI_KEYS_ENCRYPTION_SECRET`: a private random secret of at least 32 characters used to encrypt API keys managed in the Admin Panel
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`
- `CORS_ORIGINS`: comma-separated, exact frontend origins, for example `https://mindcare.example.com`

The About, crisis helpline, soundscape, and Admin Panel AI key management APIs require MongoDB to be configured and reachable. Cloudinary uploads are performed only by the backend; replacing a file removes its previous Cloudinary asset, and deleting a soundscape or About card removes its associated assets. Gemini/OpenAI keys added in the Admin Panel are stored encrypted in MongoDB; the encryption secret must remain stable across deployments or those saved keys cannot be decrypted. Admins can choose a preferred key; quota/rate-limit failures cool down that key and automatically fall through to other configured keys/providers. After a successful response, that key becomes the first key tried on subsequent requests; a manually chosen preferred key takes priority until a request succeeds.

On Cloudinary Free plans, PDF delivery is blocked by default. If CV downloads are still denied, enable **Allow delivery of PDF and ZIP files** in the Cloudinary Product environment's **Security** settings.

Custom providers can be added, renamed, and have keys added, replaced, or removed in the Admin Panel. To use one in the chatbot, enable “Use with chatbot through OpenRouter,” enter an OpenRouter API key, and provide the model ID exactly as listed in the [OpenRouter Models catalog](https://openrouter.ai/models) (for example, `provider/model-name:free` when that exact free variant is available). The backend sends OpenAI-compatible Chat Completions requests to the fixed endpoint `https://openrouter.ai/api/v1/chat/completions`; no custom endpoint URL is accepted. If OpenRouter returns an error, the key is temporarily cooled down and the next configured key/provider is attempted. Providers left disabled remain key storage only. These settings require MongoDB and a stable `AI_KEYS_ENCRYPTION_SECRET`.

If the backend logs `querySrv ECONNREFUSED` for `_mongodb._tcp`, Node.js cannot resolve the MongoDB Atlas SRV record. Check the machine's DNS/VPN/firewall settings and Atlas network access; this is separate from frontend API URL or CORS configuration.

### Frontend

The root folder is the frontend project. Deploy it separately (for example, as a Vercel static site) using `npm run build` and `dist` as the output directory. Set `VITE_API_URL` to the API service's origin only, without an `/api` suffix, for example `https://mindcare-api.example.com`. The frontend sends its existing `/api/...` requests to that server.

The Express API and its dependencies are isolated in `backend/`. Its source is organized by responsibility:

```text
backend/src/
  app.ts                 Express middleware and API mounting
  server.ts              Standalone server entry point
  config.ts              Environment-based configuration
  middleware/            Admin-token authorization
  models/                MongoDB models, connection, and seed data
  routes/                Public, auth, admin, and AI route groups
  controllers/            Request/response handling by route group
  services/               Shared response presenters
  ai/                     AI providers, safety checks, prompts, and fallback
```

Admin routes use the existing admin-token authorization. There is no general logged-in-user middleware yet, and wellness/AI endpoints retain their existing unauthenticated behavior.

The standalone Express service in `backend/` is the project's API implementation. The old root-level Vercel function handlers have been removed; configure the frontend's `VITE_API_URL` to point to the separately deployed Express service.
