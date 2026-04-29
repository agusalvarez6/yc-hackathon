# Lyra AI — Information Security Policy v4

Lyra AI maintains a comprehensive information security program owned by Marcus Rivera, Head of Security and Compliance. The program is reviewed quarterly and audited annually against ISO 27001 and SOC 2 Trust Services Criteria.

All customer data is encrypted at rest using AES-256 and in transit using TLS 1.3. Production secrets are stored in HashiCorp Vault and rotated every 90 days. Access to production systems requires hardware-key two-factor authentication and is logged to an immutable audit stream retained for seven years. Lyra enforces least-privilege access and reviews entitlements every quarter.

Data handling controls include strict tenant isolation, customer-managed encryption keys for regulated workloads, and configurable data residency in US, EU, and Canada regions. Personal data is never used to train shared models; tenant prompt and completion logs are isolated, opt-in, and purged on a 30-day default.

Incident response procedures align with NIST SP 800-61. Lyra commits to a four-hour customer notification SLA for confirmed incidents involving customer data, and runs tabletop exercises every six months.
