# macekai
Master AI without losing your humanity

For leaders, professionals, and mission-driven people who want to use AI with clarity, confidence, and purpose.

AI should serve your mission, not overwhelm you with hype, tools, and noise.

Book a session with me

You know AI matters. You just do not know where to start.

Maybe you lead a small company. Maybe you work in education, ministry, industry, or another professional field. Maybe you are ambitious and want to grow, but the AI world feels chaotic, overhyped, and hard to trust.

You do not want to feel left behind. But you also do not want to become dependent on empty buzzwords, shallow shortcuts, or tools that do not fit who you are.

You want to understand AI in a way that strengthens your work, supports your mission, and preserves your personality.

AI should be your servant, not your master

Right now, many people feel confused by too many tools, sceptical about what is real and useful, afraid of looking foolish, anxious about missing the moment, and concerned that technology is moving faster than their ability to respond.

That tension is real.

You should not have to choose between staying relevant and staying human.

A guide with depth, clarity, and real-world experience

I help people enter the world of AI in a practical, thoughtful, and human way.

I bring a PhD in Mathematics, a Master’s in AI, more than 17 years of industry experience, experience both as an individual contributor and a leader, certification as a coach, and the mindset of a careful listener, teacher, and father.

That means I do not just explain AI technically. I help you understand how to use it wisely, calmly, and in a way that fits your real life and real mission.

How we work together

Tell me

You share your mission, context, questions, and concerns.

Let me get prepared

I assess your situation and identify the most relevant AI opportunities for you.

Co-create

Together, we explore practical ways AI can support your work without distorting your values or voice.

Observe benefits

You begin to see what actually helps, what saves time, and what creates value.

Iterate

We refine the approach step by step, building confidence and long-term capability.

What changes after working together

Instead of feeling overwhelmed, you feel clear.

Instead of fearing AI, you begin to direct it.

Instead of drowning in buzzwords, you use the right tools with intention.

You begin to sense that AI is obeying you like a reliable servant, supporting your mission rather than distracting you from it.

What is at stake

If you do nothing, the risk is not only confusion.

It is falling behind. Getting lost in noise. Watching your career, leadership, or business lose ground while others learn how to move.

You do not need to panic. But you do need a wise place to begin.

Book a session

If you want a calm, intelligent, and human-centered way into AI, let’s start there.

Book a session with me

---

## GA4 Analytics Reference

Measurement ID: `G-33Y5LRRR92` — configured in the `<head>` of `index.html`, do not hardcode it elsewhere.

### Section view events

Each event fires at most once per page load, via `IntersectionObserver`.
Threshold: 50% of the section visible. For sections taller than the viewport the threshold auto-scales to 80% of the maximum achievable ratio (minimum 10%).

| Event | Section | CSS selector |
|---|---|---|
| `hero_section_view` | Hero | `.hero` |
| `problem_section_view` | "High ability has a hidden cost" | `.problem` |
| `offer_section_view` | 3-Session Clarity Sprint card | `.offer-main` |
| `pricing_section_view` | 12-Session Next Chapter card | `.offer-secondary` |
| `how_it_works_section_view` | How it works | `.how` |
| `after_pricing_section_view` | First section after pricing (same element as above) | `.how` |
| `credibility_section_view` | Why this works | `.credibility` |
| `testimonials_section_view` | What people say | `.proof` |
| `final_cta_section_view` | "Not sure if this is for you?" CTA block | `.final-cta` |
| `faq_section_view` | FAQ | `.faq` |

Parameters sent with every section event:

| Parameter | Example |
|---|---|
| `section` | `hero`, `problem`, `how_it_works`, `after_pricing`, … |

> `after_pricing_section_view` and `how_it_works_section_view` fire from the same element (`.how`). `after_pricing_section_view` answers the specific question: did the visitor continue scrolling past the pricing cards?

---

### CTA click events

**`calendly_click`** — fires on every click of `[data-track="calendly"]`.

**`cta_click`** — fires on the same click when the element also has `data-cta="true"`. All Calendly buttons carry both attributes, so one click fires both events exactly once each.

Parameters for both events:

| Parameter | Description | Example |
|---|---|---|
| `cta_location` | Where on the page the CTA sits | see table below |
| `cta_text` | Visible button label | `"Book a free orientation call"` |
| `cta_href` | Destination URL | Calendly URL |

CTA location values:

| `cta_location` | Element |
|---|---|
| `nav` | "Book a free call" in the sticky nav |
| `hero` | Hero section button |
| `offer` | Button inside the 3-Session Clarity Sprint card |
| `pricing` | Button inside the 12-Session Next Chapter card |
| `final` | Button in the "Not sure if this is for you?" section |
| `after_faq` | Repeat CTA between FAQ and Values sections |
| `footer` | Repeat CTA at the very bottom of the page |

---

### Other click events

| Event | Trigger | Parameters |
|---|---|---|
| `email_click` | `[data-track="email"]` click | `location`, `link_url`, `link_text` |
| `linkedin_click` | `[data-track="linkedin"]` click | `location`, `link_url`, `link_text` |

---

### Adding a new CTA

```html
<!-- Calendly CTA — fires calendly_click + cta_click -->
<a href="https://calendly.com/…"
   data-track="calendly"
   data-track-location="<location>"
   data-cta="true">Button label</a>

<!-- Email link — fires email_click only -->
<a href="mailto:…"
   data-track="email"
   data-track-location="<location>">Email address</a>
```

---

### Debug mode

Analytics events are logged to the browser console when:

- Running on **localhost** / `127.0.0.1`
- The URL contains **`?analytics_debug=1`** (works on production too)

Console format:
```
[analytics] hero_section_view { section: ‘hero’, page_path: ‘/’ }
[analytics] calendly_click { cta_location: ‘hero’, cta_text: ‘Book a free orientation call’, cta_href: ‘https://…’ }
```

---

### Testing in GA4 DebugView

1. Install the [Google Analytics Debugger](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension and activate it.
2. Open the live site — the extension puts the session into debug mode automatically.
3. In GA4: **Admin → DebugView** — events appear in real time as you scroll and click.

Scroll funnel test checklist:
- [ ] `hero_section_view` fires on page load (hero is above the fold)
- [ ] `problem_section_view` fires as you scroll past the hero
- [ ] `offer_section_view` and `pricing_section_view` fire when the offer cards become visible
- [ ] `how_it_works_section_view` and `after_pricing_section_view` both fire when How It Works enters view
- [ ] `credibility_section_view`, `testimonials_section_view`, `final_cta_section_view`, `faq_section_view` fire in order
- [ ] No section event fires more than once per page load (reload to reset)
- [ ] Clicking any Calendly button fires `calendly_click` + `cta_click` with the correct `cta_location`

---

### UTM campaign links

For use in external channels only — do not publish on the site itself.

| Channel | URL |
|---|---|
| LinkedIn profile | `https://macek.ai/?utm_source=linkedin&utm_medium=profile&utm_campaign=personal_profile` |
| LinkedIn warm DM | `https://macek.ai/?utm_source=linkedin&utm_medium=dm&utm_campaign=warm_outreach` |
| LinkedIn thought leadership | `https://macek.ai/?utm_source=linkedin&utm_medium=comment&utm_campaign=thought_leadership` |
