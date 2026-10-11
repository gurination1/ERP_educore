---
title: "Dynamic Payment Gateways (Live vs Test Mode)"
category: "Finance"
tags: ["#finance", "#payment", "#gateway", "#sandbox"]
summary: "Multi-current account routing (Pharmacy vs Law), Live/Test modes, and student payment protection during testing."
---

# 💳 Dynamic Payment Gateways (Live vs Test)

> Linked Entities: [[00_EduCore_Master_Index]], [[01_Multi_Tenant_Provisioning]], [[11_PostgreSQL_Cluster_Architecture]]

## 1. The Multi-Account Gateway Problem
As highlighted by Karanvir Sir, collegiate campuses have distinct commercial legal entities:
- School of Pharmacy has a separate current account from School of Law or Engineering.
- Previous systems (e.g. EduMarshal) hardcoded a single gateway key into their mobile/web apps, causing severe financial entanglement and requiring weeks of mobile app re-deployments to fix.

## 2. EduCore Dynamic Gateway Architecture
- Managed dynamically from the Super Admin / Campus Finance console (`/api/finance/payment-gateways`).
- Any number of gateways (Razorpay, HDFC PayU, ICICI ePay, Cashfree) can be registered.
- **Active Gateway Selection**: An admin switches the active gateway with a single click at runtime without modifying code or re-deploying mobile builds.

## 3. Live vs Test Sandbox Switch
- Each gateway has a toggle: `mode: 'live'` vs `mode: 'test'`.
- **Student Safety Rule**:
  - In `test` mode, standard students **CANNOT** see the "Pay Now" button in their tuition modal!
  - Instead, the modal displays: *"Online Fee Collection in Maintenance / Sandbox Mode"*.
  - Only authorized test user UIDs (`test_allowed_uids_json`) and campus administrators can execute transactions in test mode.
  - When flipped to `live`, online payments are immediately enabled campus-wide.\n