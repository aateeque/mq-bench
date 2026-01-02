# Tasks

Milestone/task breakdown with status tracking.

---

## Milestone: Add Concurrent Benchmark Mode

**Goal**: Run publisher and subscriber simultaneously to get accurate end-to-end latency measurements.

| Task | Status | Notes |
|------|--------|-------|
| Set up .claude workflow tracking files | completed | worklog.md, todo.md, tasks.md, notes.md |
| Add `concurrent` option to benchmark_type | in progress | Line 11 in benchmark.yml |
| Create "Run Concurrent Benchmark" step | not started | Start subscriber first, then publisher |
| Test concurrent benchmark mode | not started | Run via workflow_dispatch |

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
