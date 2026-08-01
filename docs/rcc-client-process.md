# RCC Staff ↔ Client — End-to-End Process

This document describes how an RCC (Records & Cemetery Clerk) works with a client from first contact to a completed burial, using the Himlayan Memorial Park system.

## Roles involved

| Role | Access |
| --- | --- |
| **Public visitor / client** | Public website (`/plans`, `/columbarium`, `/lots`, `/map`, `/reserve`) |
| **RCC Clerk** | Admin portal — Dashboard, Records, Inquiries, Contracts, Payments, Burials, Burial Permits, Pre-Need Plans, Columbary Niches, Client Feedback, Client Notifications, Reports, Settings |
| **Super Admin** | Everything, including User Accounts and Audit Logs |
| **Engineer** | GIS / map editor workspace only |

## 1. Client side (public website)

1. The visitor browses **Pre-Need Plans** (`/plans`), the **Columbarium** (`/columbarium`), or **Memorial Lots** (`/lots`).
2. The visitor submits a **reservation** at `/reserve` for a memorial lot, columbary niche, or pre-need plan (`POST /api/reserve`).
   - The system finds or creates the client by contact number.
   - An **active installment contract** is auto-created against the selected item's price.
   - The lot / niche status becomes **reserved**.
   - The confirmation page tells the client the team will contact them within **24 hours**.
3. A visitor may also submit a general **inquiry** at `/inquiry`.

> Notes:
> - Reservations create contracts with `payment_type = installment`, `amount_paid = 0`, and the full price as `balance_remaining`.
> - `id_number` is set to `PENDING` until the RCC confirms the client's identity.

## 2. RCC intake — reviewing reservations & inquiries

1. Log in to the admin portal. The **Dashboard** (RCC Clerk Workspace) shows:
   - Scheduled burials, pending inquiries, active deeds, total collections.
   - Quick actions: Schedule Interment, Review Inquiries, Deeds & Transfers.
   - A live console listing upcoming burials, latest inquiries, and recent system events.
2. Open **Inquiries** to answer pending requests and assign a tentative plot to the inquirer.
3. Open **Contracts** to confirm the auto-created reservation contract, complete the client's details, and set the final terms.

## 3. Contract registration & approval (the core flow)

In **Contracts**:

1. **Create / edit a contract** with the client, choosing one of:
   - a memorial **lot** (`plot_id`),
   - a **pre-need plan** (`pre_need_plan_id`),
   - a **columbary niche** (`columbary_niche_id`),
   - or **no plot** for a plain service contract.
2. Fill the RCC details:
   - contract type (`new` / `renewal`),
   - ordinance period (`pre_2002` / `2002_2013` / `2013_present`),
   - lot type (`individual` / `family`), lot area (sqm), dimension,
   - total amount, payment type (`cash` / `installment`),
   - for installment, the **number of installments** (2–60) — the system generates the monthly schedule,
   - death certificate number (if any),
   - **AF-51** number and date (official receipt reference).
3. The contract list shows plan / niche badges, financial totals, deed status, and **Treasurer ✓ / Mayor ✓** approval badges.
4. **Verify the signatures** in order:
   - **Verify Treasurer** → `POST /api/contracts/{id}/approve-treasurer`
   - **Verify Mayor** → `POST /api/contracts/{id}/approve-mayor`
   - Each approval records the timestamp and **notifies the client** (`ContractApproved`).
5. Use the **detail modal** to print the Himlayan Memorial Park Deed, review the installment schedule, and see approval timestamps.

## 4. Payments & installment collection

In **Payments**:

1. Record each payment with amount, method (`cash` / `installment`), receipt number, and **AF-51 number**.
2. For installment contracts, the payment is **auto-allocated** across the oldest unpaid schedules first (marked `paid` / `partial` with `paid_at`). The clerk sees the installment schedule and remaining balance before saving.
3. Each payment **notifies the client** (`PaymentReceived`) and refreshes the contract totals.

> Automated follow-up: `reminders:installment` (daily 08:00) notifies RCC/staff/super admin users via the bell and the client via `InstallmentReminder` when an installment is **due in 3 days**.

## 5. Burial scheduling & approval

In **Burial Scheduling**:

1. Schedule a burial against a plot (deceased name, dates, burial date, notes). Plot occupancy increments and the client gets a **BurialScheduled** notification.
2. **Approve** the burial when the interment is performed → `POST /api/burials/{id}/approve` sets status to `completed` and records `approved_at`. The **Approved At** column shows the timestamp.
3. Cancel / update burials as needed; cancelling frees the plot occupant count.

> Automated follow-up: `reminders:burial` (daily 08:00) notifies the user who scheduled it when a burial is **tomorrow**.

## 6. Burial permit (AF-58)

In **Burial Permits**:

1. **Issue a permit** against a contract: deceased, date of birth/death, death certificate number, permit fee, notes. The system assigns an `AF58-XXXXXX` permit number and records the issuer.
   - The client is notified with **BurialPermitIssued**.
2. **Compute rental** for renewals using the RCC rental computation (new-lot fee vs. ordinance-period renewal rates) before finalizing.
3. **Print** the official AF-58 form (view & print modal).
4. Track the lifecycle: `issued` → `used` / `cancelled`.

## 7. Communicating with clients

In **Client Notifications**:

- Compose a **database** or **mail** notification to any registered client and track its status (`sent` / `failed`).

**Staff notification bell** (top-right of every admin page):

- Polls the RCC's own notifications (`/api/user-notifications`).
- Clicking an unread item marks it read and jumps to the linked page (e.g. `/admin/contracts`).

## 8. Recording client feedback

In **Client Feedback**:

- Record feedback against a contract: rating (1–5) and comments. Useful for the RCC to log a client's experience for reports.

## 9. Reports

In **Reports**, the RCC views summary reports for the memorial services operation.

---

## Client notification timeline (automatic)

| Event | Notification sent to client |
| --- | --- |
| Contract verified by Treasurer | `ContractApproved` (treasurer) |
| Contract verified by Mayor | `ContractApproved` (mayor) |
| Payment recorded | `PaymentReceived` |
| Burial scheduled | `BurialScheduled` |
| Burial permit issued | `BurialPermitIssued` |
| Installment due in 3 days | `InstallmentReminder` (daily 08:00) |

## Scheduled background jobs

| Command | Schedule | Effect |
| --- | --- | --- |
| `reminders:installment` | daily 08:00 | Staff bell notifications + client reminder for installments due in 3 days |
| `reminders:burial` | daily 08:00 | Bell notification to the user who scheduled a burial happening tomorrow |

---

## Quick reference — key API endpoints (RCC workflows)

| Action | Endpoint |
| --- | --- |
| List / create contracts | `GET/POST /api/contracts` |
| Verify Treasurer / Mayor | `POST /api/contracts/{id}/approve-treasurer` / `approve-mayor` |
| List / record payments | `GET/POST /api/payments` |
| Schedule burial / approve | `POST /api/burials`, `POST /api/burials/{id}/approve` |
| Issue burial permit | `POST /api/burial-permits` |
| Compute lot rental | `POST /api/burial-permits/compute-rental` |
| Manage pre-need plans / niches | `GET/POST/PUT/DELETE /api/pre-need-plans`, `/api/columbary-niches` |
| Compose client notification | `POST /api/client-notifications` |
| Record client feedback | `POST /api/client-feedback` |
| RCC notifications (bell) | `GET /api/user-notifications`, `POST .../{id}/read`, `POST .../read-all` |
