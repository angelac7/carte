# Deploying the gap fixes

The application now requires three new Supabase migrations. Apply the database update **before
serving this version of the application**, including automatic deployments triggered by Git pushes.
The previous `20261002000000_photo_ownership_and_rate_limits.sql` migration must already be installed.

1. Open Supabase → SQL Editor → New query.
2. Copy the entire contents of [SUPABASE_UPDATE.sql](./SUPABASE_UPDATE.sql), paste, and run once.
   This is a transaction containing the three new migrations unchanged. If any statement fails,
   nothing from this batch is committed. If you use the Supabase CLI migration workflow, apply the
   three source migration files instead; do not run both methods.
3. Open [ADMIN_SETUP.sql](./ADMIN_SETUP.sql), replace its email placeholder with an existing trusted
   Carte login email, and run it. It fails explicitly if that account does not exist. Do not grant
   all restaurant owners administrator access. Provision a second reviewer if the administrator's
   own restaurant needs verification; self-approval is blocked.
4. Deploy the application. Log in as the reviewer and open `/admin/claims` (also linked from the
   dashboard). Restaurant owners submit evidence on their Map listing page. Independently verify
   ownership before approving; disputed transfers require the explicit transfer checkbox.

No new environment variables or third-party services are needed. No diner information is uploaded
for backup/restore: diners download and transfer their own backup files. Backups contain diary notes,
so they should keep their copies private.

## Database checks

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (table_name = 'menu_items' and column_name in ('revision', 'source_language')
       or table_name = 'restaurants' and column_name = 'revision');
select to_regclass('public.place_claims'), to_regclass('public.claim_events');
```

The first query should return three rows; the second should return both table names.

## Device/account checks before launch

Automated tests cover conflict protection, claim authorization/transfers, backup validation,
English translation, refreshed confirmed menus, voice cleanup, image conversion failures,
password recovery routing, and offline service-worker behavior. They cannot establish that an
actual email arrived or that a specific phone granted camera/microphone permissions.

- Two owner tabs: edit the same dish in both. The stale tab must report a conflict. Repeat for
  confirmation, photo replacement/removal, deletion, the whole-menu delete, and profile save.
- Import a Japanese or Spanish menu, review the detected language, confirm a dish, then open the
  English diner menu. Confirm translated kitchen notes and fixed allergen labels remain separate.
- Submit a claim as a normal owner; `/admin/claims` must be inaccessible. As a different approved
  reviewer, approve/reject and check the owner's notification. Test transfers only with test listings.
- In My Carte, download a backup; preview it on another device and test merge. Existing duplicate
  entries should win. Export before trying replacement, which intentionally replaces local data.
- Keep a diner menu open, then edit/unconfirm a dish as the owner. Within 30 seconds (or on focus),
  the diner must see the new menu, reset order/assistant results, and retained filters.
- On iOS Safari and Android Chrome: scan a camera photo; check JPEG/PNG/WebP supported by the
  browser. If a camera format cannot be decoded, export as JPEG/PNG. Voice permission denial
  must leave typed chat usable; closing chat must stop recognition.
- Request password reset using a test account; follow the real received email and verify expiry,
  redirects, and new-password login. This requires the correct Supabase redirect allowlist and
  deployed `NEXT_PUBLIC_SITE_URL`.
- In a production build, open a menu and My Carte, then disable networking and reopen both.
  The cached menu must show the stale-data notice. Reconnect and reload to obtain a fresh document.
- Print the restaurant QR page, scan its QR with another device, and test home-screen installation.

Human verification of ownership, real email delivery, physical camera/microphone permissions,
printing hardware, and mobile installation are operational checks; they cannot be replaced by
server/unit tests. These changes do not add checkout, reservations, staff roles, or automatic cloud sync.
