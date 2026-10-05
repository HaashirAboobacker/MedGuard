# Testing & Evaluation

All testing was performed locally on synthetic data. No real systems were scanned or contacted.

## Automated tests
```bash
node tests/run-tests.js      # Node >= 18, no dependencies
```
Latest output: [test-results.txt](test-results.txt) — **19 passed, 0 failed**.

## Manual test cases
| ID | Steps | Expected | Result |
|---|---|---|---|
| M-01 | Sign in as admin, patch a nurse-station PC | Status → Up-to-date, audit entry created | `[PASS/FAIL]` |
| M-02 | As admin, patch an Infusion Pump | Blocked with "require clinical approval" toast | `[PASS/FAIL]` |
| M-03 | As admin, request approval for a critical device | Appears in queue; status PENDING | `[PASS/FAIL]` |
| M-04 | Sign in as clinician, approve a queued item | Device patched, `approvedBy` recorded | `[PASS/FAIL]` |
| M-05 | Sign in as clinician, reject a queued item | Removed from queue, "reject" logged | `[PASS/FAIL]` |
| M-06 | Admin adds a device with a duplicate ID | Error shown, not added | `[PASS/FAIL]` |
| M-07 | Add device with IP `999` | Format error shown | `[PASS/FAIL]` |
| M-08 | Wrong password | Login error shown | `[PASS/FAIL]` |
| M-09 | Switch branch | Different asset set loads | `[PASS/FAIL]` |

> Fill the Result column after you run the demo, and add screenshots to `public/screenshots/`.
