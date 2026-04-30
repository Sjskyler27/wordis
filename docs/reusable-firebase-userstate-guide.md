# Reusable Firebase User State Guide

This guide describes a small client-side user-state sync pattern for games using Firebase Auth and Realtime Database.

## Database Layout

Use one root user node per auth user:

```json
{
  "users": {
    "$uid": {
      "gameData": {
        "completedGames": {},
        "progression": {}
      },
      "saves": {}
    }
  }
}
```

Create only the durable shell on first login. Let feature-specific children appear when the player actually earns progress or creates a save.

## Initialization

After sign-up or first auth detection:

1. Read `users/${uid}`.
2. If missing, write the blank user shell.
3. If present, patch in any required missing top-level containers.
4. Run user-state sync.

Cloud Functions can do this with an auth trigger, but a client-only game can safely do it after authentication when database rules allow the signed-in user to write their own node.

## Sync Records

Every syncable record should include:

- `v`: schema version.
- `m` or `type`: record type.
- `ts`: last updated timestamp.

Use the timestamp to decide direction:

- Local newer uploads.
- Remote newer downloads.
- Invalid schema is ignored.

For progression where values only increase, use a rank or score comparison instead of timestamps. Examples include highest unlocked difficulty, best level reached, or completed tutorial flags.

## Rate Limit

Store a local `lastSyncedAt` timestamp and skip automatic sync until the interval has elapsed. Ten minutes is a reasonable first interval for lightweight game state.

Allow forced sync for:

- New account creation.
- Manual sync button.
- Logout cleanup.
- Important checkpoint saves.

## Large Saves

Add a per-device toggle for large save payloads. Keep small progression sync enabled even when saved-game sync is disabled.

Good toggle behavior:

- Default enabled.
- Stored locally.
- Does not delete remote saves.
- Stops upload and download of large save payloads.

## Logout

Before sign-out:

1. Force a final sync.
2. Preserve anonymous device identifiers that should survive logout.
3. Clear local user-specific progress.
4. Sign out through Firebase Auth.

Avoid clearing global install settings unless those settings truly belong to the signed-out user.
