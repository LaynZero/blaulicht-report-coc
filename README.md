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

## Automatisches Löschen alter Meldungen (Firestore TTL)

Jede Meldung bekommt beim Erstellen ein `expiresAt`-Feld (createdAt + 24h). Damit Firestore diese Dokumente automatisch löscht, muss einmalig eine TTL-Policy eingerichtet werden:

1. Firebase Console → Firestore Database → Reiter „TTL-Richtlinien" (oder via `gcloud firestore fields ttls update expiresAt --collection-group=reports --enable-ttl`)
2. Feld: `expiresAt`, Collection Group: `reports`
3. Fertig – Firestore löscht abgelaufene Dokumente automatisch (laut Google-SLA meist innerhalb weniger Stunden, spätestens nach 24h nach Ablauf)

Wichtig: Die App blendet abgelaufene Meldungen im Feed und auf der Karte **sofort** nach 24h aus (clientseitig geprüft, unabhängig von der TTL-Policy) – die TTL-Policy sorgt nur dafür, dass die Dokumente auch wirklich aus der Datenbank verschwinden und nicht nur unsichtbar im Hintergrund bleiben.

**Bekannte Einschränkung:** Bild-/Audio-Dateien in Firebase Storage werden durch die TTL-Policy *nicht* automatisch mitgelöscht, nur das Firestore-Dokument. Für ein späteres Aufräumen der zugehörigen Storage-Dateien bräuchte es zusätzlich eine Firebase Cloud Function (`onDocumentDeleted`-Trigger), die auf dem Blaze-Tarif läuft – sag Bescheid, falls du das aufgesetzt haben willst.

## Spam-Schutz beim Erstellen von Meldungen

Meldungen werden nicht mehr direkt vom Client in Firestore geschrieben, sondern über `/api/reports/create` (Firebase Admin SDK). Das erzwingt serverseitig:

- Ein Rate-Limit von 30 Sekunden zwischen zwei Meldungen pro Nutzer (Admins/Entwickler sind ausgenommen)
- Dass `official`/`emergency` nur wirklich von Admins/Entwicklern gesetzt werden kann, unabhängig davon, was der Client sendet

Das Rate-Limit lässt sich in `app/api/reports/create/route.ts` über die Konstante `RATE_LIMIT_MS` anpassen.

## Geräte-Sperre (gegen Ban-Umgehung)

Admins können im Admin-Bereich neben "Nutzer sperren" auch "Gerät sperren" wählen. Das sperrt die bekannten Geräte-IDs des Nutzers (in `bannedDevices` in Firestore, nur per Admin SDK lesbar/schreibbar). Auf einem gesperrten Gerät können danach **keine neuen Accounts erstellt und keine bestehenden Accounts mehr benutzt werden** — auch eine laufende Session wird sofort beendet.

**Wichtige Einschränkung:** Die Geräte-ID ist im Web keine echte Hardware-ID (die geben Browser aus Datenschutzgründen nicht raus), sondern eine selbst generierte ID in LocalStorage + Cookie gespiegelt. Ein technisch versierter Nutzer kann das durch "Website-Daten löschen" oder einen anderen Browser umgehen. Das Feature hebt die Hürde für die meisten Fälle von Ban-Umgehung deutlich, ist aber kein hundertprozentiger Schutz.

Geräte werden erst ab dem ersten Login/Registrierung *nach* Einführung dieses Features erfasst — für ältere Accounts ohne bekannte Geräte-ID zeigt der Button entsprechend eine Meldung.

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
