# Business Model
## Small Plates & Co.

*Version 1.0 — December 2024*

*Note: This is a living document. Unit economics and operational details will be refined as we gather more data and complete the Operations documentation.*

---

## 1. Business Model Overview

### 1.1 How We Create Value

Small Plates creates value by offering a new kind of wedding gift — one that is collaborative, meaningful, and built to be used. We give organizers a way to involve everyone who matters in creating something the couple will actually keep in their kitchen for decades.

We are not improving an existing process. We are creating a new category: the **collaborative wedding recipe book**.

**The Value Equation:**

```
BEFORE Small Plates:
Organizer wants meaningful gift → Options are limited:
  • Registry item (practical but impersonal)
  • Cash fund (convenient but forgettable)
  • Generic gift (ends up in a closet)
→ Nothing feels special enough for this moment

WITH Small Plates:
Organizer discovers a new option → A gift where everyone participates →
50+ people contribute recipes and notes → Professional book created →
Couple receives something collaborative, personal, and functional →
Used weekly in their kitchen for years

What changes:
• From transactional → to participatory
• From forgettable → to permanent
• From one person's choice → to everyone's presence
• From stored away → to used daily
```

### 1.2 How We Make Money

Small Plates generates revenue through **direct-to-consumer sales** of premium, collaborative recipe books for weddings.

**Revenue Model:** One-time purchase with tiered pricing based on number of books included.

**No recurring revenue** in current model, but potential future expansion:
- Anniversary edition reprints
- Additional book copies
- New occasion verticals (baby showers, retirements, etc.)

---

## 2. Product & Pricing

### 2.1 Product Tiers

| Tier | Name | Contents | Price | Primary Buyer |
|------|------|----------|-------|---------------|
| 1 | **The Book** | 1 Premium Hardcover | $149 | Individual gifter, small group |
| 2 | **The Family Collection** | 1 Premium + 2 Classic | $279 | Bridesmaid group (split 4-5 ways) |
| 3 | **The Kitchen Table** | 1 Premium + 5 Classic | $449 | Bride as gifter, large family |
| Custom | **Contact Us** | Flexible configurations | Quoted | Corporate, large weddings |

### 2.2 Product Specifications

**Premium Book:**
- Hardcover, lay-flat binding
- Professional design and layout
- AI-generated recipe images
- Up to 120 recipes
- Archival-quality printing
- Full color throughout

**Classic Book:**
- Same content as Premium
- Standard hardcover binding
- Same professional design
- Intended for additional family copies

### 2.3 Pricing Strategy

**Positioning:** Premium but accessible

| Benchmark | Amount | How We Compare |
|-----------|--------|----------------|
| Average wedding gift | $150 | Tier 1 at $149 = exactly at benchmark |
| Group gift (4 bridesmaids) | $300-800 | Tier 2 at $279 = $70/person if split 4 ways |
| Bride's bridesmaid gift budget | $300-800 | Tier 3 at $449 = within typical range |
| Artifact Uprising album | $150-500 | Competitive with premium photo books |

**Pricing Psychology:**

| Tier | Price Point Logic |
|------|-------------------|
| $149 | Below $150 psychological threshold; equals average gift |
| $279 | Below $300 threshold; easily splittable ($70 × 4, $56 × 5) |
| $449 | Below $500 threshold; premium positioning for multiple copies |

### 2.4 Average Order Value (AOV)

**Current Assumption:** $280 blended AOV

| Scenario | Tier Mix | Blended AOV |
|----------|----------|-------------|
| Conservative | 60% T1, 30% T2, 10% T3 | $197 |
| Base Case | 40% T1, 40% T2, 20% T3 | $265 |
| Optimistic | 30% T1, 45% T2, 25% T3 | $291 |

**Target:** Push toward optimistic mix through messaging that emphasizes value of multiple copies.

---

## 3. Payment Model

### 3.1 Current Approach

**Full upfront payment** at time of purchase.

**Rationale:**
- Creates commitment to complete the project
- Reduces abandonment risk
- Simpler operations (no payment chasing)
- Standard for DTC physical goods

### 3.2 Payment Flow

```
1. Organizer selects tier
2. Full payment collected (Stripe)
3. Access to collection dashboard unlocked
4. Project begins
5. Book printed and shipped when ready
```

### 3.3 Alternative Models to Consider (Future)

| Model | Pros | Cons | Consideration |
|-------|------|------|---------------|
| **Deposit + Final** | Lower barrier to start | Complexity, potential non-payment | Consider if conversion is low |
| **Pay at Ship** | Maximum flexibility | High abandonment risk | Not recommended |
| **Subscription** | Recurring revenue | Doesn't fit use case | Not applicable |

**Recommendation:** Stay with upfront payment. Monitor conversion rates. If significant drop-off at checkout, test deposit model.

### 3.4 Refund Policy

**30-Day Money-Back Guarantee**

| Scenario | Policy |
|----------|--------|
| Request before collection starts | Full refund |
| Request during collection (no printing) | Full refund |
| Request after printing begins | Case-by-case |
| Quality issues with delivered product | Full refund or reprint |

**Note:** Policy details to be finalized. At early stage, lean toward generous refunds to build trust and gather feedback.

---

## 4. Value Chain

### 4.1 End-to-End Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SMALL PLATES VALUE CHAIN                          │
└─────────────────────────────────────────────────────────────────────────────┘

ACQUISITION          COLLECTION           PRODUCTION           DELIVERY
─────────────        ─────────────        ─────────────        ─────────────
│                    │                    │                    │
▼                    ▼                    ▼                    ▼

┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
│ Organizer│        │ Guests   │        │ Design & │        │ Printing │
│ Discovers│───────▶│ Submit   │───────▶│ Layout   │───────▶│ &        │
│ & Buys   │        │ Recipes  │        │ (AI+Pro) │        │ Shipping │
└──────────┘        └──────────┘        └──────────┘        └──────────┘
     │                   │                   │                   │
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
│ Ads,     │        │ Email    │        │ AI image │        │ Mixam    │
│ Content, │        │ invites, │        │ generation│       │ (print   │
│ Referral │        │ Reminders│        │ Pro layout│        │ partner) │
└──────────┘        └──────────┘        └──────────┘        └──────────┘

                    ◄─────────── Small Plates Platform ───────────►
```

### 4.2 Key Activities

| Activity | Who Does It | Value Added |
|----------|-------------|-------------|
| **Guest Invitation** | Organizer (via our tools) | Starts collection process |
| **Recipe Collection** | Guests (via our platform) | Content creation |
| **Reminder Management** | Small Plates (automated) | Ensures participation |
| **Image Generation** | Small Plates (AI) | Visual quality without photos |
| **Layout & Design** | Small Plates (templates + pro) | Professional result |
| **Printing** | Mixam (partner) | Physical production |
| **Shipping** | Mixam / carrier | Final delivery |
| **Customer Support** | Small Plates | Issue resolution |

### 4.3 Key Partners

| Partner | Role | Relationship |
|---------|------|--------------|
| **Mixam** | Print production | Current vendor; exploring volume agreements |
| **Stripe** | Payment processing | Standard integration |
| **AI Services** | Image generation | Proprietary workflow using available tools |
| **Email Provider** | Transactional email | TBD |
| **Hosting** | Platform infrastructure | Vercel / standard cloud |

### 4.4 Key Resources

| Resource | Type | Criticality |
|----------|------|-------------|
| **Platform/Software** | Technology | High — core product experience |
| **Brand** | Intangible | High — differentiation |
| **Design Templates** | Content | High — enables professional output |
| **AI Workflow** | Process | Medium — efficiency advantage |
| **Customer Database** | Data | Medium — grows over time |

---

## 5. Unit Economics

### 5.1 Revenue Per Order

| Tier | Price | % of Orders (Est.) | Revenue Contribution |
|------|-------|--------------------|--------------------|
| Tier 1 | $149 | 40% | $59.60 per order |
| Tier 2 | $279 | 40% | $111.60 per order |
| Tier 3 | $449 | 20% | $89.80 per order |
| **Blended AOV** | | | **$261** |

*Note: Mix assumptions are estimates. Will refine with actual sales data.*

### 5.2 Cost Structure

**Cost of Goods Sold (COGS):**

| Item | Cost (Classic, 100 pages) | Notes |
|------|---------------------------|-------|
| 1 book | $29 | Base printing cost |
| 2 books | $57 | |
| 3 books | $74 | |
| 5 books | $124 | |
| 6 books | $152 | |

**Premium Book Cost:** TBD — estimated at ~2x Classic (~$58)

**COGS by Tier (Estimated):**

| Tier | Contents | Estimated COGS | Notes |
|------|----------|----------------|-------|
| Tier 1 | 1 Premium | ~$58 | Premium = 2x Classic assumption |
| Tier 2 | 1 Premium + 2 Classic | ~$115 | $58 + $57 |
| Tier 3 | 1 Premium + 5 Classic | ~$182 | $58 + $124 |

*Note: Shipping paid by customer (not included in COGS).*

### 5.3 Gross Margin Analysis

| Tier | Price | COGS (Est.) | Gross Profit | Gross Margin |
|------|-------|-------------|--------------|--------------|
| Tier 1 | $149 | $58 | $91 | 61% |
| Tier 2 | $279 | $115 | $164 | 59% |
| Tier 3 | $449 | $182 | $267 | 59% |
| **Blended** | $261 | ~$105 | ~$156 | **~60%** |

**Assessment:** ~60% gross margin is healthy for DTC physical goods. Comparable to:
- Artifact Uprising: Est. 50-60%
- Away Luggage: Est. 60-65%
- Warby Parker: Est. 60-65%

### 5.4 Operating Costs (High-Level)

| Category | Type | Notes |
|----------|------|-------|
| **Customer Acquisition (CAC)** | Variable | TBD — critical metric to track |
| **Platform/Hosting** | Fixed | Relatively low at scale |
| **AI/Software Tools** | Semi-fixed | Scales with volume but not 1:1 |
| **Labor** | Semi-fixed | Design review, support, ops |
| **G&A** | Fixed | Standard overhead |

**Path to Profitability:**

```
Revenue per order:           $261 (blended AOV)
- COGS:                      $105 (40% of revenue)
= Gross Profit:              $156 (60% margin)
- CAC:                       $TBD (target < $50)
- Variable Ops:              $TBD (target < $20)
= Contribution Margin:       Target > $80/order

At $80 contribution margin:
Break-even on fixed costs requires: Fixed Costs / $80 = orders needed
```

### 5.5 Key Unit Economics Metrics to Track

| Metric | Definition | Target | Current |
|--------|------------|--------|---------|
| **AOV** | Average order value | $280+ | TBD |
| **Gross Margin** | (Revenue - COGS) / Revenue | 60%+ | ~60% (est.) |
| **CAC** | Customer acquisition cost | <$50 | TBD |
| **LTV** | Lifetime value (if repeat) | >$300 | TBD |
| **LTV:CAC** | Ratio | >3:1 | TBD |
| **Payback Period** | Months to recover CAC | <3 months | TBD |

---

## 6. Financial Projections Summary

### 6.1 Revenue Projections (from Market Analysis)

| Year | Orders | AOV | Revenue | Growth |
|------|--------|-----|---------|--------|
| Year 1 | 500 | $280 | $140K | — |
| Year 2 | 2,275 | $295 | $671K | 379% |
| Year 3 | 6,500 | $310 | $2.0M | 198% |
| Year 4 | 14,300 | $325 | $4.65M | 133% |
| Year 5 | 29,250 | $340 | $9.95M | 114% |

### 6.2 Profitability Path

| Year | Revenue | Gross Margin (60%) | Est. Operating Costs | Est. Net Margin |
|------|---------|--------------------|--------------------|-----------------|
| Year 1 | $140K | $84K | High relative to revenue | Negative |
| Year 2 | $671K | $403K | Scaling | Negative to break-even |
| Year 3 | $2.0M | $1.2M | Efficient | Break-even to positive |
| Year 4 | $4.65M | $2.79M | Leverage | Positive |
| Year 5 | $9.95M | $5.97M | Optimized | 15-20% net margin target |

*Note: Detailed P&L projections in Financial Model document (TBD).*

### 6.3 Key Assumptions

| Assumption | Value | Basis |
|------------|-------|-------|
| Blended AOV | $280-$340 | Tier mix trending toward higher tiers |
| Gross Margin | 60% | Based on current Mixam pricing |
| CAC | <$50 | Target; will validate with initial spend |
| AOV Growth | 3-5%/year | Mix shift + new products |
| COGS Improvement | 15-25% by Year 3 | Volume procurement leverage |

---

## 7. Business Model Risks & Mitigations

### 7.1 Key Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **CAC too high** | Medium | High | Strong brand, viral loop, referrals |
| **Low participation rates** | Medium | High | Reminder system, easy UX, objection handling |
| **Print quality issues** | Low | High | QA process, vendor management |
| **Competitor entry** | Medium | Medium | Brand moat, category ownership |
| **Seasonality** | High | Medium | Weddings are seasonal; diversify occasions |
| **Single vendor dependency** | Medium | Medium | Develop backup print partners |

### 7.2 Seasonality Considerations

Wedding industry is seasonal:

| Period | Wedding Volume | Expected Orders |
|--------|----------------|-----------------|
| Peak (May-Oct) | ~60% of annual | Higher volume |
| Off-Peak (Nov-Apr) | ~40% of annual | Lower volume |

**Mitigation:**
- Plan marketing spend around peak seasons
- Consider occasion expansion (holiday gifts, anniversaries) for off-peak
- Manage cash flow for seasonal swings

---

## 8. Future Revenue Opportunities

### 8.1 Product Extensions

| Opportunity | Description | Timeline | Revenue Potential |
|-------------|-------------|----------|-------------------|
| **Anniversary Editions** | Yearly reprints with new recipes | Year 2+ | Medium |
| **Additional Copies** | Easy reorder of existing books | Year 1+ | Low-Medium |
| **Premium Unboxing** | Gift packaging upgrade | Year 2+ | Low |
| **Digital Companion** | App with all recipes | Year 3+ | Low |

### 8.2 Occasion Expansion

| Occasion | Market Size | Fit with Brand | Timeline |
|----------|-------------|----------------|----------|
| **Baby Showers** | Large | High | Year 2-3 |
| **Retirements** | Medium | High | Year 3+ |
| **Anniversaries** | Medium | High | Year 2-3 |
| **Family Reunions** | Medium | High | Year 3+ |
| **Memorial/Tribute** | Small | Medium | Year 4+ |

### 8.3 Channel Expansion

| Channel | Description | Timeline |
|---------|-------------|----------|
| **B2B (Planners)** | Wholesale/partnership with wedding planners | Year 2+ |
| **Venues** | Partnerships with wedding venues | Year 3+ |
| **Corporate** | Team cookbooks, company events | Year 3+ |
| **International** | Canada, UK, Mexico, Europe | Year 3+ |

---

## 9. Key Metrics Dashboard

### 9.1 North Star Metric

**Books Delivered** — The ultimate measure of value created.

Every book delivered represents:
- A completed project
- A satisfied organizer
- ~50-100 recipe contributors touched
- 100+ brand impressions at the wedding
- Potential referrals

### 9.2 Leading Indicators

| Metric | What It Tells Us | Target |
|--------|------------------|--------|
| **Conversion Rate** | Landing page → Purchase | >2% |
| **Collection Completion Rate** | % of projects that finish | >85% |
| **Avg. Recipes per Book** | Participation quality | >40 |
| **Time to Completion** | Process efficiency | <6 weeks |
| **NPS** | Customer satisfaction | >50 |

### 9.3 Financial KPIs

| Metric | Definition | Target |
|--------|------------|--------|
| **Monthly Revenue** | Total sales | Growth month-over-month |
| **AOV** | Revenue / Orders | $280+ |
| **Gross Margin** | Gross Profit / Revenue | >60% |
| **CAC** | Marketing Spend / New Customers | <$50 |
| **CAC Payback** | CAC / Monthly Gross Profit per Customer | <3 months |

---

## 10. Summary

### Business Model at a Glance

| Element | Description |
|---------|-------------|
| **What we sell** | Premium collaborative recipe books for weddings |
| **Who buys** | Bridesmaids, family, brides (as gifters) |
| **Price range** | $149 - $449 (custom available) |
| **Gross margin** | ~60% |
| **Key differentiator** | Done-for-you service + premium brand |
| **Revenue model** | One-time purchase (expansion opportunities exist) |
| **Path to profit** | Scale to ~$2M revenue with 60% gross margin |

### What Makes This Model Work

1. **High gross margins** (~60%) provide room for customer acquisition and operations
2. **Premium positioning** justifies pricing and attracts target demographic
3. **Done-for-you model** creates real value vs. DIY alternatives
4. **Viral loop** reduces CAC over time (each book = 100+ impressions)
5. **Scalable operations** — AI + templates enable growth without linear cost increase

---

## References & Notes

### Documents Referenced
1. Small Plates Executive Summary v2
2. Market Analysis (TAM/SAM/SOM projections)
3. Target Customer Analysis
4. Competitive Analysis

### Items Requiring Future Refinement
- [ ] Premium book COGS (confirm with Mixam)
- [ ] CAC benchmarks (from initial ad spend)
- [ ] Actual tier mix (from sales data)
- [ ] Detailed P&L model
- [ ] Cash flow projections
- [ ] Detailed operational costs

### Related Documents (TBD)
- Operations Document — Detailed process and cost breakdown
- Financial Model — Full P&L, cash flow, scenarios
- Go-to-Market Plan — Customer acquisition strategy

---

*Document Version 1.0 — Small Plates & Co.*
*Last Updated: December 2024*
*Status: Draft — To be refined with operational data*