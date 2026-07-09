# Blaulicht Report COC

Next.js-App für lokale Blaulicht-/Verkehrsmeldungen im Kreis Cochem-Zell.

## Enthalten

- Firebase Login & Registrierung
- eindeutige Benutzernamen
- Rollen: User, Admin, Entwickler
- Rollen-Badges im Feed und Profil
- geschützte Seiten
- Live-Feed aus Firestore
- Meldung erstellen
- Meldungen bestätigen / melden / löschen
- Admin-Dashboard mit Nutzerverwaltung
- Profilseite mit Bio, Ort und Statistiken
- echte OpenStreetMap-Karte mit Markern und Google-Maps-Routenlink
- Bottom Navigation

## Start

```bash
npm install
npm run dev
```

Dann öffnen:

```txt
http://localhost:3000
```

## Firebase

In Firebase aktivieren:

1. Authentication → Email/Password aktivieren
2. Firestore Database erstellen
3. Firestore-Regeln aus `firestore.rules` übernehmen
4. Storage aktivieren (Standard-Bucket) und Regeln aus `storage.rules` übernehmen
   – Fotos, Sprachnachrichten und Profilbilder werden dort gespeichert, nicht mehr als Base64 in Firestore.
   – Mit Firebase CLI geht das auch automatisiert: `firebase deploy --only firestore:rules,storage`

## Entwicklerrolle setzen

Nach der Registrierung in Firestore unter `users/{deineUid}` das Feld setzen:

```txt
role = "developer"
```

Danach kannst du im Adminbereich andere Nutzer verwalten und Rollen ändern.

## Push-Benachrichtigungen

Für Push brauchst du zwei Dinge:

1. **Web Push VAPID Key**

Firebase → Project settings → Cloud Messaging → Web Push certificates → Key Pair erzeugen.

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY=DEIN_WEB_PUSH_VAPID_KEY
```

2. **Firebase Admin Service Account für den Versand**

Firebase → Project settings → Service accounts → Generate new private key.

Den kompletten JSON-Key in Vercel als Environment Variable eintragen:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY={...kompletter service account json...}
```

Danach in Vercel neu deployen. Nutzer können Push im Profil aktivieren. Wenn ein neuer Beitrag erstellt wird, sendet `/api/push/report-created` die Benachrichtigung an gespeicherte Tokens.
