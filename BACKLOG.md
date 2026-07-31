# Site backlog — conversion review follow-ups

Source: external landing-page review, overall score 72/100. Full review kept in git history / conversation log; this file breaks its recommendations into shippable, independently testable items.

Each item has: what to change, why (one line), and how we'll know it worked. Items are grouped by theme, not by priority — see **Suggested order** at the bottom for sequencing.

---

## A. Hero & entry problem

### A1. Narrow the hero to one entry problem
Currently the page implies it solves career, income, leadership, overload, health, family, and meaning all at once. Pick one entry problem and lead with it; let the rest surface later in the engagement.
Draft direction from the review: *"Make the next important career decision clearly — and follow through without sacrificing the rest of your life."*
- **Test:** Show only the hero (no scrolling) to 5 people who've never seen the site. Ask "who is this for, and what exact problem does it solve?" Success = 4/5 answer correctly without prompting.

### A2. CTA copy test: "Use" vs "Book"
Review suggests "Use a free 30-minute decision session" may outperform "Book a free orientation call" — reframes the call as work, not a sales meeting.
- **Test:** A/B the CTA label (or sequential swap + compare) and track click-through rate on the CTA over a fixed visitor count.

---

## B. Cut and compress

### B1. Move the cognitive-offloading/AI research essay off the homepage
It's a credible tangent, but it interrupts the buying journey before the offer is even introduced, and a technical reader may push back on the extrapolation from the cited study.
- **Test:** Homepage no longer contains the full essay — max 2 sentences + a link out to a separate article/post. Confirm the essay still exists somewhere (don't just delete the thinking).

### B2. Cut total homepage copy by ~35–50%
Same core ideas (clearer thinking, one next step, no pressure, sustainable success, between-session execution) repeat across multiple sections. Consolidate to one strong statement per idea.
- **Test:** Word count before/after (target: -40%). Read-through checklist confirms no major argument was lost, only repetition.
- **Depends on:** B1 (biggest single chunk of the cut).

### B3. Remove the contradictory scarcity line
The "no pressure" positioning is undercut by urgency language elsewhere (e.g. "not next month").
- **Test:** Grep the copy for urgency/scarcity phrasing. Either delete it, or replace with a real, specific constraint ("I currently accept up to three new clients per month") — never generic urgency.

---

## C. Proof & testimonials

### C1. Rewrite testimonials as 3 short case studies
Format: **Situation → Intervention → Observable result.** Target ≤ 60–80 words each, one concrete measurable outcome per case (decision made, role/comp change, hours eliminated, project shipped, behavior sustained 6mo later, etc).
- **Test:** 3 testimonials on the page, each fits the S→I→R structure, each names a concrete result — not just a feeling.

### C2. De-emphasize dated testimonials
Some current testimonials reference 2013–2015 engagements, which reads as less relevant to the current AI/tech positioning.
- **Test:** No testimonial from >5 years ago is used as primary proof without an explicit note on why it's still relevant (e.g., long-term follow-up result).
- **Depends on:** C1 (replacing rather than editing in place).

---

## D. Client-success system (net-new)

### D1. Draft "How we know the coaching is working" section
Currently the page shows process (sessions → actions → transformation) but never shows how success is defined or measured. Proposed structure:
1. Define one observable outcome before starting
2. Record the current baseline
3. Pick one behavior/decision to test after every session
4. Review evidence of progress at the next session
5. At engagement end: explicit stop / continue / change-format decision

- **Test:** Section exists on the page. Karel confirms (in a quick read-through) that it accurately reflects how he actually works — this is a real process to document, not marketing copy to invent.

### D2. Reframe "continue coaching" as earned, not default
The 5th step above (stop/continue/change) should be visibly a *result* of demonstrated progress, not the implied commercial goal.
- **Test:** Copy review — does the page ever imply continuing is the default expectation? Should read as optional and evidence-based.
- **Depends on:** D1.

### D3. Instrument the real funnel (separate from page copy)
Review's core metric: *% of qualified clients who reach their stated first outcome and then voluntarily choose the appropriate next step* — not landing-page conversion rate alone.
- **Test:** A tracked funnel exists: qualified visitor → orientation call → defined goal → first observable result → engagement completion → renewal/referral. Even a simple spreadsheet/CRM tag per stage counts as "done" for v1.
- **Note:** This is a business-process item, not a copy change — can run in parallel with everything else.

---

## E. Structure & differentiation

### E1. Condense the methods list into supporting credibility, not headline
TRIZ, Six Sigma, design thinking, neuroscience, philosophy, coaching credentials — currently read as the differentiator. Review's point: the client buys a better decision + focused execution + fewer costly mistakes + sustainable performance, not a mixture of frameworks.
- **Test:** Methods block still exists, but is positioned as "why you can trust the process," not "here is what makes me different" — check it doesn't lead the differentiation section.

### E2. Add an explicit "who should NOT book this" section
Filters for fit: someone wanting therapy, someone wanting answers handed to them, someone unwilling to do between-session work, someone without a real current decision/goal.
- **Test:** Section exists, reads as helpful/honest rather than gatekeeping. Qualitative check over the next N discovery calls: fewer clearly-wrong-fit bookings.

### E3. Reframe the two offers (3 vs 12 sessions)
Present the 3-session program as the default starting point; 12-session framed explicitly for when multiple connected goals or deeper systemic change emerge — not as a bigger/better upsell.
- **Test:** A cold reader can state, unprompted, "you'd start with the short one unless X."

---

## Suggested order

Roughly matches the review's own priority list — do these first, in order:

1. **A1** — narrow the hero to one entry problem
2. **B1** — cut the research essay from the conversion path
3. **B2** — cut ~40% of total copy
4. **D1** — add the client-success system section
5. **C1** — replace long testimonials with case studies
6. **B3** — remove the contradictory scarcity line
7. **D3** — start tracking the real funnel, not just bookings

Everything else (A2, C2, E1–E3, D2) can slot in opportunistically once the above land — none of them block each other.
