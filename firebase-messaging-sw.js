importScripts(
  'https://www.gstatic.com/firebasejs/9.0.1/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/9.0.1/firebase-messaging-compat.js'
);

const firebaseApp = firebase.initializeApp({
  apiKey: 'api-key',
  authDomain: 'project-id.firebaseapp.com',
  databaseURL: 'https://project-id.firebaseio.com',
  projectId: 'project-id',
  storageBucket: 'project-id.appspot.com',
  messagingSenderId: 'sender-id',
  appId: 'app-id',
  measurementId: 'G-measurement-id',
});

const messaging = firebase.messaging();

const _messages = {};

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;

  if (data.type === 'message') {
    _messages[data.senderId] = [];
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        console.log(clients);

        const client = clients[0];

        if (client) {
          client.focus();
          client.postMessage({
            type: 'focus-chat',
            senderId: data.senderId,
          });
        }
      })
  );
});

messaging.onBackgroundMessage((payload) => {
  const { data } = payload;

  if (data.type === 'message') {
    const ref = (_messages[data.senderId] = _messages[data.senderId] || []);

    ref.push(data.text);

    let body = ref
      .slice(0, 5)
      .map((m) => `=> ${m}\n`)
      .join('');

    if (ref.length > 5) {
      body += 'More...';
    }

    const notificationTitle = 'New Message';
    const notificationOptions = {
      body: body,
      tag: data.senderId,
      data: {
        type: data.type,
        senderId: data.senderId,
      },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
