#system-design #hld #security

# Security Architecture — What to Mention in Every Design

## Intuition (30 sec)

Security isn't a feature you add later — it's architecture you design in from the start. Mentioning security in system design interviews shows production awareness.

---

## The Security Layers

```
Internet → WAF/DDoS Protection → API Gateway (Auth + Rate Limit) → Service (AuthZ) → Database (Encryption)
```

### Layer 1: Network Security
- **WAF (Web Application Firewall):** Block SQL injection, XSS at the edge (Cloudflare, AWS WAF)
- **DDoS protection:** Rate limiting at CDN/edge level
- **TLS everywhere:** HTTPS for external, mTLS for service-to-service
- **VPC/Private networks:** Services not exposed to public internet

### Layer 2: Authentication (Who are you?)

| Method | Use Case | How |
|--------|----------|-----|
| **JWT** | Stateless API auth | Token contains user info, verified by signature |
| **OAuth 2.0** | Third-party login (Google, GitHub) | Authorization code flow |
| **API Keys** | Service-to-service, developer APIs | Key in header, rate limited |
| **Session tokens** | Traditional web apps | Server-side session store (Redis) |

**JWT Flow:**
```
Login → Server verifies credentials → Issues JWT (signed)
Subsequent requests → Client sends JWT in Authorization header
Server → Verifies signature (no DB call needed) → Extracts user info from token
```

### Layer 3: Authorization (What can you do?)

**RBAC (Role-Based Access Control):**
```
Admin: read, write, delete, manage_users
Editor: read, write
Viewer: read only
```

**Check at every layer:**
- API Gateway: Is the token valid?
- Service: Does this user have permission for this action?
- Database: Row-level security (user can only see their own data)

### Layer 4: Data Security

- **Encryption at rest:** AES-256 for database, S3 (enabled by default in most cloud providers)
- **Encryption in transit:** TLS 1.3 for all communication
- **Sensitive data:** Hash passwords (bcrypt), encrypt PII, mask in logs
- **Secrets management:** Never hardcode. Use Vault, AWS Secrets Manager, or environment variables

### Layer 5: Input Validation

- **SQL Injection:** Use parameterized queries (never string concatenation)
- **XSS:** Sanitize output, Content Security Policy headers
- **CSRF:** Anti-CSRF tokens for forms
- **Rate limiting:** Prevent brute force ([[02_building_blocks/rate_limiter]])

---

## What to Mention in Interviews

When presenting any HLD, end with a 30-second security summary:

> "For security: authentication via JWT at the API gateway, role-based authorization per service, TLS for all communication, encryption at rest for the database, rate limiting to prevent abuse, and input validation to prevent injection attacks."

This one sentence shows you think about production systems, not just happy-path designs.

## Links

- [[../02_building_blocks/rate_limiter]] — Rate limiting
- [[../02_building_blocks/api_gateway]] — Auth at the gateway
- [[interviewer_pressure_moves]] — "What about security?" response
