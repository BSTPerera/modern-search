# Modern Search

A deliberately minimal Node.js/Express search application built as a **controlled test target** for security research tools.

## Branches

| Branch | State | Description |
|---|---|---|
| `vulnerable` | ❌ Unsafe | Renders user input unescaped — XSS payloads execute |
| `fixed` | ✅ Safe | Output-encoded + CSP header — all payloads blocked |

## Quick Start

```bash
# Run the vulnerable version
git checkout vulnerable
npm install && npm start

# Run the fixed version
git checkout fixed
npm install && npm start
```

App runs on: http://localhost:3000

## Test Payloads (Reflected XSS)

```
http://localhost:3000/search?q=<script>alert(1)</script>
http://localhost:3000/search?q="><img src=x onerror=alert(1)>
http://localhost:3000/search?q=<svg onload=alert(1)>
```

Expected on `vulnerable`: alert dialog fires.  
Expected on `fixed`: plain text rendered, no alert.
