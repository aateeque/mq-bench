# Worklog

Rolling log of completed work units.

---

## 2026-01-02

### Analyzed benchmark results from Jan 1 run (~30 min)
- Reviewed GitHub Actions run #20642160841
- Found publisher achieved 591.58 msg/s with P50 latency 16ms
- Identified pull subscriber latency issue: P95 was 24,353ms due to sequential execution
- Root cause: subscriber ran AFTER publisher, so messages queued for ~30 seconds before consumption

### Triggered and monitored new benchmark run (~15 min)
- Ran benchmark workflow #20661872422
- Publisher: 553.73 msg/s, P50 16.49ms, 0 errors
- Pull subscriber: 2,550.32 msg/s throughput, but P50 latency 83,991ms (queue wait time)
- Confirmed need for concurrent execution mode

### Explored codebase for concurrent mode planning (~20 min)
- Analyzed MetricsCollector.cs - uses HdrHistogram, already calculates true end-to-end latency
- Reviewed PullSubscriberService.cs - extracts publisher timestamp for latency calculation
- Confirmed no C# changes needed, fix is workflow-only
