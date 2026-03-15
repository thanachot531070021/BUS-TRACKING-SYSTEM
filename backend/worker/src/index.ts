export interface Env {
  APP_NAME: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return json({
        app: env.APP_NAME,
        status: 'ok',
        endpoints: [
          '/health',
          '/routes',
          '/buses/live',
          '/waiting'
        ]
      });
    }

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'worker' });
    }

    if (url.pathname === '/routes') {
      return json({ message: 'TODO: fetch routes from Supabase' });
    }

    if (url.pathname === '/buses/live') {
      return json({ message: 'TODO: fetch active buses and live locations' });
    }

    if (url.pathname === '/waiting') {
      return json({ message: 'TODO: fetch or update passenger waiting points' });
    }

    return json({ error: 'Not Found' }, 404);
  },
};
