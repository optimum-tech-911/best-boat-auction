# Original specification (PDF text extraction)

The source PDF in the repository root is authoritative for diagrams and original formatting. The user's current frontend-first scope and deferred Stripe/Supabase integration are recorded in docs/decisions/0004-frontend-first.md.


===== PAGE 1 =====
Tidebid — Boat Auction Platform:
Architecture & Build Spec (for Codex)
 Oct 4, 2026  ·  @Adrien
Start here
We are building a timed online auction platform for boats in four languages, matching
boatauction.com's proven model and beating it on live bidding, safe payment,
transparency and seller acquisition. Codex builds it milestone by milestone from this
document; you review and merge.
"Tidebid" is a placeholder brand. Replace it everywhere once you pick a name and domain.
The two prototype files, tidebid_platform.tsx  and
vendre_mon_bateau_estimator.tsx , are visual references only; keep them in
docs/prototypes/ . The first one was written before this spec and its bidding code
differs from it. Whenever a prototype and this document disagree, this document wins.
How to run this with Codex
1 . Create an empty GitHub repository and connect it to Codex.
2. Save the AGENTS.md section of this doc as AGENTS.md  at the repository root. Export
this whole doc to Markdown and save it as docs/SPEC.md .
3. Run the milestones in the Build plan section in order. One milestone = several tasks.
One task = one pull request.
4. For every task, paste its prompt, ask Codex for a plan first, approve the plan, then let it
implement.
5. Merge only when CI is green and the acceptance criteria listed with the task pass.
6. If Codex says the spec is unclear, answer by editing this doc, then re-export it. The doc
stays the single source of truth.
Decisions already taken
Codex must not re-open these choices. Each one keeps the system simple, testable and
EU-hosted.
Area Choice Why
Language TypeScript (strict) everywhere One language for web, API,
workers and shared rules
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 1 of 49

===== PAGE 2 =====
The payment, e-signature and identity-check vendors are chosen in the Payments and
Compliance sections. They sit behind adapters, so a vendor can change without touching
business logic.
The three rules that make the platform trustworthy
1 . The server decides everything. Price, leader, time left and closing are computed only
on the server, inside one database transaction per bid.
2. Every rule lives once, in a shared package of pure, tested functions: bidding, fees,
deadlines and the seller estimator.
3. Nothing important happens silently. Every change to a lot, bid, payment or payout
writes an audit entry, and the admin panel can see and control all of it.
Area Choice Why
Repository pnpm workspaces + Turborepo
monorepo
Shared domain code, one CI
Public site, seller
portal
Next.js (App Router), server-
rendered
SEO for every lot page, fast first
load
Admin panel Separate Next.js app on its own
subdomain
Isolated access, stricter security
API, real-time,
webhooks
NestJS on the Fastify adapter Guards for permissions, built-in
WebSocket and job modules
Database PostgreSQL 17+ with Prisma Transactions and row locks for
bids
Jobs, cache,
pub/sub
Redis + BullMQ Lot closing timers, notifications,
fan-out
Live updates Socket.IO with the Redis adapter Rooms per lot and per user,
reconnects
Search Meilisearch Facets, typo tolerance, 4
languages
Files S3-compatible storage + CDN Photos, videos, documents
Hosting Docker containers in an EU
region (default AWS eu-west-3,
Paris), Terraform
Data stays in the EU
Locales fr (default), en, nl, de France first, Benelux and
Germany next
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 2 of 49

===== PAGE 3 =====
How online auction platforms work
Boat auctions online are timed ascending auctions. Each lot has its own closing time, bids
only go up, a private maximum bid bids for you, and a late bid extends the lot so nobody
wins by sniping. After closing, the seller confirms the sale (or, in a regulated auction,
reaching the reserve confirms it automatically) and the money flows through a trusted
third party until handover.
Vocabulary, with the default rule we adopt
Term What it means Our default
Auction (sale) A dated event that groups many
lots
One main auction per month,
viewing day the Saturday before
Lot One boat (or engine, trailer) for
sale
Own page, own closing time
Start price Where bidding opens Set with the seller
Increment Smallest step above the current
bid
Table by price band, admin-
editable
Single bid One exact amount, placed once Whole euros, at least the next
minimum
Max bid
(automatic bid)
A private ceiling; the system bids
the smallest step needed for you
Private to the bidder and admins
Reserve price Hidden minimum the seller
accepts
Optional; in regulated mode
reaching it awards the lot, in
brokerage mode it is a target for
the seller
No reserve Highest bid wins, whatever the
amount
Badge on the lot; regulated mode
only
Soft close A late bid pushes the closing time
back
Bid in the last 5 min → closes 5
min after that bid
Staggered closing Lots close one after another 1 minute apart
Hammer price The winning bid Basis for every fee
Buyer's premium Platform fee paid by the buyer on
top of the hammer price
18% / 12% / 8% by start price, plus
VAT on the premium
Subject to award Seller may still accept or decline
the top bid
Seller has 72 hours
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 3 of 49

===== PAGE 4 =====
What the leading platforms do
Term What it means Our default
Second-chance
offer
Lot offered to the runner-up
when the winner defaults
Runner-up's last bid
Escrow Buyer's money held by a licensed
third party
Released to the seller after
handover
Viewing day Buyers inspect the boat in person Saturday 10:00–12:00
Platform Late-bid
extension
How lots close Max bids and
reserve
Non-payment
protection
boatauction.com Bid in last 5 min
adds 5 min
(source)
Monthly sale,
lots about 1 min
apart
Normal or
automatic bid;
hidden
minimum;
seller decides
within 72 h
(terms)
Premium + VAT
stays due as a
break-up fee
Catawiki Bid in last 60 s
adds 90 s
Staggered,
about 1 min
apart
Max above
reserve jumps
to the reserve;
max below
reserve is bid
in full; equal
maxima: earlier
one leads
Card hold on
risky bids, at
most €1,000 in
total
Troostwijk Bid in last 2 min
adds 2 min
Lot by lot Auto-bid Public auction:
bidders may
attend the
closing in
person, so no
cooling-off
period
iRostrum (UK) Bid in last 5 min
extends up to 5
min, repeatedly
About 2 min
apart; one lot's
extension never
moves another
Raising your
own max never
bids against
yourself
—
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 4 of 49

===== PAGE 5 =====
We copy the strongest rule from each: 5-minute soft close with independent lots,
Catawiki's reserve-aware max bids and tie rule, and card holds for risky bidders.
What boatauction.com does today
The competitor is VesselAuction B.V. (Naarden, NL), also trading as bootveiling.com,
vesselauction.com and superyachtauction.com (terms).
Calendar. One auction a month, closing on a Monday evening, viewing day the
Saturday before, 10:00–12:00 (calendar).
Buyer fees. 18% premium up to €25,000, 12% from €25,000 to €100,000, 8% from
€100,000, chosen by start price, plus 21% VAT on the premium (source).
Seller fees. Flat by length: €100 up to 5 m, €200 for 5–10 m, €300 for 10–15 m, €500
above 15 m (source).
After closing. Seller has 72 hours to accept. Buyer pays a third-party funds account
within 4 days of the invoice, collects within 14 days and becomes owner after payment
and signing, or 14 days after award at the latest.
Trust. A bailiff supervises the auctions. Bidders may attend the closing at the Naarden
office, which makes it a public auction where the statutory right of withdrawal does
not apply (terms).
Seller lock-in. Exclusivity until closing plus 30 days; withdrawing costs the premium
plus VAT on the current bid, at least €500.
Where we beat them
Live bidding. Prices, leader and clock update instantly; their page needs a reload.
Smarter bids. Max bids that meet the reserve, and, in regulated mode, automatic
award when the reserve is reached, so sellers wait less.
One set of deadlines. Their own pages contradict each other on payment (2 or 4 days)
and seller payout (24 hours or 5 working days); ours come from one config.
Digital closing. Instant invoice, licensed escrow, e-signed transfer document and a
handover code instead of paper and email.
Seller acquisition. A "Vendre mon bateau" funnel with a cost-of-waiting estimator, a
live seller dashboard and a public results archive.
Search visibility. Catalogue pages rendered on the server, so search engines see every
lot.
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 5 of 49

===== PAGE 6 =====
Product scope
Version 1 ships three products on one codebase: the public auction site, the seller portal
and the admin panel. Two journeys must work end to end before launch, and each
becomes an automated end-to-end test.
1 . Buyer: discover → register → verify → bid → get outbid → set a max bid → win → pay into
escrow → e-sign the transfer → collect with the handover code.
2. Seller: estimator → lead → intake wizard → verification → e-signed consignment → listed
→ live → accept the top bid → handover → payout.
Roles
Buyer features
Role Who Can do
Visitor Anyone Browse, search, use the estimator, read
guides, watch lots on this device
Bidder Registered, email and phone
verified
Bid within their credit limit; ID check
required for any bid of €25,000 or more
Private seller Owner of a boat Consign boats, follow stats, accept or
decline, get paid
Business
seller
Dealer, broker, bank, leasing
firm, bailiff
Everything a seller does, plus bulk
listing and VAT invoices
Staff Platform employees, several
admin roles
Defined in the Admin panel section
Supervisor Bailiff or notary Read-only access to bid logs and closing
reports
Feature Done when
Catalogue and search Filters for type, price, length, year, country, brand,
fuel, engine hours, no reserve and closing within 24
h; facet counts; sort by closing soonest, price,
newest; filters live in the URL; first page rendered
on the server
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 6 of 49

===== PAGE 7 =====
Seller features
Feature Done when
Lot page Up to 80 photos, video, documents; key facts;
specs grouped by the category template;
approximate map (about 2 km); viewing-day sign-
up; question form; similar lots; structured data for
search engines
Bidding panel Price, leader and clock update within 1 s; single and
max bids; quick-bid amounts; cost breakdown
before the binding confirm; reserve badge when
the lot shows it; a clear message for every rejection
reason
Watchlist and saved searches Heart on every card; reminders 24 h, 1 h and 10 min
before closing; alerts when new lots match a saved
search
Notifications In-app, email and web push; optional SMS when
outbid in the last hour; preferences per type
My bids Tabs for leading, outbid, won, lost and awaiting
seller; raise or cancel a max bid; invoices and
documents
After winning Invoice within 5 minutes; pay by bank transfer to a
unique IBAN or a local method; e-sign the transfer;
book a pickup slot; show a handover code; confirm
receipt
Results archive Every closed lot with its outcome and, when the
seller allows, the final bid
Feature Done when
"Vendre mon bateau" button In the header on every page, sticky on mobile, in
the footer and on lot pages ("Own a similar boat?")
Cost-of-waiting estimator Specified in the Seller acquisition section
Intake wizard Five steps: owner and contact, boat basics,
equipment and condition (per category), photos
and documents, auction date and viewing
availability; autosave on every field; resume by
magic link; camera upload on mobile
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 7 of 49

===== PAGE 8 =====
Business sellers and partners
Banks, leasing firms and bailiffs sell repossessed boats, as boatauction.com does with its
foreclosure auctions. They get bulk upload by CSV, special conditions per lot and their
own VAT invoices.
Later, not in version 1: native mobile apps (the site is an installable web app first), live-
streamed auctioneer sales, sealed-bid tenders, Buy Now after an unsold auction,
transport and survey partners, and currencies other than EUR.
Auction rules and bidding engine
One pure function decides every bid: applyBid(lotState, command, now, rules) . It
lives in packages/domain , has no database or clock access, and is replayable. The API
wraps it in a single locked transaction; nothing else may change a lot's price, leader or
closing time.
Rules and their defaults
All values live in a versioned settings table that admins edit. Each lot stores the settings
version it went live with.
Feature Done when
Verification Private: ID, address, IBAN, tax number. Business:
company registration, VAT number checked in
VIES, beneficial owners
Consignment agreement Generated from a template with the boat, fees and
exclusivity terms; e-signed; signed PDF stored
Listing build AI drafts the description and translations; staff
edits and approves before publishing
Seller dashboard Views, watchers, viewing sign-ups, questions and
live bids; weekly email report
Award decision Top bid, runner-up and reserve status; accept,
decline or counter-offer; 72 h countdown;
reminders at 24 h, 48 h and 66 h
Payout Released 24 h after handover is confirmed, or after
14 days when a consumer buys from a business
outside public-auction mode; payout statement
PDF; status visible
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 8 of 49

===== PAGE 9 =====
Setting Default Notes
Bid unit Whole euros Stored as integer cents
Soft-close window 5 min Only bids that change the price or
the leader count
Extension Closes 5 min after that bid endsAt = max(endsAt, bidTime +
5 min) , no cap
Closing interval 60 s between lots Each lot extends on its own
Reserve-aware max
bids
On A max at or above the reserve
jumps to the reserve; below it, the
max is bid in full
Auto-award at
reserve
By sale mode Regulated mode: a final bid at or
above the reserve is awarded at
closing. Brokerage mode: off, the
seller always confirms
Seller decision
window
72 h No answer = not awarded
Counter-offer On Seller proposes one price; buyer
has 24 h
Payment due 4 days after the invoice Reminders after 2 and 3 days
Collection Within 14 days of award
Runner-up offer 48 h Used when the winner defaults
ID check Required for any bid ≥
€25,000
Card hold for risky
bidders
5% of the bid, at most €1,000
held per bidder
No completed purchase yet, or a
past default
Premium basis Start price of the lot 18% below €25,000 · 12% to
€100,000 · 8% from €100,000
VAT on the
premium
Rate of the platform's own
country
France 20%, Netherlands 21%
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 9 of 49

===== PAGE 10 =====
Increments
This table reproduces every next-minimum bid observed on boatauction.com in October
2026 (€1,500 → €1,600, €10,500 → €11,000, €32,000 → €33,000, €68,000 → €70,000). The
next minimum is the start price when there are no bids, else the current bid plus the step
for its band.
Buyer total
\text{total} = H + \text{round}(H \cdot v_{lot}) + P + \text{round}(P \cdot 
v_{fee}), \quad P = \text{round}(H \cdot r(\text{start}))
H is the hammer price, r the premium rate for the lot's start price, v_lot the VAT rate on the
boat (0 for private sellers and the margin scheme), v_fee the VAT rate on the premium.
Every line rounds half-up to the cent.
Checks before the engine runs
The bidding service rejects the bid, with a specific error code, when any of these fail:
1 . The bidder is signed in, has verified email and phone, and accepted the current terms.
2. The bidder is not the seller and not linked to the seller (same verified identity, phone,
payment card, device or address).
3. The bidder is not suspended and has no unpaid invoice past due.
4. ID is verified when the amount is €25,000 or more; a card hold exists when the risk
rules ask for one.
Current bid from (€) Next step (€)
0 50
1,000 100
5,000 250
10,000 500
25,000 1,000
50,000 2,000
100,000 5,000
250,000 10,000
1,000,000 25,000
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 10 of 49

===== PAGE 11 =====
5. The bidder's total of leading bids stays within their credit limit (default €250,000,
admin-editable).
6. Rate limit: at most 10 bid requests per minute per bidder per lot.
7. The amount is at most 20 times the next minimum; the interface asks for a second
confirmation above twice the next minimum.
The engine
function applyBid(s: LotState, cmd: BidCommand, now: Instant, rules: Rules): 
Result {
  if (s.status !== 'LIVE') return err('LOT_NOT_LIVE')
  if (now >= s.endsAt) return err('LOT_CLOSED')
  if (cmd.amount <= 0 || cmd.amount % 100 !== 0) return err('INVALID_AMOUNT')
  const next = s.price === null ? s.start : s.price + inc(s.price, rules)
  const reserveOpen = rules.reserveAware && s.reserve !== null && (s.price ?? 
0) < s.reserve
  const out: EmittedBid[] = []
  // A. The current leader raises their own max (a leader may never bid 
against themselves)
  if (cmd.user === s.leader) {
    if (cmd.kind === 'single') return err('ALREADY_LEADING')
    if (cmd.amount <= s.leaderCeiling) return err('MAX_TOO_LOW')
    let price = s.price
    if (reserveOpen) price = cmd.amount >= s.reserve ? s.reserve : cmd.amount
    if (price !== s.price) out.push(bid(s.leader, price, 'auto'))
    return done(s, { leader: s.leader, ceiling: cmd.amount, ceilingAt: now, 
price }, out, now, rules)
  }
  if (cmd.amount < next) return err(cmd.kind === 'single' ? 'BID_TOO_LOW' : 
'MAX_TOO_LOW')
  // B. First bid on the lot
  if (s.leader === null) {
    let price = cmd.kind === 'single' ? cmd.amount : s.start
    if (cmd.kind === 'max' && reserveOpen) price = cmd.amount >= s.reserve ? 
Math.max(s.start, s.reserve) : cmd.amount
    out.push(bid(cmd.user, price, cmd.kind === 'single' ? 'manual' : 'auto'))
    return done(s, { leader: cmd.user, ceiling: cmd.amount, ceilingAt: now, 
price }, out, now, rules)
  }
  // C. Challenger against the leader's ceiling M (M = leader's max, or the 
price if no max)
  const M = s.leaderCeiling, C = cmd.amount
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 11 of 49

===== PAGE 12 =====
  if (C > M) {
    if (M > s.price) out.push(bid(s.leader, M, 'auto'))          // leader's 
max is used up
    let price = cmd.kind === 'single' ? C : Math.min(C, M + inc(M, rules))
    if (cmd.kind === 'max' && reserveOpen) price = C >= s.reserve ? 
Math.max(price, s.reserve) : C
    out.push(bid(cmd.user, price, cmd.kind === 'single' ? 'manual' : 'auto'))
    return done(s, { leader: cmd.user, ceiling: C, ceilingAt: now, price }, 
out, now, rules)
  }
  out.push(bid(cmd.user, C, cmd.kind === 'single' ? 'manual' : 'auto'))  // 
challenger bids in full
  const price = C === M ? M : Math.min(M, C + inc(C, rules))            // 
tie: the earlier ceiling wins
  out.push(bid(s.leader, price, 'auto'))
  return done(s, { leader: s.leader, ceiling: M, ceilingAt: 
s.leaderCeilingAt, price }, out, now, rules)
}
function done(s, next, out, now, rules): Result {
  const visible = next.price !== s.price || next.leader !== s.leader
  const endsAt = visible && s.endsAt - now < rules.softWindowMs
    ? Math.max(s.endsAt, now + rules.extensionMs) : s.endsAt
  return ok({ ...s, ...next, endsAt, extensions: s.extensions + (endsAt > 
s.endsAt ? 1 : 0) }, out)
}
Emitted bids get a per-lot sequence number and are stored append-only. The public
history shows amounts, times and a stable pseudonym per bidder per auction ("Bidder
4821") with a country flag; it never marks which bids were automatic. A bidder sees "auto"
only on their own bids.
Test vectors
Codex turns each row into a unit test. Amounts in euros; no reserve unless stated.
# Lot before Command Bids emitted, in order Price after Leader after
1 Start 10,000, no bids A max 14,000 A 10,000 10,000 A (ceiling
14,000)
2 After 1 B single 10,500 B 10,500 · A 11,000 11,000 A
3 After 2 B max 14,000 B 14,000 · A 14,000 14,000 A (earlier
ceiling)
4 After 3 B max 15,000 B 14,500 14,500 B (ceiling 15,000)
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 12 of 49

===== PAGE 13 =====
Invariants for property-based tests
Run thousands of random command sequences through the engine (fast-check) and
assert after every step:
Without voids, the price never goes down and is never below the start price.
The leader's ceiling is at least the price; no other bidder holds a ceiling above the price.
The winner never pays more than one step above the runner-up's ceiling, except after a
single bid or a reserve jump.
Equal ceilings: the earlier one leads.
The closing time never moves earlier.
# Lot before Command Bids emitted, in order Price after Leader after
5 Start 150, A max 230 B single 220 B 220 · A 230 230 A (partial step,
capped at max)
6 Start 5,000, A max
6,000
B single 7,000 A 6,000 · B 7,000 7,000 B
7 After 6 B single 7,500 none
( ALREADY_LEADING )
7,000 B
8 After 6 B max 9,000 none, silent raise, no
extension
7,000 B (ceiling 9,000)
9 Start 20,000, reserve
24,000
A max 30,000 A 24,000 24,000 A, reserve met
10 Start 20,000, reserve
24,000, A max 22,000
(bid in full)
B max 26,000 B 24,000 24,000 B, reserve met
11 Start 1,000, A max
2,000
B max 2,000 B 2,000 · A 2,000 2,000 A (tie, earlier)
12 Price 9,750 C single 9,900 none ( BID_TOO_LOW ,
minimum 10,000)
9,750 unchanged
13 Ends 20:00:00 Visible bid at
19:57:30
ends 20:02:30 — —
14 Ends 20:00:00 Visible bid at
19:54:59
ends unchanged — —
15 Ends 20:00:00 Bid at
20:00:00.000
none ( LOT_CLOSED ) — —
16 Start 18,000, hammer
21,000, VAT on
premium 21%
Invoice Premium 3,780.00 · VAT
793.80
Total
25,573.80
—
17 Start 25,000, hammer
30,000, VAT 21%
Invoice Premium 12% = 3,600.00 ·
VAT 756.00
Total
34,356.00
—
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 13 of 49

===== PAGE 14 =====
Replaying the same commands with the same timestamps gives the same state, byte
for byte.
How the server applies a bid
1 . POST /v1/lots/{id}/bids  with an Idempotency-Key  header; a repeated key returns
the first result.
2. Run the checks above, then open a transaction and SELECT … FOR UPDATE  the lot row.
3. Read the time from the database ( clock_timestamp() ), never from the client or the
app server.
4. Call applyBid . Store the command, the emitted bids, the new lot state, an audit entry
and outbox events, then commit.
5. After commit, the outbox relay publishes lot.updated  to every viewer and queues
outbid notifications. A changed closing time reschedules the close job.
Target: 95% of bids answered in under 150 ms on the server, with 50 bids per second on
one lot during closing.
Closing on time
Each live lot has one delayed close job at its endsAt , with an id built from the lot and
that time, so duplicates collapse.
The job locks the lot. If endsAt  moved later, it schedules a new job and stops;
otherwise it closes the lot and computes the outcome.
A sweeper runs every 5 s and closes any live lot whose endsAt  passed more than 2 s
ago, in case a job was lost.
A bid that reaches the database at or after endsAt  is always rejected, even if the close
job has not run yet.
Outcome at closing
Situation at close New state
No bids Unsold, seller offered the next auction
No-reserve lot, regulated mode Awarded at once
Reserve set and final bid ≥ reserve, regulated
mode
Awarded at once
Every other case, and every lot with bids in
brokerage mode
Awaiting seller, 72 h to accept, counter or
decline
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 14 of 49

===== PAGE 15 =====
In brokerage mode the seller confirms every sale, so the no-reserve badge is unavailable
and a reserve is only a target shown to the seller. A counter-offer must be higher than the
top bid; if the buyer declines it or 24 h pass, the lot is not awarded. While a lot is live, its
reserve can only be lowered, with the seller's written consent, and the engine then re-
applies the reserve rule to the leader's ceiling. A reserve never goes up.
Lot lifecycle
The left column is the normal path. A lot without bids ends unsold, a declined or
unanswered one ends not awarded, and a dispute decided for the buyer ends refunded;
staff can also withdraw a lot before it closes. In brokerage mode, every lot with bids goes
through seller review.
The same machine as a transition table, which is what Codex implements:
lot lifecycle · 9 main states, 6 side states
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 15 of 49

===== PAGE 16 =====
From Event To
Draft Seller submits In review
In review Staff approve Scheduled
In review Staff reject, with reasons Draft
Scheduled or Live Staff withdraw (fee if bids) Withdrawn
Scheduled Auction opens Live
Live Closes with no bids Unsold, relist offered
Live Closes in regulated mode, no
reserve or reserve met
Awarded
Live Closes in any other case Seller review
Seller review Seller accepts, or buyer accepts
the counter-offer
Awarded
Seller review Seller declines, 72 h pass, or
counter-offer refused or expired
Not awarded
Awarded Buyer pays into escrow In escrow
Awarded Unpaid after 4 days Defaulted
Defaulted Runner-up accepts within 48 h Awarded, runner-up
as buyer
Defaulted Runner-up declines or 48 h pass Unsold, relist offered
In escrow Both parties e-sign Papers signed
Papers signed Seller enters the buyer's code Handed over
Handed over 24 h without a problem; 14 days for
a consumer buying from a business
outside public-auction mode
Settled, payout sent
In escrow, Papers signed or
Handed over
Problem raised Disputed
Disputed Resolved for the seller Settled, payout sent
Disputed Resolved for the buyer, or a valid
consumer withdrawal
Refunded
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 16 of 49

===== PAGE 17 =====
Voiding a bid
Bids are binding; bidders cannot withdraw them. Staff can void a bid for fraud or a proven
system error, with a written reason and a second staff approval. The engine then replays
the lot's remaining commands in their original order and timestamps, which recomputes
price and leader; the closing time never moves earlier. Every affected bidder is notified,
and the bid log keeps the voided entry, marked.
Seller acquisition: "Vendre mon bateau" and the cost-of-waiting
estimator
Sellers are the scarce side of the marketplace, so every page pushes one action: "Vendre
mon bateau". The hook is an honest number: what keeping the boat costs each month,
computed from public cost data and the owner's own figures, with every assumption
visible and editable.
Where the button lives
Header on every page, in the accent colour, and a sticky bar on mobile.
Homepage block: three inputs (type, length, value) give the monthly figure instantly,
then "See the full breakdown".
Every lot page: "Own a similar boat? See what it costs you to keep it."
Results archive: "Sold for €X in this auction. Yours could be next."
Footer, newsletter and the weekly "recently sold" email.
The funnel
1 . Hook. The monthly cost appears after three answers, before any contact details.
2. Refine. Optional details sharpen it: country and coast, how the boat is kept, condition,
real costs, days used per year.
3. Result. Monthly and yearly cost, breakdown chart, cost per day actually used, and
"selling now instead of in 6 months saves about €X".
4. Act. "Sell in the next auction" opens the intake wizard pre-filled with every answer.
Alternatives: "Email me this report" (PDF) or "Call me back".
5. Follow-up. Only with consent: a reminder 48 h after an unfinished intake, and the next
auction's submission deadline.
The page stays honest, which is also the law: no fake countdowns, no pre-ticked consent
boxes, no invented social proof. Urgency comes only from real facts, such as the actual
submission deadline of the next auction.
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 17 of 49

===== PAGE 18 =====
The algorithm
The result is the yearly cost of keeping the boat, divided by 12:
C_{year} = B + I + M + W + T + D + O
Coast factors for B start at 1.3 Mediterranean, 1.0 Corsica and national average, 0.85
Atlantic, 0.75 Channel and North Sea, 0.55 inland waterways. They are first estimates to
calibrate with real seller data. Storage multiplies B: marina berth 1.0, dry stack 0.8, mooring
Term What it is Default when the owner
gives no figure
Basis
B Berth or storage France: 25 × L^2.25 € a year
(L in metres), times a coast
factor; the curve passes
through the national
averages
Observatoire national des
ports de plaisance 2026: about
€1,400 for 6 m, over €21,000
above 20 m
I Insurance 1% of value a year, at least
€200
Banque Populaire: all-risk
cover averages about 1% of
value
M Maintenance and
repairs
The larger of 5% of value and
€75 per metre
Professional rule of 5–10% of
value a year, approximate
W Winter storage
ashore
€15 per metre per month, for
the months entered (default
5) when the boat winters
ashore
Port Adhoc 2026 tariff,
Strijensas, approximate
T Boat tax France: the owner's TAEMUP
amount, with a link to the
official simulator; the scale
changes in 2027, so it is
never hard-coded
mer.gouv.fr: hull of 7 m or more,
due from €76
D Loss of resale
value
Value × yearly rate by age,
where age = current year −
year built: 0 → 15%, 1–5 → 7%,
6–10 → 5%, 11–20 → 4%, 21+
→ 3%; × 0.85 excellent, 1.0
good, 1.25 fair, 1.5 needs work
Giornale della Vela: about 5%
a year from year 2 to 5,
flattening by year 10
O Money tied up Value × a safe savings rate,
default 1.7%
Livret A at 1.7% since 1 August
2026
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 18 of 49

===== PAGE 19 =====
buoy 0.35, hard standing all year 0.5, trailer at home a flat €150. Netherlands, Belgium and
Germany start at 0.8 of the French curve until local data replaces it.
The owner's value V is required, with a slider and "Not sure? Our valuation is free". From
the first results onward, the platform shows a median sale price per metre for similar
boats from its own archive, never an invented figure.
Worked example
A 10 m motorboat built in 2008, worth €60,000, in good condition, on a Mediterranean
berth all year, TAEMUP €500 from the owner's notice, used 15 days a year:
Total €13,299 a year, so about €1,108 a month and €887 per day on the water. Selling in the
next auction instead of in six months avoids about €6,650. Codex uses this case as a unit
test: same inputs, €13,299 ± €1.
What the result screen shows
Headline: "Your boat costs you about €1,108 a month."
The breakdown chart, each line editable in place, with the source of every default one
tap away.
Cost per day used, when days are given.
"Wait 3, 6 or 12 months" toggle with the cumulative figure.
Selling-cost comparison: our flat seller fee against a broker commission of 8–10%
(Royal Nautisme Brokerage), shown in euros for this boat.
Next auction date and its real submission deadline.
worked example of this section · defaults from the algorithm table
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 19 of 49

===== PAGE 20 =====
Built for change
estimateHoldingCost(input, params)  is a pure function in packages/domain .
Every parameter lives in the admin panel; each change creates a new version, and each
saved estimate stores the version it used.
Each run is stored anonymously. A lead attaches to it only after consent. Admins see
leads scored by value, region and stated timing.
Version 2 replaces the default curves with medians from the platform's own results
once each segment has at least 30 sales.
System architecture
Four deployable apps share one TypeScript monorepo: web , admin , api  and worker .
Only api  writes business data, only worker  runs timers, and both call the same pure
rules in packages/domain .
Browsers reach web , admin  and the API's live updates through the CDN; api  and
worker  share the same stores, and only they talk to outside providers.
system architecture · 4 apps, 4 data stores, outside providers
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 20 of 49

===== PAGE 21 =====
Repository layout
apps/
  web/        Next.js: public site, buyer account, seller portal (fr, en, nl, 
de)
  admin/      Next.js: admin panel on admin.<domain>
  api/        NestJS on Fastify: REST /v1, Socket.IO gateway, provider 
webhooks
  worker/     NestJS standalone: BullMQ processors, schedulers, outbox relay
packages/
  domain/     pure rules: bidding engine, fees, increments, state machines, 
estimator
  db/         Prisma schema, migrations, seed data, repositories
  contracts/  zod schemas shared by API and clients; OpenAPI generated from 
them
  sdk/        typed API client generated from the OpenAPI file
  ui/         design system (Tailwind, Radix primitives), shared by web and 
admin
  i18n/       messages for fr, en, nl, de; money, date and number formatters
  config/     eslint, tsconfig and prettier presets
  testing/    factories, fixtures, Testcontainers helpers
infra/        Terraform for AWS eu-west-3, Dockerfiles, k6 load tests
docs/         SPEC.md (this document) and architecture decision records
Components
Component Owns Scales by
web Server-rendered pages, SEO, the
estimator UI, the seller portal
More containers behind the CDN
admin Every back-office screen; talks to
api  with staff sessions only
Small and fixed
api Authentication, permissions, every
write, bidding, Socket.IO,
webhooks
More containers; Socket.IO
shares rooms through Redis
worker Lot closing, deadlines,
notifications, media, search
indexing, reports, the outbox relay
More containers per queue
PostgreSQL All business data, audit log, outbox Bigger instance, then read
replicas for reporting
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 21 of 49

===== PAGE 22 =====
Real-time
One Socket.IO namespace /live  with rooms lot:{id} , auction:{id}  and user:
{id} ; the handshake checks the session.
Every event carries serverTime  and a per-lot seq . Clients keep a clock offset and
redraw countdowns locally every 250 ms.
A missing seq  or a reconnect triggers GET /v1/lots/{id}/state , so a client never
shows stale prices.
If the socket fails, the page polls that endpoint every 10 s and shows "Live connection
lost, prices refresh every 10 s".
Background jobs
Component Owns Scales by
Redis Job queues, pub/sub, rate limits,
short caches
Managed cluster
Meilisearch Catalogue search and facets, one
index per locale
Rebuilt from PostgreSQL at any
time
Object storage +
CDN
Photos, videos, documents Managed
Queue Does
lot-close One delayed job per live lot at its closing time
deadlines Seller decision, counter-offer, payment and
collection timers, plus reminders
notifications Email, SMS, web push, in-app, per user preferences
media Image sizes (AVIF, WebP), location metadata
removed from photos, virus scan of documents
search Index updates from outbox events; nightly full
rebuild
payments Webhook follow-up, bank-transfer matching,
payouts
reports DAC7 export, accounting exports, weekly seller
reports, estimator PDFs
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 22 of 49

===== PAGE 23 =====
Outside providers, all behind adapters
Each provider is an interface in packages/domain  with a real adapter and an in-memory
fake for tests and local development: payments, identity checks, e-signature, email, SMS,
web push, storage, search, translation, maps, analytics. Vendors are chosen in the
Payments and Compliance sections.
Security
Sign-in. Passkeys, email magic links, or password hashed with argon2id and checked
against known breaches. Sessions in httpOnly, Secure, SameSite=Lax cookies,
revocable per device.
Staff. Passkey or company single sign-on is mandatory, sessions last 8 h, and sensitive
actions ask for re-authentication.
Permissions. Every API route declares one permission; ownership checks stop a seller
from reading another seller's lots.
Web protections. Strict content security policy, HSTS, rate limits in Redis, Cloudflare
Turnstile on sign-up and contact forms, a WAF in front.
Sensitive data. Identity documents sit in a separate bucket encrypted with KMS and
open through 5-minute signed links; IBANs and tax numbers are encrypted in the
application; logs redact personal data.
Supply chain. Dependabot, CodeQL and secret scanning in CI; an external penetration
test before launch.
Recovery. Point-in-time database recovery for 35 days, daily snapshots copied to a
second EU region, and a restore drill every quarter.
Observability
OpenTelemetry traces across web , api  and worker ; JSON logs with a request id;
Sentry for errors.
Dashboards: bid latency, close-job lag, open sockets, queue depth, payment webhooks.
Alerts: close-job lag above 2 s, bid p95 above 300 ms, error rate above 1%, any failed
payout.
Environments and delivery
Local. Docker Compose with PostgreSQL, Redis, Meilisearch, MinIO and Mailpit; pnpm
dev  starts everything with seed data.
Staging and production. Same images. GitHub Actions builds, tests and pushes them;
migrations run as a one-off task before each deploy, using expand-then-contract
changes only.
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 23 of 49

===== PAGE 24 =====
Deploy freeze. No production deploy from 17:00 to 23:00 on auction closing days.
Data model
PostgreSQL holds about 50 tables in six groups. Money is integer cents, time is UTC, bid
and audit history is append-only, and secrets such as reserve prices sit in their own tables
so a careless query cannot leak them.
Conventions
Ids. UUIDv7 primary keys; human numbers (lot 7701, invoice 2026-000123) are separate
columns.
Money. bigint  cents, EUR only in version 1; rates in basis points (1800 = 18.00%).
Time. timestamptz  in UTC; displayed in the viewer's time zone, default Europe/Paris.
Concurrency. A version  column on every mutable row; bid writes lock the lot row.
History. bids , bid_commands , audit_log  and ledger_entries  are insert-only; the
app's database role has no UPDATE or DELETE on them. Voids and corrections are new
rows.
Personal data. Email as case-insensitive unique text, phone in E.164, tax numbers and
IBANs encrypted in the application.
Identity and accounts
Table Purpose Key columns and rules
users Every person, buyer or
seller
email unique, phone,
locale, country, status, risk
level
credentials , sessions Passkeys, password hash,
magic links, device
sessions
session revocable per
device
verifications Email and phone codes expiry, attempts
kyc_checks Identity checks and their
results
provider, level, status,
expires_at
companies , company_members Business accounts registration number, VAT
number with VIES result,
beneficial owners
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 24 of 49

===== PAGE 25 =====
Catalogue
Auctions and bidding
Table Purpose Key columns and rules
addresses , consents Postal addresses; terms
and marketing consents
consent version and
timestamp
staff_roles ,
staff_permissions ,
staff_assignments
Admin access control see the Admin panel
section
Table Purpose Key columns and rules
categories Motorboat, sailboat, RIB,
sloep, catamaran, jet ski,
engine, trailer…
slug and name per locale
attribute_definitions The spec template per
category
key, type (number, text, enum,
bool), unit, group, label per
locale
boats The vessel itself brand, model, year, length,
beam, draught (cm), hull
material, CIN/HIN, registration
country and number, VAT-paid
status, CE category
boat_attribute_values Values for the category
template
one row per attribute
media Photos and videos storage key, sizes, order, alt
text per locale
documents Survey, papers, special
conditions
visibility: public, registered
bidders, staff only
Table Purpose Key columns and rules
auctions A dated sale sale mode (brokerage or public
auction), opens_at,
closing_starts_at, interval_s,
viewing day, settings version
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 25 of 49

===== PAGE 26 =====
Sale, money and handover
Table Purpose Key columns and rules
lots A boat in an auction lot number, status, start price,
no-reserve flag, price, leader,
leader ceiling and its time, bid
count, ends_at,
original_ends_at, extensions,
version
lot_private Secrets of a lot reserve price, seller notes;
readable only by the seller and
staff with lots.view_reserve
bid_commands What a bidder asked
for
kind, amount, idempotency key
unique per user, database time,
IP, device, accepted or rejection
code
bids Bids the engine
emitted
lot, seq unique per lot, bidder,
amount, manual or auto,
command, hash of the previous
bid + this one
bid_voids Staff voids bid, reason, requested_by,
approved_by
max_bids Private ceilings one active row per lot and
bidder; status active, exhausted
or cancelled
bidder_aliases Public pseudonyms unique per auction
bidding_limits , card_holds Credit limit and card
holds per bidder
amount, provider reference,
release date
watchlist , saved_searches Follows and alerts filters as JSON, alert frequency
viewing_registrations ,
lot_questions
Viewing-day sign-ups,
buyer questions
answered_by, published flag
Table Purpose Key columns and rules
award_decisions Seller decision after
closing
deadline, decision, counter
amount and deadline,
decided_by
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 26 of 49

===== PAGE 27 =====
Table Purpose Key columns and rules
sales One per awarded lot buyer, seller, hammer,
premium, VAT amounts,
status from awarded to
settled
second_chance_offers Offer to the runner-up amount, deadline, answer
invoices , invoice_lines Buyer invoices, seller fee
invoices, credit notes
gapless number per series
and year, PDF, e-invoicing
status
payments , refunds Money in and back provider, method, virtual
IBAN, provider reference,
status
ledger_accounts ,
ledger_entries
Double-entry book of
escrow funds
each transaction sums to
zero; one escrow account per
sale
payouts Money to sellers amount, IBAN snapshot,
provider reference, status
transfer_documents Bill of sale and transfer template version, e-sign
envelope, both signatures,
PDF
pickups Collection appointment slot, place, hashed handover
code, confirmed_at
disputes Problems after the sale type, status, outcome, funds
frozen flag
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 27 of 49

===== PAGE 28 =====
Seller funnel
Content and system
Database rules Codex must add
CHECK (amount_cents > 0 AND amount_cents % 100 = 0)  on bids and bid
commands.
UNIQUE (lot_id, seq)  on bids; UNIQUE (user_id, idempotency_key)  on bid
commands; UNIQUE (provider, event_id)  on the webhook inbox.
Table Purpose Key columns and rules
estimator_runs Every estimate, anonymous
until consent
inputs, parameter version, result,
locale, campaign tags
leads A seller prospect run, contact, consent, score, pipeline
stage, owner
intake_drafts Unfinished intake wizard step data, resume token, expiry
consignments The seller's signed agreement fees, exclusivity end date, e-sign
envelope
Table Purpose Key columns and rules
pages , articles , faq_items ,
banners
CMS content one row per locale, SEO fields
email_templates ,
ui_translations
Message texts key, locale, version
settings Every business rule
from this spec
key, JSON value, version,
effective_from, changed_by
audit_log Every staff and
system change
actor, action, entity, before and
after, IP, hash chain
outbox_events , webhook_inbox Reliable events out
and in
webhook event id unique per
provider
notifications Messages sent channel, template, status
feature_flags , dsa_notices ,
dac7_reports , gdpr_requests
Operations and
compliance
see the Compliance section
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 28 of 49

===== PAGE 29 =====
Invoice numbers come from a counter row locked per series, so numbering has no
gaps.
A deferred trigger rejects any ledger transaction whose entries do not sum to zero.
API and real-time events
The API is JSON over HTTPS under /v1 , described by an OpenAPI file generated from the
zod schemas in packages/contracts . Bids and payments go through HTTP only; the
socket only pushes updates out.
Conventions
Auth. Session cookie for the web apps, with an Origin check on every write; bearer
tokens reserved for future mobile apps.
Errors. RFC 9457 problem JSON with a stable code  (for example BID_TOO_LOW ) and
params  (for example minimumCents ); the client translates the code.
Idempotency. Idempotency-Key  required on bids, payments, payouts and seller
decisions; results kept 24 h.
Pages. Cursor pagination, ?cursor=&limit= , at most 100 items.
Money and time. Integer cents plus currency; ISO 8601 UTC timestamps; every
response carries serverTime .
Limits. Per IP and per user, announced in RateLimit  headers.
Endpoints
Method and path Purpose Access
GET /auctions , GET
/auctions/{slug}
Calendar and auction pages Public
GET /lots , GET /lots/{id} Search with facets; lot detail Public
GET /lots/{id}/state Live state: price, leader alias,
ends_at, bid count, seq
Public
GET /lots/{id}/bids Public bid history Public
POST /estimator/runs Compute a cost-of-waiting
estimate
Public, rate-
limited
POST /leads , POST /contact , POST
/call-requests
Seller leads and contact Public,
Turnstile
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 29 of 49

===== PAGE 30 =====
Method and path Purpose Access
POST /auth/* Register, sign in, magic link,
passkeys, sign out
Public
GET/PATCH /me , /me/bids ,
/me/watchlist , /me/saved-searches ,
/me/notification-settings
Buyer account Signed in
POST /me/kyc/sessions Start an identity check with
the provider
Signed in
POST /lots/{id}/bids Place a single or max bid Bidder
DELETE /lots/{id}/max-bid Stop automatic bidding; the
latest bid stays binding
Bidder
POST /lots/{id}/viewing-
registrations , POST
/lots/{id}/questions
Viewing day, questions Signed in
GET /me/sales/{id} Won lot: invoice, payment,
documents, pickup
Buyer
POST /sales/{id}/payments Get the virtual IBAN or start a
checkout
Buyer
POST /sales/{id}/counter-
offer/accept , /reject
Answer a seller's counter-offer Buyer
POST /sales/{id}/pickup , GET
/sales/{id}/handover-code
Book collection; show the code Buyer
POST /sales/{id}/handover Seller enters the buyer's code Seller
POST /sales/{id}/disputes Report a problem Buyer or
seller
POST /seller/intakes , PATCH
/seller/intakes/{id} , POST
/seller/intakes/{id}/submit
Intake wizard with autosave Signed in
POST /uploads Presigned upload URL for
photos and documents
Signed in
GET /seller/lots , GET
/seller/lots/{id}/stats
Seller dashboard Seller
POST /seller/lots/{id}/decision Accept, decline or counter Seller
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 30 of 49

===== PAGE 31 =====
Incoming webhooks are verified, stored in webhook_inbox  and processed by the worker,
so a repeated event never runs twice.
Bid rejection codes
LOT_NOT_LIVE , LOT_CLOSED , AUCTION_PAUSED , INVALID_AMOUNT , BID_TOO_LOW ,
MAX_TOO_LOW , ALREADY_LEADING , AMOUNT_TOO_HIGH , TERMS_NOT_ACCEPTED ,
ID_CHECK_REQUIRED , CARD_HOLD_REQUIRED , LIMIT_EXCEEDED , SELLER_CANNOT_BID ,
ACCOUNT_SUSPENDED , RATE_LIMITED . Each one has a translated message and, where
useful, a button ("Verify my ID", "Raise my max bid").
Method and path Purpose Access
/admin/* Every admin module; each
route names its permission
Staff
POST /webhooks/{provider} Payment, identity, e-sign, email
events
Signature
checked
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 31 of 49

===== PAGE 32 =====
Socket events
Clients send only subscribe  and unsubscribe  with a list of lot ids, at most 200 per
socket.
Admin panel
The admin panel controls every object and every rule on the platform, so no developer is
needed for day-to-day operations after launch. Every action is checked against a
permission and written to the audit log, and the risky ones need a second person.
Event Room Payload Sent when
lot.updated lot:{id} ,
auction:
{id}
lotId, seq, priceCents,
leaderAlias, bidCount,
endsAt, extended, status,
reserveMet (if shown)
A bid changes the
lot, or its status
changes
lot.bid lot:{id} seq, alias, country,
amountCents, at
Each emitted bid
lot.closed lot:{id} ,
auction:
{id}
outcome (sold, awaiting
seller, unsold), final price if
public
At closing
user.outbid user:{id} lotId, priceCents,
nextMinimumCents
The user loses the
lead
user.leading user:{id} lotId, priceCents An automatic bid
kept the user ahead
user.notification user:{id} id, type, title, body, link Any in-app
notification
auction.updated auction:
{id}
status, paused, message Staff pause or
resume an auction
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 32 of 49

===== PAGE 33 =====
Modules
Module What staff can do
Dashboard Live figures: lots live, bids per hour, total hammer
value of the auction, sell-through rate, revenue,
new leads, overdue payments, open disputes. On
closing night, a live board of lots in closing order
with clocks, extensions and viewers
Auctions Create a sale (dates, first closing time, interval,
viewing day, sale mode); order lots by drag and
drop, which re-staggers closing times; publish;
pause and resume all bidding (closing times shift
by the pause length); extend one lot or all; cancel
Lots and listings Review intakes; manage photos (order, crop, cover,
blur faces and plates); edit descriptions with an AI
draft and the four translations side by side; set
start price, reserve, no-reserve and auto-award
(regulated mode only), reserve badge, fee and VAT
overrides, special conditions; feature on the
homepage; withdraw with the fee computed; relist
unsold lots
Bids and integrity Live bid monitor; full bid log per lot, including
private max bids; void a bid; a suspicious-activity
queue (bidder shares a device, IP, phone, card or
address with the seller; a new account bids only on
one seller's lots; repeated small bids that only push
the price up); block a bidder; set limits and card-
hold rules
Users and companies Search; profile, identity status and documents;
manual verification; risk level and limits; suspend
with a reason; notes and message history; GDPR
export and erasure; read-only "view as user"
Sellers and leads Lead inbox from the estimator, contact and call-
back forms, with scores; a pipeline board (new,
contacted, intake, photos, listed, sold or unsold,
paid); owner, tasks and reminders; call log;
consignment agreements; seller fee invoices
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 33 of 49

===== PAGE 34 =====
Every list has saved views, bulk actions, CSV export and live updates. A global search
finds lot numbers, emails, invoice numbers and the last four digits of an IBAN.
Module What staff can do
Award desk Closed lots awaiting the seller, sorted by deadline,
with top bid, runner-up and reserve; record a
decision taken by phone, with the call note;
counter-offers; second-chance offers; defaults
Finance Invoices and credit notes; match incoming bank
transfers; escrow ledger per sale; payouts and
refunds; late fees and break-up fees; exports (CSV,
FEC for French accounting, UBL); VAT reports; e-
invoicing status
Transfers and handover Transfer documents and signature status;
collection calendar; handover confirmations;
disputes with frozen funds and evidence
Content and SEO Pages, FAQ, guides, banners, spotlight, verified
testimonials; SEO fields per page and locale;
redirects
Communications Email, SMS and push templates per locale with
preview and test send; notification log with resend;
newsletter export
Configuration Every rule in the Auction rules section, versioned
with an effective date; fee tables, increments, VAT
rates, ID-check thresholds, estimator parameters,
categories and their spec templates, auction
calendar, feature flags, maintenance mode
Compliance Identity and company review queue; sanctions and
politically-exposed-person hits; DSA notices; DAC7
completeness and report files; GDPR requests;
consent logs; audit log viewer; a read-only
workspace for the bailiff or notary with signed bid-
log exports
System Queues and failed jobs with retry; webhook log;
outbox lag; integration health; partner API keys for
bulk listing; staff accounts and roles
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 34 of 49

===== PAGE 35 =====
Roles and permissions
"Request" means the action waits for a second person with "Approve".
Actions that always need two people
Voiding a bid, cancelling a live auction, or editing a lot's price fields once it has bids.
Changing fees, increments, deadlines or any rule that touches money.
Any refund; any payout above €10,000; any payout to an IBAN changed in the last 7
days.
Erasing a user's data.
Capability Super
admin
Auction
manager
Listing
editor
Sales Support Finance Compliance Supervisor
Create, publish,
pause auctions
✓ ✓ view view view view view view
Edit listings and
content
✓ ✓ ✓ view view — view —
See and change
reserve prices
✓ ✓ — view — — view —
Bid log with
private max bids
✓ ✓ — — — — ✓ view
Void a bid approve request — — — — approve —
Suspend users,
set limits
✓ — — — request — ✓ —
Identity
documents
✓ — — — — — ✓ —
Leads and seller
pipeline
✓ view — ✓ view — — —
Award desk ✓ ✓ — ✓ view view — view
Invoices and
payments
✓ view — — view ✓ view —
Payouts and
refunds
approve — — — — request — —
Fees, rules and
estimator
settings
approve request — — — request — —
Staff accounts
and roles
✓ — — — — — — —
Audit log ✓ — — — — — ✓ bids only
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 35 of 49

===== PAGE 36 =====
The requester writes a reason, the approver sees the before and after, and the request
expires after 24 h.
Audit
Every staff and system change records who, what, when, from which IP, the before and
after values and the reason. Entries are chained by hash, cannot be edited, and can be
exported for the bailiff, an accountant or a court.
Payments, escrow, invoicing and handover
The buyer's money never touches the platform's own bank account. It goes to a wallet at a
licensed payment institution, stays there until the buyer confirms handover, and is then
split automatically between seller and platform.
Provider
Default: Mangopay, an e-money institution licensed in Luxembourg, built for
marketplaces. It offers a wallet per user or per sale, a dedicated virtual IBAN per wallet,
escrow, split payments, payouts and built-in KYC/KYB, and already runs Vinted, Wallapop
and ManoMano. Lemonway and Stripe Connect are the alternatives to quote against it;
the PaymentProvider  adapter keeps the switch cheap.
Why not hold the money ourselves: holding buyers' funds for others is a regulated
payment service in the EU. boatauction.com uses a Dutch third-party funds foundation; a
licensed provider is the simpler and safer equivalent for a new company.
From award to payout
1 . Invoice. Within 5 minutes of the award the buyer gets a payment statement: hammer
price, VAT on the boat if the seller is a business, buyer's premium and VAT on the
premium.
2. Pay within 4 days. Bank transfer to a virtual IBAN unique to this sale, so it matches
automatically; SEPA Instant is recommended. Cards are accepted only up to €5,000,
because card fees on a boat price are too high.
3. Escrow. The full amount stays in the sale's wallet. The buyer sees "Paid, held in
escrow"; the seller sees "Buyer has paid".
4. Transfer document. Generated from a template with both identities, the boat's
identifiers (CIN or HIN, registration, engine serials), its VAT status and the price, then
e-signed by both parties.
5. Collection. The buyer books a slot within 14 days of the award. The app shows the
buyer a 6-digit handover code and QR code.
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 36 of 49

===== PAGE 37 =====
6. Handover. The seller enters the buyer's code in the app at the boat. That single step
proves the handover, with time and place.
7. Release. Within 24 hours (after 14 days in the consumer case below): hammer price
minus any unpaid seller fee to the seller's verified IBAN, premium and fees to the
platform's wallet. Both get a statement.
The buyer becomes owner after paying and signing, or 14 days after award at the latest,
matching the competitor's terms; the app reminds them to insure the boat from that
moment. A country checklist from the CMS explains the registration change, for example
the French francisation or a Dutch notarial deed for a registered ship.
When something goes wrong
Boats are sold as seen. Disputes cover non-delivery, a different boat, missing papers or
undisclosed debts on the boat, not cosmetic opinions.
One exception to "sold as seen": when a business seller sells to a consumer outside a
public-auction mode, the consumer may cancel within 14 days of receiving the boat. For
those sales the payout waits until the 14 days have passed, and a withdrawal request ends
in Refunded. Who bears the fees and the return of the boat is decided by the lawyer and
stored in settings.
Invoices
Who invoices what. The platform invoices its premium to the buyer and its fee to the
seller. A business seller's boat invoice is issued by the platform on the seller's behalf
under a billing mandate in the consignment agreement. A private seller issues no
invoice; the transfer document is the bill of sale.
Situation What the system does
Buyer has not paid after 2 and 3 days Reminder by email, SMS and app
Buyer has not paid after 4 days Sale cancelled; break-up fee invoice
(premium + VAT); any card hold captured;
bidding suspended; runner-up offered the
lot at their last bid for 48 h, else relisted
Seller refuses handover or the boat is
materially not as described
Dispute opened, funds frozen; if upheld, full
refund to the buyer and a fee to the seller
(premium + VAT on the price, at least €500)
Problem reported within 24 h of handover Release paused until staff close the dispute
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 37 of 49

===== PAGE 38 =====
Numbers. Gapless per series and year: B-2026-000123  buyer, S-2026-000045  seller,
C-2026-000007  credit notes.
Content. Legal names, addresses, company and VAT numbers, date, number,
description, amounts and VAT per rate, payment terms; for business customers in
France, the late-payment penalty and the €40 recovery fee.
Exports. CSV and FEC for the accountant, plus e-invoicing through a certified platform
where the law requires it (see Compliance).
An accountant should validate this invoicing model, and the VAT treatment of the
premium for each country, before launch.
Escrow ledger
Every movement is a balanced double entry across buyer_receivable , escrow:{sale} ,
seller_payable , platform_revenue , vat_collected  and refunds . A nightly job
compares the ledger with the provider's wallet balances and alerts on any difference of
one cent or more.
Compliance and legal
The French auction regime is the decision that shapes the product most, and a French
lawyer must settle it before launch. The platform supports both legal modes per auction,
so the answer changes settings, not code. This section is a builder's checklist, not legal
advice.
The French auction regime
Under Article L321-3 of the Code de commerce, offering a good online as the owner's
agent and awarding it to the highest bidder is a regulated electronic auction sale.
"Courtage aux enchères" is outside that regime only if there is no award to the highest
bidder and no third party involved in the description of the good and the conclusion of the
sale. A courtage platform must also tell the public clearly what kind of service it is.
Our model mixes the two: staff improve descriptions, while the seller decides after
closing. So each auction carries a sale_mode :
Mode How it works What changes in the product
brokerage The seller writes and approves the
listing; staff only check it; the seller
accepts or declines the top bid
Banner "This is not a public auction"
on every lot; descriptions marked as
written by the seller
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 38 of 49

===== PAGE 39 =====
The Dutch model of boatauction.com (bailiff supervision, bidders may attend the closing
in person) is a third variant for the Netherlands. The supervisor role, attendance sign-up
and signed bid-log exports already support it.
Checklist
Mode How it works What changes in the product
regulated A licensed auction house or
commissaire de justice runs the sale
and awards the lot to the highest bid
at or above the reserve
Partner named on lots, terms and
invoices; staff may write
descriptions; award is automatic at
closing
Topic Rule (as of October 2026) What the platform does
Withdrawal right EU consumer law gives 14 days to
cancel a distance purchase from
a business, except at public
auctions consumers may attend;
online-only auctions do not count
Business seller selling to a
consumer outside a public-
auction mode: the lot shows the
withdrawal right and the flow
supports it. Private-to-private
sales are not covered by that law
DSA notices Every hosting service needs a
notice-and-action channel
Report button on lots and
questions; a DSA queue in admin
with decisions and reasons sent
to both sides
DSA trader
traceability
Articles 30–32 (trader data,
compliance by design, informing
buyers) do not apply to micro or
small platforms, or for 12 months
after outgrowing that status
(Article 29)
Built anyway for business sellers:
name, address, contact, ID,
payment account, trade register
number and self-certification
before a listing goes live
DAC7 Platforms report seller data
yearly by 31 January; only sellers
with fewer than 30 sales and
€2,000 or less are excluded; after
two reminders and 60 days, the
platform must withhold payment
or close the account (Taylor
Wessing)
Almost every boat seller is
reportable: tax number, date of
birth, address and IBAN collected
at onboarding; payout blocked
until complete; yearly XML report
and a copy for each seller
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 39 of 49

===== PAGE 40 =====
Documents a lawyer drafts before launch
Topic Rule (as of October 2026) What the platform does
Anti-money-
laundering
From 10 July 2027 the EU caps
cash payments at €10,000 and
treats sellers of watercraft above
€7.5 million as obliged entities
(CMS)
No cash, ever; every party
verified through the payment
provider; sanctions screening;
lots above €7.5 million blocked
until a compliance programme
exists
E-invoicing in
France
Every company must receive e-
invoices from 1 September 2026;
SMEs must issue them from 1
September 2027, through an
approved platform (Weblex)
Invoices generated as Factur-X or
UBL and sent through an
approved platform's API; ready
before September 2027
VAT Premium taxed at the platform's
country rate; the boat's VAT
depends on the seller (private:
none; dealer: margin scheme or
standard rate); EU business
buyers with a valid VAT number
may get reverse charge
VAT regime per lot; VIES check of
VAT numbers; boats under 3
months old or 100 engine hours
flagged for staff review, since
new-boat VAT rules differ;
accountant sign-off
GDPR and cookies Refusing cookies must be as easy
as accepting; data minimised and
kept no longer than needed
Consent banner with equal
buttons and logs; EU hosting;
data processing agreements with
every provider; impact
assessment for identity checks
and fraud scoring; retention table
in settings
Accessibility The European Accessibility Act
covers consumer e-commerce
since June 2025, with an
exemption for micro-enterprises
WCAG 2.2 AA from day one,
checked in CI and by a manual
audit before launch
Boat papers Buyers need ownership,
registration, CE and VAT-paid
proof
Seller uploads them at intake;
staff verify; lots show which
documents exist; transfer
checklist per country
General terms for buyers, one version per sale mode
Consignment agreement for sellers, with exclusivity, withdrawal fee and billing
mandate
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 40 of 49

===== PAGE 41 =====
Quality, launch and auction night
The bidding engine and every money path get the strictest tests, and launch waits for a
full rehearsal auction with real people and real payments.
Tests
Privacy and cookie policies; legal notice; DSA contact point
Auction rules page, written from the Auction rules section of this spec
Templates: transfer document, special conditions, payment statement, invoices
Layer Tool Covers Gate in CI
Domain unit Vitest + fast-
check
Engine test vectors and
invariants, fees,
increments, state
machines, estimator
100% branch coverage of
packages/domain
Integration Vitest +
Testcontainers
Bid transaction,
idempotency, outbox,
close job, webhooks,
ledger balance
All pass
Concurrency Vitest 200 parallel bids on one
lot: final state equals a
one-by-one replay, no
duplicate seq, one leader
All pass
API contract OpenAPI diff No breaking change
without a new version
No breaking diff
End to end Playwright Both journeys, plus
voiding a bid with
approval, pausing an
auction, the award desk;
4 locales; mobile size
All pass on staging
Load k6 5,000 open sockets; 50
bids/s on one lot for 10
min
Bid p95 under 150 ms,
close lag under 1 s
Failure Scripted Worker killed during
closing; one API instance
killed
Lots close within 7 s;
clients resync
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 41 of 49

===== PAGE 42 =====
Performance budgets
Lot page: largest contentful paint under 2.5 s on mid-range mobile (75th percentile),
interaction delay under 200 ms, layout shift under 0.1, under 200 KB of compressed
JavaScript.
API: reads under 200 ms and bids under 150 ms at the 95th percentile.
Live updates reach viewers within 300 ms of the bid being committed.
Before the first public auction
Auction-night runbook
1 . Day before. Deploy freeze on. Check every lot's closing time, the payment provider's
status page and that reminders went out.
2. Two hours before. On-call engineer and auction manager online; dashboards open;
server clocks synced; database load under 50%.
3. Thirty minutes before. Live closing board on screen; support chat staffed.
4. During closing. Watch close-job lag, bid latency and open sockets. An outage at the
identity or payment provider never blocks bidders who are already verified.
Layer Tool Covers Gate in CI
Security ZAP baseline,
CodeQL
Common web flaws,
unsafe code
No high findings
Accessibility axe in Playwright WCAG 2.2 AA rules No serious violations
Legal mode chosen and terms signed off by a lawyer
Invoicing and VAT approved by an accountant
Payment provider live; identity checks tested with real documents
External penetration test done; high findings fixed
Database restore drill done
Load test passed at twice the expected peak
Rehearsal auction: 20 internal bidders, real low-value lots, payment, signature and
handover end to end
Native speakers reviewed fr, en, nl and de
Sitemaps, structured data and redirects checked
On-call rota and a public status page for the first three auctions
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 42 of 49

===== PAGE 43 =====
5. If bidding is impaired for more than 60 s. Pause the auction with the kill switch: closing
times shift by the pause length, a banner and an email tell watchers and bidders, and
bidding resumes once stable. Write up the incident the same night.
6. After the last lot. Confirm every lot closed, the award desk queue is filled, invoices
went out, and the post-auction report reached the team.
Build plan for Codex
Eleven milestones, each a series of small pull requests, with four gates that must pass
before the next phase starts. The pure domain package comes first because bidding,
money and the estimator all depend on it.
Gate 1 keeps app code off untested rules; Gate 3 lets real money flow only after a sandbox
sale balances to the cent.
Milestones
build roadmap · 11 milestones in 4 phases, 4 gates, not to scale
Milestone Tasks, one pull request each Done when
M0 Foundations Monorepo with pnpm and
Turborepo; strict TypeScript,
ESLint, Prettier; Docker
Compose; CI; empty web ,
admin , api , worker  with
health checks; i18n and design-
token scaffolding; AGENTS.md
files
pnpm dev  starts all four apps; CI
green on an empty PR
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 43 of 49

===== PAGE 44 =====
Milestone Tasks, one pull request each Done when
M1 Domain core Money and time helpers;
increments and fees; applyBid
and done ; lot and sale state
machines; deadline calculator;
estimator
Every test vector and invariant in
this spec passes; 100% branch
coverage. Gate 1
M2 Data and
platform
Prisma schema and migrations;
seed data; settings service with
versions; audit log; outbox and
relay; staff roles skeleton
Migrations run from zero; seed
creates a demo auction; audit
entries written by a sample
action
M3 Accounts Sign-up and sign-in (passkeys,
magic link, password); email and
phone verification; profile,
consents; identity-check
adapter with fake and real
provider; staff single sign-on
A user can register, verify and
reach the bidding gate; staff
need a passkey
M4 Catalogue Categories and spec templates;
media pipeline; auctions and lots
in admin; search index; catalogue
and lot pages server-rendered in
4 locales; watchlist
A lot created in admin is
searchable and indexable in all
locales
M5 Live bidding Bid endpoint and transaction;
Socket.IO; close jobs and
sweeper; outbid and closing-
soon notifications; bid history;
My bids; admin bid monitor;
pause switch; void with two
approvals
Concurrency, load and failure
tests pass. Gate 2
M6 Seller funnel "Vendre mon bateau" pages;
estimator API, result page and
PDF; leads pipeline; intake
wizard; seller verification and
DAC7 data; consignment e-sign;
seller dashboard
An estimate turns into a signed
consignment without staff
typing anything
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 44 of 49

===== PAGE 45 =====
Build each domain's admin screens in the same milestone as the domain, so nothing ships
without its controls.
Keep Codex on track
Codex reads AGENTS.md  before any work and gives precedence to the file closest to
the code it edits (OpenAI docs). Keep the root file short, and add
packages/domain/AGENTS.md  and apps/api/AGENTS.md  with the local rules.
This spec is larger than the instruction budget Codex loads automatically, so every task
prompt names the spec sections to read.
One task per conversation and per pull request. Ask for the plan first, approve it, then
let it build.
Never let Codex change packages/domain  and an app in the same pull request, except
in M1.
Milestone Tasks, one pull request each Done when
M7 After the sale Award desk; seller decisions and
counter-offers; invoices;
payment provider (virtual IBAN,
escrow, payouts); ledger;
transfer e-sign; pickup and
handover code; defaults, runner-
up offers, disputes
A sandbox sale runs from award
to payout with a balanced ledger.
Gate 3
M8 Admin
completeness
Dashboards; finance exports;
CMS; message templates; every
settings screen; compliance
queues; audit viewer; supervisor
workspace
Every rule in this spec is editable
in admin, and every edit is
audited
M9 Hardening Security headers and limits;
accessibility fixes; performance
budgets; dashboards and alerts;
restore drill; runbooks
All Quality gates green;
penetration-test findings closed
M10 Launch Legal sign-off; live payment
account; rehearsal auction; first
public auction
Launch checklist complete. Gate
4
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 45 of 49

===== PAGE 46 =====
Prompt template
Read AGENTS.md, then these sections of docs/SPEC.md: <sections>.
Task: <one task from the milestone table>.
Stay inside: <folders>. Do not change anything else. Add no dependency that 
the spec does not name.
First reply with a plan only: files to create or change, tests to add, open 
questions. Wait for my approval.
Then implement, run pnpm lint && pnpm typecheck && pnpm test, and open a pull 
request with a summary,
test output, screenshots for any UI, and every assumption you made.
Done when: <the milestone's acceptance criteria>.
First three prompts, ready to paste
M0.1 — Read AGENTS.md and docs/SPEC.md sections "Start here" and "System 
architecture".
Create the monorepo exactly as in "Repository layout": pnpm workspaces, 
Turborepo, strict TypeScript,
ESLint and Prettier presets in packages/config, Vitest in every package, 
Playwright in apps/web.
Add docker-compose.yml with PostgreSQL 17, Redis 7, Meilisearch, MinIO and 
Mailpit.
Create empty apps web (Next.js), admin (Next.js), api (NestJS on Fastify), 
worker (NestJS standalone),
each with a /health endpoint, and a GitHub Actions workflow running lint, 
typecheck, test and build.
Plan first. Done when: pnpm dev starts all four apps and CI passes.
M1.2 — Read AGENTS.md and docs/SPEC.md section "Auction rules and bidding 
engine" in full.
Implement packages/domain/src/auction: types, inc(), nextMinimum(), 
applyBid() and done() exactly as
specified, plus replay(commands). No I/O, no Date.now(): time is an argument.
Turn every row of the "Test vectors" table into a Vitest test, and every 
"Invariants" bullet into a
fast-check property with at least 10,000 runs. Plan first.
Done when: all tests pass and branch coverage of packages/domain/src/auction 
is 100%.
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 46 of 49

===== PAGE 47 =====
M5.1 — Read AGENTS.md, apps/api/AGENTS.md and docs/SPEC.md sections "Auction 
rules and bidding engine",
"Data model" and "API and real-time events".
Implement POST /v1/lots/{id}/bids in apps/api: the checks before the engine, 
Idempotency-Key handling,
one transaction with SELECT ... FOR UPDATE on the lot, database time via 
clock_timestamp(), applyBid from
packages/domain, inserts into bid_commands, bids, max_bids, audit_log and 
outbox_events, then commit.
Add an integration test with Testcontainers that fires 200 concurrent bids on 
one lot and compares the
final state with a sequential replay. Plan first.
Done when: the concurrency test passes 20 runs in a row.
AGENTS.md
Copy the first block to AGENTS.md  at the repository root, and the two short blocks to the
folders they name. The root file stays well under Codex's default instruction budget of 32
KiB.
# AGENTS.md — Tidebid boat auction platform
## What this is
Timed online auctions for boats, in fr, en, nl and de. The spec is 
docs/SPEC.md and it is the single
source of truth. Read the sections your task names before coding. If the spec 
is unclear or
contradicts itself, stop and ask in the pull request. Never invent a business 
rule.
## Commands
- Install: pnpm install
- Services: docker compose up -d   (PostgreSQL, Redis, Meilisearch, MinIO, 
Mailpit)
- Run everything: pnpm dev
- Checks before every commit: pnpm lint && pnpm typecheck && pnpm test
- One package: pnpm --filter @tidebid/domain test
- End to end: pnpm e2e
- Database (local only): pnpm db:migrate, pnpm db:seed, pnpm db:reset
- Use pnpm only, never npm or yarn.
## Repository map
apps/web, apps/admin, apps/api, apps/worker
packages/domain (pure rules), db, contracts, sdk, ui, i18n, config, testing
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 47 of 49

===== PAGE 48 =====
infra/ (Terraform, Docker, k6), docs/ (SPEC.md, decision records)
## Golden rules
1. Business rules live only in packages/domain as pure functions: no I/O, no 
Date.now(), no randomness.
   Time and settings are arguments.
2. The server decides price, leader, closing time and outcome. Clients only 
display them.
3. Every bid goes through BiddingService.placeBid(): one transaction, SELECT 
... FOR UPDATE on the lot,
   database time from clock_timestamp(), then applyBid(). Nothing else writes 
a lot's price, leader or ends_at.
4. Money is integer cents (bigint in the database). Rates are basis points. 
Never floats for money.
5. Timestamps are timestamptz in UTC. Format them only at the edge, with 
packages/i18n.
6. bids, bid_commands, audit_log and ledger_entries are insert-only. 
Corrections are new rows.
7. Every change to a lot, bid, sale, payment or payout writes an audit_log 
row and an outbox event
   in the same transaction.
8. Never expose reserve prices, max bids or bidder identities in public APIs 
or logs. Bidders appear as aliases.
9. Every API route declares a permission. Admin routes need a staff session 
with passkey or single sign-on.
10. Endpoints that bid or move money require an Idempotency-Key.
11. No user-facing text in code: add keys to packages/i18n for fr, en, nl and 
de.
12. Migrations are additive: expand now, contract in a later pull request. 
Nothing destructive without
    an explicit instruction.
13. Never log personal data, tokens, IBANs or identity documents. Use the 
logger's redaction list.
14. Fees, increments, deadlines and thresholds come from the settings 
service, never from constants.
## Code style
- TypeScript strict, no any. zod validates every external input.
- Errors are RFC 9457 problem objects with a stable code.
- Named exports; default exports only where Next.js requires them.
- Tests sit next to the code as *.test.ts. Domain tests use the spec's test 
vectors verbatim.
- UI uses packages/ui and Tailwind. Every control has a label, a visible 
focus state and AA contrast.
## Definition of done for every pull request
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 48 of 49

===== PAGE 49 =====
- [ ] lint, typecheck, unit and integration tests pass; end-to-end tests too 
when UI changed
- [ ] new behaviour has tests; packages/domain keeps 100% branch coverage
- [ ] i18n keys exist in all four locales
- [ ] any new business object has its admin screen and audit entries
- [ ] docs/SPEC.md updated when behaviour changed, or the question raised in 
the pull request
- [ ] description lists the summary, test output, UI screenshots and every 
assumption
## Never
- Add a dependency the spec does not name without asking.
- Change packages/domain and an app in the same pull request, except during 
milestone M1.
- Deploy, or change infra/, unless the task says so.
- Commit secrets. Use .env.example placeholders.
- Copy logic from docs/prototypes/. Those files are visual references; 
docs/SPEC.md defines the logic.
# packages/domain/AGENTS.md
- Pure functions only: inputs in, outputs out. Never import from apps/* or 
packages/db.
- Every exported function has unit tests. Engine invariants are fast-check 
properties with at least
  10,000 runs.
- Spec sections: "Auction rules and bidding engine", "Seller acquisition".
# apps/api/AGENTS.md
- Bids only through BiddingService: transaction, row lock on the lot, 
clock_timestamp().
- Publish to sockets only after commit, through the outbox relay; never 
inside the transaction.
- Webhooks: verify the signature, store in webhook_inbox, let the worker 
process them.
Tidebid — Boat Auction Platform: Architecture & Build Spec (for Codex)
Page 49 of 49