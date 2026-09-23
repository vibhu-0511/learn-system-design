#system-design #interview #faang

# FAANG / MAANG — Interview Preparation

---

## How FAANG Interviews Differ from Indian Companies

| Aspect | FAANG | Indian Product |
|--------|-------|---------------|
| **HLD depth** | Very deep, open-ended | Moderate, more structured |
| **LLD** | Less common (Google/Meta rarely ask) | Very common (Flipkart, Swiggy always ask) |
| **DSA weight** | 50-60% of evaluation | 30-40% |
| **System design weight** | 30-40% (senior roles: 50%+) | 30-40% |
| **Language** | Any (Python, Java, C++) | Java strongly preferred |
| **Scale** | Global scale (billions of users) | India-scale (millions) |
| **Communication** | Extremely important | Important |

---

## Company-Specific Focus

### Google
- **Rounds:** 4-5 (2 coding, 1-2 system design, 1 Googleyness)
- **HLD style:** Very open-ended. "Design Gmail." No hints. You drive.
- **What impresses:** Quantitative estimation, mentioning Google-specific tech (Bigtable, Spanner, Colossus)
- **Likely questions:** Design Google Maps, Design YouTube, Design Google Drive, Design web crawler

### Amazon
- **Rounds:** 4-5 (2 coding, 1-2 system design, Leadership Principles throughout)
- **HLD style:** Scale-focused. "How does this handle 1B requests?"
- **What impresses:** Mentioning AWS services by name, scalability focus, operational excellence
- **Likely questions:** Design Amazon shopping cart, Design S3, Design Kindle, Design ad click aggregation
- **Key:** Every answer must tie back to Leadership Principles

### Meta (Facebook)
- **Rounds:** 2 coding + 1 system design + 1 behavioral
- **HLD style:** Product-focused. "Design News Feed" (they literally built it)
- **What impresses:** Product thinking, understanding social graph, real-time features
- **Likely questions:** Design Facebook News Feed, Design Instagram, Design Messenger, Design live video

### Apple
- **Rounds:** 6-8 (including team-specific rounds)
- **HLD style:** Less standard, more domain-specific to the team
- **What impresses:** Privacy awareness, attention to user experience, on-device processing
- **Likely questions:** Varies by team. Design iMessage, Design Siri, Design App Store

### Netflix
- **Rounds:** Phone screen + 5-6 onsite
- **HLD style:** Streaming and content-focused
- **What impresses:** CDN knowledge, adaptive streaming, recommendation systems, chaos engineering
- **Likely questions:** Design Netflix streaming, Design recommendation engine, Design content delivery

### Microsoft
- **Rounds:** 4-5 (2 coding, 1 system design, 1 behavioral)
- **HLD style:** Similar to Amazon but less strict
- **Likely questions:** Design Teams, Design OneDrive, Design Azure Blob Storage

---

## FAANG System Design Framework

Same [[07_interview_framework/the_four_step_framework]] but with more emphasis on:

1. **Scale:** Always estimate QPS, storage, bandwidth. Show numbers.
2. **Trade-offs:** Explicitly state every trade-off. "We gain X but lose Y."
3. **Evolution:** Show how the system scales from 1K to 1B users.
4. **Deep dives:** Be ready to go 3 levels deep on any component.
5. **Communication:** Think out loud. Pause and ask "Does this make sense so far?"

---

## Preparation Strategy

```
Month 1: DSA fundamentals (Leetcode medium - aim for 150 problems)
Month 2: System design fundamentals (this vault: sections 01-09)
Month 3: HLD/LLD deep practice (this vault: sections 10-12)
Month 4: Company-specific prep + mock interviews
```

## Links

- [[company_question_bank]] — Known questions by company
- [[../07_interview_framework/the_four_step_framework]] — The framework
- [[../07_interview_framework/signal_moments]] — What impresses at FAANG
