# Architecture

StagePin starts as a modular monolith. A React Native client calls a Spring Boot
REST API. PostgreSQL stores relational data and venue coordinates, while scheduled jobs
in the API will later dispatch ticket-sale reminders through Expo Push Service.

```text
React Native (Expo)
        |
        | HTTPS / JSON
        v
Spring Boot API -----> Expo Push Service
        |
        v
PostgreSQL
```

This keeps the first deployment small while retaining clear module boundaries
for concerts, artists, venues, schedules, notifications, and personal logs.
