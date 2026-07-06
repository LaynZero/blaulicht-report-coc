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
- Karten-Übersicht mit Google-Maps-Routenlink
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
3. Optional: Regeln aus `firestore.rules` übernehmen

## Entwicklerrolle setzen

Nach der Registrierung in Firestore unter `users/{deineUid}` das Feld setzen:

```txt
role = "developer"
```

Danach kannst du im Adminbereich andere Nutzer verwalten und Rollen ändern.

## Push-Benachrichtigungen

Für Push muss in Firebase unter **Project settings → Cloud Messaging → Web Push certificates** ein Key Pair erzeugt werden. Den öffentlichen VAPID-Key in `.env.local` eintragen:

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY=DEIN_WEB_PUSH_VAPID_KEY
```

Danach App neu starten. Nutzer können Push im Profil aktivieren. Die Tokens werden in Firestore unter `pushTokens` gespeichert.
