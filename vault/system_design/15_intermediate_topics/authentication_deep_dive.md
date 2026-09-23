#system-design #intermediate #security #auth

# Authentication & Authorization Deep Dive

> Every system has auth. Knowing JWT, OAuth2, and session management at intermediate level is expected.

---

## JWT (JSON Web Token)

### Structure
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMjN9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  │                      │                         │
  Header                 Payload                    Signature
  (algorithm)            (claims: user data)        (HMAC/RSA verify)
```

### How JWT Auth Works
```
1. User logs in: POST /login { email, password }
2. Server verifies credentials against DB
3. Server creates JWT: sign({ user_id: 123, role: "admin", exp: 1hr }, SECRET_KEY)
4. Server returns JWT to client
5. Client stores JWT (localStorage or httpOnly cookie)
6. Every request: Authorization: Bearer <jwt>
7. Server verifies signature → extracts user_id → no DB call needed!
```

### Java Implementation (Spring Security)

```java
// Generate JWT
public String generateToken(User user) {
    return Jwts.builder()
        .setSubject(user.getId())
        .claim("role", user.getRole())
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + 3600000)) // 1 hour
        .signWith(SignatureAlgorithm.HS256, secretKey)
        .compact();
}

// Verify JWT (in filter)
public Claims validateToken(String token) {
    return Jwts.parser()
        .setSigningKey(secretKey)
        .parseClaimsJws(token)
        .getBody();
}
```

### JWT vs Session Tokens

| | JWT | Session Token |
|--|-----|---------------|
| **Storage** | Client-side (no server state) | Server-side (Redis/DB) |
| **Scalability** | Excellent (stateless, any server can verify) | Need shared session store |
| **Revocation** | Hard (token valid until expiry) | Easy (delete from store) |
| **Size** | Larger (~500 bytes) | Small (~32 bytes UUID) |
| **Best for** | Microservices, APIs | Monoliths, web apps needing instant revocation |

---

## OAuth 2.0 (Third-Party Login)

"Login with Google" flow:

```mermaid
sequenceDiagram
    User->>Your App: Click "Login with Google"
    Your App->>Google: Redirect to Google auth page
    Google->>User: "Allow MyApp to access your profile?"
    User->>Google: Allow
    Google->>Your App: Redirect with authorization_code
    Your App->>Google: Exchange code for access_token (server-to-server)
    Google-->>Your App: access_token + id_token
    Your App->>Google: GET /userinfo with access_token
    Google-->>Your App: { name, email, picture }
    Your App->>Your App: Create/find user, issue YOUR JWT
    Your App-->>User: Logged in!
```

### OAuth Roles
| Role | Who |
|------|-----|
| **Resource Owner** | The user |
| **Client** | Your application |
| **Authorization Server** | Google, GitHub, Facebook |
| **Resource Server** | Google's API (userinfo) |

---

## Refresh Tokens

Access tokens expire (1 hour). Refresh tokens get new access tokens without re-login:

```
Login → access_token (1hr) + refresh_token (30 days)

API call → send access_token
Token expired? → POST /token/refresh { refresh_token }
                → new access_token (1hr)

Refresh token expired? → User must log in again
```

**Security:** Store refresh tokens in httpOnly cookies (not localStorage). Rotate refresh tokens on each use (detect theft).

---

## Role-Based Access Control (RBAC)

```java
// Spring Security annotation-based authorization
@RestController
public class AdminController {

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable String id) {
        userService.delete(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @PutMapping("/posts/{id}/approve")
    public void approvePost(@PathVariable String id) {
        postService.approve(id);
    }

    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    @GetMapping("/users/{userId}/orders")
    public List<Order> getUserOrders(@PathVariable String userId) {
        return orderService.findByUser(userId);
    }
}
```

---

## What to Say in Interviews

> "Authentication at the API gateway using JWT — stateless, each service can verify independently. OAuth2 for third-party login. Role-based authorization checked per endpoint. Refresh tokens stored in httpOnly cookies for security. Access tokens have 1-hour expiry to limit damage from token theft."

## Links

- [[../10_hld/security_architecture]] — Full security checklist
- [[../02_building_blocks/api_gateway]] — Auth at the gateway
- [[../02_building_blocks/caching]] — Redis for session storage
