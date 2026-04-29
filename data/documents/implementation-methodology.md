# Lyra AI — Implementation Methodology

Lyra AI's implementation methodology is owned by Jake Nakamura, Implementation Lead, and is structured in three phases: discovery, integration, and rollout. Typical enterprise deployments complete in four to six months end-to-end, with a dedicated Lyra delivery team paired against a customer steering committee that meets every two weeks.

Discovery runs four to six weeks. Lyra interviews stakeholders, observes existing workflows, and produces a written design document covering target use cases, success metrics, data and identity requirements, and the policy boundary between automated and human-reviewed actions. Discovery exits with an executive sign-off and a clear scope statement that controls all downstream work.

Integration runs six to twelve weeks and covers source system connectors, identity and access plumbing, data pipelines, the policy engine configuration, and an internal pilot in a non-production tenant. Lyra requires customer-side technical owners for each upstream system and uses a shared backlog with weekly burn-down reviews.

Rollout runs four to eight weeks and follows a canary pattern: a small population of users, then a department, then full production, with explicit go and no-go gates between stages. Each gate has documented acceptance criteria, an executive approver, and a written runbook for rollback.
