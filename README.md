# @steprotech/n8n-nodes-evolution

An n8n community node for the [Evolution API](https://github.com/EvolutionAPI/evolution-api) WhatsApp
gateway (v2). It covers 44 operations across 7 resources, and it ships a trigger node that will not
silently take over an instance that already posts its events somewhere else.

- Package: `@steprotech/n8n-nodes-evolution`
- Nodes: **StePro Evolution API** (`steProEvolution`), **StePro Evolution Trigger** (`steProEvolutionTrigger`)
- Credential: **StePro Evolution API** (`steProEvolutionApi`)
- License: MIT, unofficial community package, not affiliated with Evolution API

## Install

Self-hosted n8n, Community Nodes panel: Settings -> Community Nodes -> Install, then enter
`@steprotech/n8n-nodes-evolution`.

Or from the command line on the n8n host:

```bash
cd ~/.n8n/nodes
npm install @steprotech/n8n-nodes-evolution --ignore-scripts --no-audit --no-fund
```

`--ignore-scripts` matters on images that ship no compiler: n8n's own `isolated-vm` dependency
otherwise runs `node-gyp` and fails the whole install. Restart n8n afterwards. On n8n 3.x use the
Community Nodes panel, or n8n's own install endpoint, because the boot loader only registers
packages that n8n itself recorded.

n8n Cloud installs verified community nodes only, so this package currently reaches self-hosted
instances.

## Credential

| Field | Meaning |
| --- | --- |
| Server URL | Base URL of your Evolution API, for example `https://wa.example.com` |
| API Key | The instance's global API key, sent as the `apikey` header |
| Default Instance Name | Optional. Used by every node that leaves its instance field empty |

The credential test calls `GET /instance/fetchInstances`, so a wrong key or a wrong base URL is
reported when you save it instead of on the first execution.

## Operations

**Instance** (7): fetch all, connection state, create, connect with QR or pairing code, logout,
restart, delete.

**Message** (11): text, media, audio, video note (PTV), location, contact, poll, reaction, status,
interactive buttons, list. Every send accepts an optional delay, which shows the typing indicator
for that long before the message leaves.

**Chat** (7): send presence (typing, recording, paused, available, unavailable), mark read, mark
unread, fetch messages, fetch chats, archive chat, delete message for everyone.

**Group** (9): create, fetch all, find info, invite code, invite info, leave, add or update
participants, update subject, update description.

**Profile** (6): fetch profile, fetch business profile, update name, update status, update picture,
remove picture.

**Webhook** (3): find, set, unset.

**Diagnostics** (1): server health.

## Trigger

**StePro Evolution Trigger** starts a workflow when Evolution posts an event for an instance.

- Pick the events you want. `MESSAGES_UPSERT` is the one that carries inbound chat.
- Payload can be **normalized** (flat fields such as `remoteJid`, `text`, `messageType`, `pushName`,
  with the original envelope kept under `data`) or **raw** (exactly what Evolution posted).
- Filters for messages you sent yourself, groups, and newsletters, on by default.
- `byEvents` is forced off, so Evolution posts to a single stable URL. Event names are never
  appended to the path, which is the failure mode that makes a webhook answer 404 on every delivery.

Evolution stores one webhook object per instance, so activating a trigger **rewrites** it. This node
reads the current webhook first and refuses to replace a URL it did not create, unless you turn on
**Overwrite An Existing Webhook**. Deactivating a trigger only clears the webhook when the
configured URL belongs to that workflow, so a copied workflow cannot mute a live integration.

## Examples

Send a message with a typing indicator first:

1. **StePro Evolution API**, resource **Chat**, operation **Send Presence**: presence `composing`,
   delay `3000`.
2. **StePro Evolution API**, resource **Message**, operation **Send Text**: number
   `233xxxxxxxxx@s.whatsapp.net`, your text, delay `1000`.

Reply to whoever writes to you:

1. **StePro Evolution Trigger**: event `MESSAGES_UPSERT`, ignore fromMe and groups.
2. Your logic, using `{{ $json.text }}` and `{{ $json.remoteJid }}`.
3. **Send Text** to `{{ $json.remoteJid }}`. Both `@s.whatsapp.net` and `@lid` identifiers work.

## Notes

- Phone numbers can be given as a number with country code, or as a full chat id such as
  `1234567890@s.whatsapp.net`, `1234567890@g.us` or `123@lid`.
- Type names are prefixed `stePro` so this package can be installed alongside other Evolution
  packages without a credential name collision.
- Evolution's message store is often disabled or lagging. A successful send returns the provider's
  own status, usually `PENDING`, which means accepted and dispatched, not delivered.

## Development

```bash
npm install
npm run build
npm pack
```

`npm run build` compiles TypeScript into `dist/` and copies the icon beside the compiled nodes.
The package entry point is `index.js`, which re-exports the compiled node classes; keep it in the
published tarball (`files`), because npm resolves `main` when the package is required.

Source, issues and releases: https://github.com/stewardobeng/n8n-nodes-evolution

## License

MIT. WhatsApp and Evolution API marks belong to their respective owners.
