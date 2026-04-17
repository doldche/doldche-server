const admin = require('firebase-admin');
const http = require('http');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const messaging = admin.messaging();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200);
    res.end('DOLDCHE server online');
    return;
  }

  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { token, title, body: msgBody, url } = JSON.parse(body);
        await messaging.send({
          token,
          notification: { title, body: msgBody },
          webpush: {
            notification: {
              icon: 'https://doldche.netlify.app/icon-192.png',
              badge: 'https://doldche.netlify.app/badge-96.png',
              vibrate: [200, 100, 200],
              requireInteraction: true
            },
            fcm_options: { link: url || 'https://doldche.netlify.app/' }
          }
        });
        console.log('Notificación enviada:', title);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.log('Error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Servidor DOLDCHE corriendo en puerto', PORT);
});
