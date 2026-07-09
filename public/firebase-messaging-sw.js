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
  const data = payload.data || {};
  const title = data.title || "Blaulicht Report COC";
  const options = {
    body: data.body || "Neue Meldung in der App",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || (data.reportId ? `/report/${data.reportId}` : "/"), ...data },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      if ("focus" in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    return clients.openWindow(url);
  })());
});
