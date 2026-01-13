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

### Implemented concurrent benchmark mode (~45 min)
- Added `concurrent` option to benchmark.yml workflow
- Created new step that starts subscriber first, waits for ready, then starts publisher
- Both run simultaneously for accurate end-to-end latency measurement
- Created PR #11, merged after CI passed

### Tested concurrent benchmark mode (~10 min)
- Ran workflow with `benchmark_type=concurrent`
- Results: Subscriber P50 latency = 15.37ms (vs 83,991ms in sequential mode!)
- True end-to-end latency now measured correctly
- Publisher: 621.89 msg/s, Subscriber: 609.06 msg/s (balanced throughput)

---

## 2026-01-03

### Codebase Review and Enhancement Planning (~1 hour)
- Completed comprehensive codebase review for GCP Pub/Sub benchmarking
- Identified critical gaps: DataDog metrics not connected, DLQ not wired, no durability testing
- Created detailed implementation plan with 4 phases covering 24 tasks
- User approved plan for DogStatsD integration, stress testing, durability testing, and IaC improvements

### Phase 1: DataDog DogStatsD Integration (~2 hours)
- Added DogStatsD-CSharp-Client v8.0.0 NuGet package
- Created DogStatsDExporter class with metrics: throughput, latency percentiles (P50-P99.9), error/lost counts
- Created BenchmarkRunContext for run metadata and DataDog tags
- Updated BenchmarkConfig with DD_AGENT_HOST, DD_DOGSTATSD_PORT, DD_ENABLED env vars
- Integrated DogStatsD into PublisherService and PullSubscriberService
- Updated K8s deployments (publisher.ts, pull-subscriber.ts, push-subscriber.ts) with DD env vars

### Phase 2: Stress Testing (~30 min)
- Created StressTestProfiles class with predefined profiles (small: 10K, medium: 100K, large: 1M, xlarge: 10M)
- Added STRESS_PROFILE, BURST_MODE, BURST_SIZE, BURST_INTERVAL_MS config options
- Added RunBurstBenchmarkAsync method to PublisherService for burst testing

### Phase 3: Durability & DLQ (~1 hour)
- Created MessageTracker class with lock-free ConcurrentDictionary for message loss detection
- Enhanced BenchmarkMessage with RunId and RetryCount properties
- Updated pubsub.ts: Added DLQ policy (maxDeliveryAttempts: 5) to subscriptions
- Created DLQ subscription for consuming failed messages
- Added exactly-once delivery toggle via Pulumi config
- Created DLQ publisher IAM binding for Pub/Sub service account

### Phase 4: Infrastructure & Workflow Updates (~30 min)
- Updated infra/index.ts to wire DLQ publisher binding and export DLQ resources
- Updated benchmark.yml with stress testing inputs and DD env vars for all jobs
- Verified build compiles with 0 warnings/errors

---

## 2026-01-13

### Fixed PublisherService Build Errors (~10 min)
- Added missing using statements to PublisherService.cs
- Fixed CS0246 errors for BenchmarkResults, MetricsCollector, PublisherClient, etc.
- All projects now build successfully

### Added Datadog Integration to Push Subscriber (~20 min)
- Updated PushMetricsService to include DogStatsDExporter
- Added BenchmarkConfig, BenchmarkRunContext initialization
- Added MessageTracker for reliability metrics
- Updated RecordMessage to send real-time latency to Datadog
- Updated PushController to pass message ID for tracking
- Updated Program.cs to log RunId and configuration details

### Enhanced GitHub Actions Benchmark Workflow (~30 min)
- Added Datadog environment variables to push subscriber benchmark step
- Used `kubectl set env` to dynamically configure push-subscriber deployment with DD vars
- Added Datadog tags to push subscriber load generator job
- Improved Summary step with comprehensive configuration table
- Added Datadog metrics documentation to workflow summary
- Applied security best practices: moved sensitive inputs to env: block
