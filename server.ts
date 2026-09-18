import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request bodies
  app.use(express.json());

  // API Proxy Route for Google Tasks to bypass browser CORS restrictions
  app.all('/api/tasks/*', async (req: express.Request, res: express.Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }

      // Extract the target sub-resource path from /api/tasks/*
      // e.g., /api/tasks/users/@me/lists -> users/@me/lists
      const subPath = req.path.replace(/^\/api\/tasks\//, '');
      const queryString = new URLSearchParams(req.query as any).toString();
      const targetUrl = `https://tasks.googleapis.com/v1/${subPath}${queryString ? '?' + queryString : ''}`;

      const headers: Record<string, string> = {
        'Authorization': authHeader,
      };

      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'] as string;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      // Direct body copy for non-GET requests
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const googleResponse = await fetch(targetUrl, fetchOptions);
      res.status(googleResponse.status);

      const contentType = googleResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await googleResponse.json();
        res.json(data);
      } else {
        const text = await googleResponse.text();
        res.send(text);
      }
    } catch (error: any) {
      console.error('[Google Tasks API Proxy Error]:', error);
      res.status(500).json({ error: 'Proxy-Anfrage fehlgeschlagen', details: error?.message });
    }
  });

  // Serve static UI assets or start Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DriveDeck Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
