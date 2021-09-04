import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAFAc5Ebqv3qpVAs3Z7YfC6cv8f85mxnOk',
  authDomain: 'you-i-chat-7fdd7.firebaseapp.com',
  projectId: 'you-i-chat-7fdd7',
  storageBucket: 'you-i-chat-7fdd7.appspot.com',
  messagingSenderId: '872435832659',
  appId: '1:872435832659:web:aa6a421464012b0195b3a6',
  measurementId: 'G-90NE3SVKJ8',
};

const app = initializeApp(firebaseConfig);

const _messaging = getMessaging(app);

export const messaging = {
  async getToken() {
    return getToken(_messaging, {
      vapidKey: import.meta.env.VITE_APP_VAPID_KEY as string,
    });
  },
};

onMessage(_messaging, (payload) => {
  console.log(payload);
});
