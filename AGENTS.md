# Urban Air Quality Assistant - Engineering Standards & Workspace Rules

These engineering standards and guidelines are strictly enforced for all tasks, contributions, and code generated in this repository.

---

## 1. CODE READABILITY & ARCHITECTURE

- **Strict TypeScript**:
  - Always use TypeScript in strict mode (`"strict": true`).
  - Never use `any` or `unknown` without proper narrowing; always define explicit, strongly-typed interfaces and types for props, state, API contracts, and domain models.
- **Modularity & Single Responsibility**:
  - Keep functions small, focused, and single-responsibility.
  - Structure business logic, helpers, and API clients modularly under `src/lib/`.
  - Maintain reusable, composable UI components under `src/components/` (split into subdirectories like `ui/`, `features/`, etc. as the project scales).
- **Documentation**:
  - Add concise JSDoc comments for all exported functions, utility methods, custom hooks, and non-trivial logic explaining parameters, return values, and edge cases.
- **Clean Styling & Naming**:
  - Use clear, descriptive variable and function names (e.g., `fetchHourlyForecast` instead of `getData`).
  - Use clean, standard Tailwind CSS utility classes. Avoid arbitrary values unless strictly necessary; extract repeated patterns into shared component classes or atomic components.

---

## 2. SECURITY STANDARDS

- **API Key & Secret Protection**:
  - Never expose `GEMINI_API_KEY` or any backend secrets to client-side code.
  - The `NEXT_PUBLIC_` prefix must **NEVER** be used for API keys, tokens, or private credentials. All secret access must occur strictly within server-side environments (Server Components, Route Handlers, or Server Actions).
- **Payload Validation & Sanitization**:
  - Validate and sanitize **ALL** incoming API request payloads (body, query parameters, route segments) using `zod` schemas before processing.
  - Reject invalid or malformed inputs immediately with descriptive, sanitized error responses (HTTP 400).
- **Rate Limiting**:
  - Enforce server-side IP-based rate limiting on all `/api/*` routes to protect backend infrastructure and third-party API quotas from abuse.
- **Prompt Injection Defense**:
  - Protect LLM calls against prompt injection by wrapping user inputs within explicit XML delimiters (e.g., `<user_query>...</user_query>`).
  - Enforce strict system instructions and negative constraints to ensure user input cannot override core assistant rules, instructions, or role definition.
- **HTTP Security Headers**:
  - Configure robust HTTP security headers in `next.config.ts`, including:
    - Content Security Policy (`Content-Security-Policy`)
    - MIME type sniffing prevention (`X-Content-Type-Options: nosniff`)
    - Clickjacking protection (`X-Frame-Options: DENY`)
    - Referrer policy (`Referrer-Policy: strict-origin-when-cross-origin`)
    - Permission policy (`Permissions-Policy`)

---

## 3. EFFICIENCY & PERFORMANCE

- **Server-Side In-Memory TTL Caching**:
  - Implement server-side in-memory caching with Time-To-Live (TTL) for external AQI and geocoding API calls.
  - Minimize external network latency, avoid redundant round-trips, and respect third-party rate limits.
- **Client Performance & Rendering**:
  - Debounce search inputs, autocomplete fields, and slider controls to avoid unnecessary network requests and React re-renders.
  - Memoize expensive calculations with `useMemo` and callbacks with `useCallback` where appropriate.
  - Avoid unnecessary re-rendering across component trees by structuring state close to where it is consumed.
- **Lightweight Client Bundles**:
  - Keep client bundle sizes minimal.
  - Perform all AI model interactions, data parsing, and third-party API requests on the server.
  - Favor React Server Components (RSC) where possible and only mark interactive leaf components with `'use client'`.

---

## 4. PROBLEM STATEMENT ALIGNMENT

Every feature, screen, and prompt in this application must directly serve families and communities navigating severe winter smog and urban air pollution:

1. **Low-Emission Daily Routines Timed to Real Hourly PM2.5 Forecasts**:
   - Deliver actionable scheduling suggestions (e.g., optimal times for ventilation, outdoor commutes, exercise, or school travel) based on real-time and predicted hourly PM2.5 and AQI levels.
2. **Practical, Budget-Friendly Indoor Air Quality (IAQ) Hacks**:
   - Provide accessible, low-cost DIY and budget-conscious mitigation strategies (e.g., DIY Corsi-Rosenthal boxes, wet mopping, door/window draft sealing, indoor plant placement realities vs. mechanical filtration).
3. **Tailored Sustainable Lifestyle Alternatives**:
   - Recommend contextual lifestyle shifts based on household profile (e.g., presence of infants, asthmatic members, elderly relatives) and geographic microclimate.
4. **Transparent Health & Emission Impact Explanations**:
   - Clearly communicate the direct health implications (respiratory, cardiovascular) and community-level emission reduction impact of each choice with transparent, evidence-backed explanations.
