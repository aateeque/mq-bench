# MQ-Bench Project Worklog

High-level progress tracker for the MQ benchmarking project. Updated when significant chunks of work are completed.

**Note**: For granular daily work logs, see `worklog.md`. This file is the executive summary.

---

## Project Goal

Benchmark message queue technologies (Google Pub/Sub, RabbitMQ, ZeroMQ, MQTT) on GKE for throughput, latency, reliability, and cost.

---

## Epics Overview

| Epic | Status | Progress |
|------|--------|----------|
| 1. Platform & Infrastructure | ✅ Done | GKE, Pulumi, CI/CD complete |
| 2. GCP Pub/Sub Benchmarking | ✅ Done | Publisher, Pull/Push subscribers, concurrent mode |
| 3. Observability (Datadog) | 🟡 In Progress | DogStatsD integrated, dashboards created (PR #12) |
| 4. RabbitMQ Benchmarking | ⬜ Not Started | - |
| 5. ZeroMQ Benchmarking | ⬜ Not Started | - |
| 6. MQTT Benchmarking | ⬜ Not Started | - |
| 7. Cost Analysis | ⬜ Not Started | - |
| 8. Final Report | ⬜ Not Started | - |

---

## Epic Details

### Epic 1: Platform & Infrastructure ✅

**Goal**: Set up GKE cluster, CI/CD, and IaC foundation for all benchmarks.

| Milestone | Date | Notes |
|-----------|------|-------|
| Pulumi IaC setup | Dec 2025 | TypeScript, 49 GCP resources |
| GKE Autopilot cluster | Dec 2025 | Auto-scaling, workload identity |
| Artifact Registry | Dec 2025 | Docker image storage |
| GitHub Actions CI/CD | Jan 2026 | Build, test, benchmark workflows |
| Workload Identity Federation | Jan 2026 | Keyless auth for GHA |

---

### Epic 2: GCP Pub/Sub Benchmarking ✅

**Goal**: Complete benchmark suite for Google Cloud Pub/Sub.

| Milestone | Date | Notes |
|-----------|------|-------|
| Publisher app | Jan 2026 | BenchmarkDotNet, DogStatsD metrics |
| Pull Subscriber | Jan 2026 | Streaming pull, latency tracking |
| Push Subscriber | Jan 2026 | HTTP endpoint, load balancer |
| Concurrent benchmark mode | Jan 2, 2026 | PR #11 - Fixed latency measurement (P50: 15ms vs 84s) |
| Stress test profiles | Jan 3, 2026 | 10K/100K/1M/10M message profiles |
| Message tracking | Jan 3, 2026 | Lock-free loss detection |
| Dead letter queue | Jan 3, 2026 | 5 retry attempts, DLQ subscription |

**Benchmark Results** (Jan 2, 2026):
- Publisher: ~620 msg/s, P50 latency 16ms
- Subscriber: ~610 msg/s, true E2E P50 15.37ms
- Zero message loss at 100K messages

---

### Epic 3: Observability (Datadog) 🟡

**Goal**: Full metrics pipeline and visualization for all benchmarks.

| Milestone | Date | Notes |
|-----------|------|-------|
| DogStatsD integration | Jan 3, 2026 | All 3 apps emit metrics |
| Datadog dashboards | Jan 13, 2026 | 4 dashboards (Overview, Latency, Throughput, Reliability) - PR #12 |
| Deploy dashboards | ⬜ Pending | `pulumi config set datadogDashboards true && pulumi up` |
| Fix API permissions | ⬜ Pending | 403 errors on metrics/logs queries |

---

### Epic 4: RabbitMQ Benchmarking ⬜

**Goal**: Benchmark RabbitMQ on GKE with comparable metrics to Pub/Sub.

| Milestone | Date | Notes |
|-----------|------|-------|
| RabbitMQ GKE deployment | - | CloudAMQP or self-hosted |
| Publisher app | - | - |
| Consumer app | - | - |
| Benchmark runs | - | - |

---

### Epic 5: ZeroMQ Benchmarking ⬜

**Goal**: Benchmark ZeroMQ patterns (PUB/SUB, PUSH/PULL) on GKE.

| Milestone | Date | Notes |
|-----------|------|-------|
| ZeroMQ broker setup | - | Likely brokerless |
| Publisher app | - | - |
| Subscriber app | - | - |
| Benchmark runs | - | - |

---

### Epic 6: MQTT Benchmarking ⬜

**Goal**: Benchmark MQTT broker (likely Mosquitto or HiveMQ) on GKE.

| Milestone | Date | Notes |
|-----------|------|-------|
| MQTT broker deployment | - | - |
| Publisher app | - | - |
| Subscriber app | - | - |
| Benchmark runs | - | - |

---

### Epic 7: Cost Analysis ⬜

**Goal**: Track and compare costs across all MQ technologies.

| Milestone | Date | Notes |
|-----------|------|-------|
| Cost tracking tooling | - | GCP billing exports, BigQuery |
| Per-message cost analysis | - | - |
| Cost comparison report | - | - |

---

### Epic 8: Final Report ⬜

**Goal**: Comprehensive comparison report with recommendations.

| Milestone | Date | Notes |
|-----------|------|-------|
| Throughput comparison | - | - |
| Latency comparison | - | - |
| Reliability comparison | - | - |
| Cost comparison | - | - |
| Recommendations | - | - |

---

## Recent Updates

### Jan 13, 2026
- Created 4 Datadog dashboards via Pulumi (Overview, Latency, Throughput, Reliability)
- Added DogStatsD to Push Subscriber
- Enhanced benchmark workflow with DD env vars
- PR #12: Datadog dashboards (ready for merge)

### Jan 3, 2026
- Implemented stress test profiles (10K to 10M messages)
- Added message tracking for loss detection
- Wired up DLQ with 5 retry policy
- Full DogStatsD integration in Publisher and Pull Subscriber
- Committed as `dcb4594`

### Jan 2, 2026
- Implemented concurrent benchmark mode (PR #11, merged)
- Fixed latency measurement: P50 dropped from 84s to 15ms
- Validated benchmark pipeline end-to-end

---

## What's Next

1. **Immediate**: Merge PR #12, deploy Datadog dashboards, fix 403 API errors
2. **Short-term**: Pick next MQ technology (RabbitMQ recommended - most similar to Pub/Sub)
3. **Medium-term**: Complete remaining MQ benchmarks
4. **Final**: Cost analysis and comparison report

---

## Instructions for Claude

When completing significant work on this project:

1. Update the relevant Epic section with new milestones
2. Add an entry to "Recent Updates" with date and bullet points
3. Update "What's Next" if priorities change
4. Keep the Epics Overview table current with status emojis:
   - ✅ Done
   - 🟡 In Progress
   - ⬜ Not Started

For granular task tracking, continue using `worklog.md`, `tasks.md`, and `todo.md`.
