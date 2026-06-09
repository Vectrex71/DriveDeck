import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';

// Lazy loading Stripe SDK
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY ist nicht in den Umgebungsvariablen konfiguriert.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request bodies
  app.use(express.json());

  // Stripe Checkout Endpoint
  app.post('/api/stripe/create-checkout-session', async (req: express.Request, res: express.Response) => {
    try {
      const { plan, email } = req.body;
      if (!plan || !['monthly', 'yearly', 'lifetime'].includes(plan)) {
        return res.status(400).json({ error: 'Ungültiger oder fehlender Plan-Typ.' });
      }

      // 1. Get Price ID from env
      let priceId = '';
      if (plan === 'monthly') priceId = process.env.STRIPE_PRICE_MONTHLY || '';
      else if (plan === 'yearly') priceId = process.env.STRIPE_PRICE_YEARLY || '';
      else if (plan === 'lifetime') priceId = process.env.STRIPE_PRICE_LIFETIME || '';

      if (!priceId) {
        return res.status(400).json({ 
          error: `Die Price-ID für den Plan '${plan}' (z. B. STRIPE_PRICE_${plan.toUpperCase()}) ist auf dem Server nicht konfiguriert.` 
        });
      }

      // 2. Initialize Stripe
      const stripe = getStripe();

      // 3. Create Session params
      const hostname = req.headers.referer || req.headers.origin || process.env.APP_URL || 'https://drivedeck.xyz';
      const cleanUrl = hostname.split('?')[0].replace(/\/$/, ''); // Remove trailing slashes and query parameters

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: plan === 'lifetime' ? 'payment' : 'subscription',
        success_url: `${cleanUrl}?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${cleanUrl}?stripe_cancel=true`,
        metadata: { plan },
      };

      if (email) {
        sessionParams.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('[Stripe Checkout Error]:', error);
      res.status(500).json({ error: error.message || 'Stripe Checkout fehlgeschlagen' });
    }
  });

  // Stripe Verify Session Endpoint
  app.get('/api/stripe/verify-session', async (req: express.Request, res: express.Response) => {
    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing session_id' });
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        res.json({ 
          success: true, 
          email: session.customer_details?.email, 
          plan: session.metadata?.plan || 'premium'
        });
      } else {
        res.json({ success: false, status: session.payment_status });
      }
    } catch (error: any) {
      console.error('[Stripe Verify Error]:', error);
      res.status(500).json({ error: error.message || 'Verifizierung fehlgeschlagen' });
    }
  });

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
