# Nexus Mothership Protocol | Access Registry

This file contains the mandatory invitation codes required to initialize the Nexus neural link.

## Invitation Codes (Authorized Tokens)

| Token Type | Code | Description |
| :--- | :--- | :--- |
| **Master Registry** | `NEXUS-0000` | Owner access: Can generate/revoke codes in Matrix settings. |
| **Tactical Link 01** | `NEXUS-0001` | Standard operator token. |
| **Tactical Link 02** | `NEXUS-0002` | Standard operator token. |
| **Tactical Link 03** | `NEXUS-0003` | Standard operator token. |
| **Range Tokens** | `NEXUS-0004` to `NEXUS-1000` | Dynamic range of valid authorization tokens. |

## Bug Registry & Patches
- **Auth Handshake**: Ensure all API keys are provided during the step-3 initialization or later in the Matrix (Settings) modal.
- **Persistence**: Database records are stored in the browser's local neural buffer (localStorage). Purging browser data will result in mission data loss.
- **Provider Keys**: Password masking is enabled on all sensitive gateway keys. Use the "Synchronize" button to commit changes to the buffer.
