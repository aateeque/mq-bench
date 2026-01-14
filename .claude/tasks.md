# Tasks

Milestone/task breakdown with status tracking.

---

## Milestone: Add Concurrent Benchmark Mode

**Goal**: Run publisher and subscriber simultaneously to get accurate end-to-end latency measurements.

| Task | Status | Notes |
|------|--------|-------|
| Set up .claude workflow tracking files | completed | worklog.md, todo.md, tasks.md, notes.md |
| Add `concurrent` option to benchmark_type | completed | Line 11 in benchmark.yml |
| Create "Run Concurrent Benchmark" step | completed | Start subscriber first, then publisher |
| Test concurrent benchmark mode | completed | P50 latency: 15.37ms (vs 83,991ms in sequential) |

---

## Milestone: Complete Datadog Integration

**Goal**: Ensure all benchmark components send metrics to Datadog for monitoring and analysis.

| Task | Status | Notes |
|------|--------|-------|
| Add DogStatsD to Publisher | completed | Sends throughput, latency, errors |
| Add DogStatsD to Pull Subscriber | completed | Sends end-to-end latency |
| Add DogStatsD to Push Subscriber | completed | Added 2026-01-13 |
| Update benchmark.yml with DD env vars | completed | All benchmark modes now configured |
| Enhance workflow summary with DD metrics | completed | Shows tags and metric names |

---

## Milestone: Datadog Dashboards for Benchmark Visualization

**Goal**: Create comprehensive Datadog dashboards for viewing and analyzing benchmark runs.

| Task | Status | Notes |
|------|--------|-------|
| Add @pulumi/datadog dependency | completed | Added to infra/package.json |
| Create Overview Dashboard | completed | Key metrics: throughput, P99, errors, loss |
| Create Latency Dashboard | completed | Percentiles, heatmap, config breakdowns |
| Create Throughput Dashboard | completed | Message rates, data volumes, top runs |
| Create Reliability Dashboard | completed | Errors, message loss, test duration |
| Add template variables for filtering | completed | env, service, run_id, message_size, concurrency |
| Integrate into index.ts | completed | Optional via `datadogDashboards` config |
| Export dashboard URLs | completed | For easy access after deployment |

---

## Milestone: GCP Pub/Sub Benchmarking (DONE)

| Task | Status | Notes |
|------|--------|-------|
| Create Pulumi infrastructure | completed | 49 resources deployed |
| Build Publisher app | completed | With BenchmarkDotNet |
| Build Pull Subscriber app | completed | Streaming pull |
| Build Push Subscriber app | completed | HTTP endpoint |
| Set up CI/CD pipelines | completed | GitHub Actions |
| Run initial benchmarks | completed | Jan 1-2, 2026 |
