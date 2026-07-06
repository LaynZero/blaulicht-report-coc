importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAw1f-pELAWnc4vchpdhh-zLJXtWTNBb7o",
  authDomain: "blaulicht-report-coc.firebaseapp.com",
  projectId: "blaulicht-report-coc",
  storageBucket: "blaulicht-report-coc.firebasestorage.app",
  messagingSenderId: "498650411681",
  appId: "1:498650411681:web:16a813f91a5defdb8d76e0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Blaulicht Report COC";
  const options = {
    body: payload.notification?.body || "Neue Meldung in der App",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
