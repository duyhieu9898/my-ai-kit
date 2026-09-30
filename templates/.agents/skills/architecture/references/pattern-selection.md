# Pattern Selection

Read this when the decision is about a structural pattern (service split,
data access layer, domain model, events, CQRS). Each pattern below earns its
cost only when its condition holds; otherwise take the simpler default.

## Conditions before adding a pattern

| Pattern | Adopt only when | Simpler default |
|---|---|---|
| Microservices | Clear domain boundaries, separate teams owning them, and components that must scale or deploy independently. All three. | Modular monolith with enforced module boundaries; extract a service later |
| Event-driven / message queue | Work can be eventually consistent, and producers must not wait for or know about consumers | Direct call, or a background job table |
| Event sourcing | The history of changes is itself a product requirement (audit, replay, temporal queries) | Append-only audit log next to normal tables |
| CQRS | Read and write models diverge in shape or load enough that one model hurts both | One model, plus read-optimised views or indexes |
| Saga | A business transaction spans services with separate databases | Keep the steps in one database transaction |
| Repository + unit of work | Several data sources, or domain logic that must be tested without the database | ORM or query builder used directly in a service layer |
| Full DDD (aggregates, value objects) | Complex, changing business rules and access to people who own them | Rich entities with clear module boundaries |
| Hexagonal / clean layers | Several real adapters for one port (e.g. two payment providers) exist or are committed | Concrete code first; extract the interface when the second adapter arrives |

## Questions for any pattern

1. What specific problem in this codebase does it solve today?
2. What is the simplest option that solves the same problem?
3. What does it cost to add later instead of now? If adding later is cheap,
   defer it.

## Red flags in a proposal

- The justification is future scale with no current measurement.
- The team is smaller than the number of proposed services.
- Two "independent" services share a database or must deploy together.
- An abstraction has exactly one implementation and no committed second one.
- Consistency requirements were not stated, so eventual consistency was
  assumed.
