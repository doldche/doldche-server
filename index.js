const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const messaging = admin.messaging();

async function sendPendingNotifications() {
  try {
    const snap = await db.collection('notifications')
      .where('sent', '==', false)
      .limit(20)
      .get();

    if (snap.empty) return;

    const promises = snap.docs.map(async d => {
      const { to, title, body, url } = d.data();
      try {
        await messaging.send({
          token: to,
          notification: { title, body },
          webpush: {
            notification: {
              icon: 'https://doldche.netlify.app/icon-192.png',
              badge: 'https://doldche.netlify.app/badge-96.png',
              vibrate: [200, 100, 200]
            },
            fcm_options: { link: url || 'https://doldche.netlify.app/' }
          }
        });
        await d.ref.update({ sent: true });
        console.log('Notificación enviada:', title);
      } catch (e) {
        await d.ref.update({ sent: true, error: e.message });
        console.log('Error enviando notificación:', e.message);
      }
    });

    await Promise.all(promises);
  } catch (e) {
    console.log('Error general:', e.message);
  }
}

// Revisar notificaciones pendientes cada 5 segundos
setInterval(sendPendingNotifications, 5000);
sendPendingNotifications();

console.log('Servidor de notificaciones DOLDCHE iniciado');

// Mantener el proceso vivo
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('DOLDCHE notifications server running');
}).listen(process.env.PORT || 3000);
