import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { pathToFileURL } from 'url';

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react(), tailwindcss()];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  const createApiMiddleware = () => {
    return async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/api/')) return next();
      const parsed = new URL(req.url, 'http://localhost');
      const endpoint = parsed.pathname.replace(/^\/api\//, '').replace(/\.js$/, '').split('?')[0];

      try {
        const modPath = path.resolve(process.cwd(), `api/${endpoint}.js`);
        const modUrl = pathToFileURL(modPath).href;
        const mod = await import(/* @vite-ignore */ `${modUrl}?t=${Date.now()}`);
        if (mod && mod.default) {
          let body: any = {};
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
            const chunks: any[] = [];
            for await (const chunk of req) chunks.push(chunk);
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw) {
              try {
                body = JSON.parse(raw);
              } catch {
                body = {};
              }
            }
          }

          const query = Object.fromEntries(parsed.searchParams.entries());
          const mockedReq = Object.assign(req, { query, body });
          const mockedRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return this;
            },
            json(data: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return this;
            },
          });

          return await mod.default(mockedReq, mockedRes);
        }
      } catch (err: any) {
        console.error(`[API DEV SERVER ERROR ${endpoint}]:`, err?.message);
      }
      next();
    };
  };

  // Local development & preview API router plugin
  const apiPlugin = {
    name: 'api-server-middleware',
    configureServer(server: any) {
      server.middlewares.use(createApiMiddleware());
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(createApiMiddleware());
    },
  };

  plugins.push(apiPlugin);

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
});
