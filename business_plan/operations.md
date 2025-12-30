# Operations
## Small Plates & Co.

*Version 1.0 — December 2024*

---

## 1. Operations Overview

Small Plates is a **software + design business** that outsources physical production. We don't print books — we create them digitally and partner with professional printers for fulfillment.

### What We Do vs. What We Outsource

| Activity | Who Does It | Why |
|----------|-------------|-----|
| Platform & collection | Small Plates | Core product experience |
| AI image generation | Small Plates (via API) | Core product quality |
| Design & layout | Small Plates (automated) | Core product differentiation |
| Printing | Mixam (partner) | Capital-light, scalable |
| Shipping | Mixam (partner) | Integrated with printing |

**Strategic rationale:** We focus on what creates value (the experience, the design, the brand) and outsource commodity production. This keeps us asset-light and scalable.

---

## 2. Production Flow

### End-to-End Journey

```
PURCHASE           COLLECTION          PRODUCTION          DELIVERY
────────           ──────────          ──────────          ────────
   │                   │                   │                   │
   ▼                   ▼                   ▼                   ▼
Customer         Guests submit        AI generates       Mixam prints
pays             recipes              images             and ships
   │                   │                   │                   │
   │                   │              Layout created          │
   │                   │              automatically           │
   │                   │                   │                   │
   ▼                   ▼                   ▼                   ▼
Day 0            Weeks 1-8            Day 1-2              Days 3-20
                 (variable)           (after close)        (print + ship)
```

### Timeline Breakdown

| Phase | Duration | Notes |
|-------|----------|-------|
| **Collection** | 4-8 weeks typical | Variable based on wedding date |
| **Production** | 1-2 days | After organizer closes collection |
| **Printing** | ~15 days | Mixam production time |
| **Shipping** | ~5 days | Depends on destination |
| **Total (post-collection)** | ~20 days | Customer receives book |

**Key insight:** The longest phase (collection) is customer-controlled and happens before we do any production work. Our actual production time is minimal.

---

## 3. Current State vs. Target State

We are currently in MVP/soft launch. Some processes are manual by design — we're validating the product before investing in automation.

### Production Process

| Step | Current (MVP) | Target (Scaled) |
|------|---------------|-----------------|
| Recipe submission | Automated (platform) | Automated |
| AI prompt generation | Automated (custom workflow) | Automated |
| Image generation | Manual (Midjourney) | Automated (DALL-E API) |
| Layout/design | Manual (InDesign) | Automated (InDesign + Python) |
| Quality check | Manual review | Manual review (required) |
| Send to printer | Manual upload | Automated via API |

### Time Per Book

| State | Human Time | What Human Does |
|-------|------------|-----------------|
| **Current (MVP)** | ~1 hour | Create images, layout, assemble |
| **Target (Scaled)** | ~10 minutes | Review and approve |

### Why We Built It This Way

| Decision | Rationale |
|----------|-----------|
| Manual image generation | Validating quality before committing to API provider |
| Manual InDesign layout | Proving the template works before automating |
| No API integration with Mixam | Not needed at current volume |

**The principle:** Don't automate until you've validated. We know exactly what to automate and how — we're sequencing investments based on volume needs.

### Automation Roadmap

| Milestone | Trigger | Investment |
|-----------|---------|------------|
| AI image automation | After Kickstarter (100 books) | Switch to DALL-E API |
| InDesign automation | After 200 books | Python scripts for InDesign |
| Printer API integration | After 500 books | Direct Mixam API |
| Full automation | After 1,000 books | End-to-end pipeline |

---

## 4. Unit Economics

### Cost Structure Per Book

| Cost Item | Tier 1 | Tier 2 | Tier 3 | Notes |
|-----------|--------|--------|--------|-------|
| | (1 Premium) | (1P + 2C) | (1P + 5C) | |
| **Printing - Premium** | $58* | $58* | $58* | *Placeholder: 2x Classic |
| **Printing - Classic** | — | $57 | $124 | Confirmed pricing |
| **AI Images** | $4 | $4 | $4 | ~50 images × $0.08 |
| **Labor (Target)** | $5 | $5 | $5 | ~10 min QA @ $30/hr |
| **COGS Total** | **~$67** | **~$124** | **~$191** | |

*Note: Premium book cost is estimated at 2x Classic. To be confirmed with Mixam.*

### Margin Analysis

| Tier | Price | COGS | Gross Profit | Gross Margin |
|------|-------|------|--------------|--------------|
| Tier 1 | $149 | $67 | $82 | **55%** |
| Tier 2 | $279 | $124 | $155 | **56%** |
| Tier 3 | $449 | $191 | $258 | **57%** |
| **Blended** | ~$280 | ~$115 | ~$165 | **~56%** |

### Margin Improvement Opportunities

| Opportunity | Potential Impact | Timeline |
|-------------|------------------|----------|
| Volume pricing with Mixam | 10-15% COGS reduction | Year 2 |
| Optimized AI usage | Minimal (already low) | Ongoing |
| Reduced QA time with better automation | 5-10% labor reduction | Year 2 |
| **Potential margin at scale** | | **60-65%** |

### What's NOT in COGS

| Item | Who Pays | Notes |
|------|----------|-------|
| Shipping | Customer | Added at checkout |
| Premium packaging | Future upsell | Not currently offered |
| Platform/hosting | Fixed cost | Not allocated per unit |

---

## 5. Key Partners & Dependencies

### Mixam (Printing Partner)

| Aspect | Current State | Risk Level |
|--------|---------------|------------|
| Relationship | Transactional (no contract) | Medium |
| Quality | Consistent so far | Low |
| Capacity | Sufficient for our volume | Low |
| Pricing | Standard (no volume discount yet) | Medium |
| Backup | None identified | **High** |

**Mitigation plan:**
- Identify 1-2 backup printers before scaling
- Negotiate volume agreement after Kickstarter
- Maintain quality samples for comparison

### AI Provider (Future: OpenAI/DALL-E)

| Aspect | Assessment | Risk Level |
|--------|------------|------------|
| API reliability | High (OpenAI is stable) | Low |
| Cost predictability | High ($0.04-0.08/image) | Low |
| Quality | High for food imagery | Low |
| Dependency | Can switch providers | Low |

### Technology Stack

| Component | Current | Risk |
|-----------|---------|------|
| Platform | Custom (Next.js/Supabase) | Low — we control it |
| Design | InDesign | Low — industry standard |
| Automation | Python scripts (planned) | Low — proven approach |

---

## 6. Scalability Analysis

### Volume Scenarios

| Scenario | Books/Month | Human Hours/Month | Feasible with Current Setup? |
|----------|-------------|-------------------|------------------------------|
| Current | 1-5 | 5-10 hrs | ✅ Yes |
| Post-Kickstarter | 10-20 | 10-20 hrs | ✅ Yes (stretch) |
| Year 1 Target | 40-50 | 40-50 hrs | ⚠️ Needs automation |
| Year 2 Target | 150-200 | 25-35 hrs (automated) | ✅ With automation |
| Year 3 Target | 500+ | 80-100 hrs (automated) | ⚠️ Needs part-time hire |

### Automation Thresholds

| Volume | Required Investment |
|--------|---------------------|
| <50 books/month | Manual processes acceptable |
| 50-200 books/month | Must automate image + layout |
| 200-500 books/month | Must automate printer integration |
| 500+ books/month | Need dedicated ops person (part-time) |

### What Scales Naturally

| Component | Why It Scales |
|-----------|---------------|
| Recipe collection platform | Software — zero marginal cost |
| AI image generation | API — pay per use |
| Printing | Mixam handles volume |
| Shipping | Mixam handles fulfillment |

### What Needs Investment to Scale

| Component | Investment Needed | When |
|-----------|-------------------|------|
| Layout automation | Engineering time | After 100 books |
| Quality assurance process | Documented process + training | After 200 books |
| Operations hire | Part-time ops person | After 500 books |

---

## 7. Quality Control

### Current QC Process

| Checkpoint | What We Check | When |
|------------|---------------|------|
| Recipe submission | Completeness, readability | On submission |
| AI images | Quality, appropriateness | After generation |
| Final layout | Spelling, formatting, alignment | Before sending to print |
| Print proof | Overall quality (spot check) | First books from Mixam |

### Quality Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Typos in recipes | Medium | Low | Automated spell-check + human review |
| Bad AI image | Low | Medium | Human review before inclusion |
| Print quality issue | Low | High | Maintain Mixam relationship, samples |
| Wrong book shipped | Very Low | High | Clear labeling, verification process |

---

## 8. Operational Risks

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Mixam quality/reliability** | Low | High | Identify backup printer |
| **AI API changes/costs** | Low | Medium | Multiple provider options exist |
| **Manual process bottleneck** | Medium | Medium | Automation roadmap in place |
| **Founder dependency** | High | High | Document processes, hire ops help at scale |
| **Peak season overload** | Medium | Medium | Wedding seasonality — plan capacity |

### Seasonality Consideration

Wedding industry is seasonal:

| Period | % of Weddings | Operational Implication |
|--------|---------------|-------------------------|
| May - October | ~60% | Higher volume, plan capacity |
| November - April | ~40% | Lower volume, catch up on automation |

---

## 9. Summary

### Operations at a Glance

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| **Model** | Software + design, outsource printing | Same (asset-light) |
| **Human time per book** | ~1 hour | ~10 minutes |
| **COGS** | ~$115 (blended) | ~$100 (with volume pricing) |
| **Gross margin** | ~56% | ~60-65% |
| **Key dependency** | Mixam | Diversified printer options |
| **Bottleneck** | Manual processes | Automation eliminates |

### Key Messages for Investors

1. **Asset-light model:** We don't own printing infrastructure — we focus on software and brand.

2. **Clear automation path:** Current manual processes are intentional (validation stage). We know exactly what to automate and when.

3. **Healthy unit economics:** ~56% gross margin today, path to 60-65% at scale.

4. **Scalable operations:** The hard parts (printing, shipping) are already outsourced. Our bottleneck (layout) has a clear automation solution.

5. **Low fixed costs:** We can operate profitably at relatively low volume while building toward scale.

---

## Items Requiring Confirmation

| Item | Current Assumption | Action Needed |
|------|-------------------|---------------|
| Premium book cost | $58 (2x Classic) | Confirm with Mixam |
| Volume pricing | 10-15% discount possible | Negotiate after Kickstarter |
| Backup printer | None identified | Research alternatives |

---

*Document Version 1.0 — Small Plates & Co.*
*Last Updated: December 2024*