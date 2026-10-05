# Security, Privacy & Safety Approach

## Threat / risk addressed
Unpatched hospital IT and medical devices are a major entry point for attackers, but unsafe or uncoordinated patching can harm patients. MedGuard demonstrates a workflow that reduces cyber risk **while keeping a clinician in control of consequential actions**.

## Controls implemented
| Control | Where |
|---|---|
| Role-based authorization (admin vs clinical) | `patchAsset`, `approve*`, `reject*`, add-device guard |
| Mandatory human approval for critical devices | `needsApproval` + `patchAsset` gate |
| Audit trail with actor, role, timestamp, versions, approver | `logPatch`, `logEvent` |
| Output encoding against XSS | `escapeHTML` on rendered user input |
| Input validation | required fields, duplicate IDs, IPv4 format |
| No outbound data flow | no `fetch`/XHR/WebSocket (verified by test SEC-01) |

## Safety & privacy rules followed (ASTRA guidelines)
- Synthetic data only; private `10.x.x.x` addresses; no patient/PII fields.
- No attack, scanning, exploitation or contact with any real hospital system or device.
- No secrets in the repository; `.env.example` has placeholders only.
- Human oversight for consequential actions.

## Known weaknesses (documented honestly)
- Demo credentials are in client-side code (intentional for the demo; **never** a production pattern).
- Audit log lives in `localStorage` and can be modified by the browser user.
- Newly added assets let the admin choose the risk level.
- No CVE feed, no real patch orchestration.
