# Notes

Learnings, observations, and things to remember.

---

## 2026-01-02

### Benchmark Architecture Insight

The current latency measurement is already correct in the C# code - `MetricsCollector.cs` uses HdrHistogram and the subscriber calculates true end-to-end latency by extracting the publisher's timestamp from the message:

```csharp
var publishTime = new DateTime(message.TimestampTicks, DateTimeKind.Utc);
var latency = DateTime.UtcNow - publishTime;
```

The problem is purely orchestration - the workflow runs publisher THEN subscriber sequentially.

### Pub/Sub Performance Observations

From Jan 1-2 benchmark runs:

- Publisher throughput: ~550-590 msg/s at 1KB message size, concurrency 10
- Publisher latency (to Pub/Sub): P50 ~16ms, P99 ~30ms
- Pull subscriber can drain backlog at ~2,550 msg/s (4.6x faster than publishing)
- Push subscriber not yet properly benchmarked

### Datadog Integration

Pods have Datadog tags configured but MCP returns 403 errors - API key likely needs read permissions for logs/metrics endpoints.
