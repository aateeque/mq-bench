namespace MqBench.GcpPubSub.Common.Configuration;

public class BenchmarkConfig
{
    public string ProjectId { get; set; } = Environment.GetEnvironmentVariable("GCP_PROJECT_ID") ?? "";
    public string TopicId { get; set; } = Environment.GetEnvironmentVariable("PUBSUB_TOPIC") ?? "mq-bench-topic";
    public string SubscriptionId { get; set; } = Environment.GetEnvironmentVariable("PUBSUB_SUBSCRIPTION") ?? "";
    public string BenchmarkMode { get; set; } = Environment.GetEnvironmentVariable("BENCHMARK_MODE") ?? "throughput";

    // Benchmark parameters
    public int MessageCount { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("MESSAGE_COUNT"), out var mc) ? mc : 100_000;
    public int MessageSizeBytes { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("MESSAGE_SIZE_BYTES"), out var ms) ? ms : 1024;
    public int BatchSize { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("BATCH_SIZE"), out var bs) ? bs : 100;
    public int WarmupCount { get; set; } = 1000;
    public int ConcurrencyLevel { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("CONCURRENCY_LEVEL"), out var cl) ? cl : 10;
    public TimeSpan TestDuration { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("TEST_DURATION_SECONDS"), out var td) ? TimeSpan.FromSeconds(td) : TimeSpan.FromMinutes(5);

    // DataDog DogStatsD configuration
    public string DogStatsDHost { get; set; } = Environment.GetEnvironmentVariable("DD_AGENT_HOST") ?? "datadog-agent";
    public int DogStatsDPort { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("DD_DOGSTATSD_PORT"), out var p) ? p : 8125;
    public bool EnableDogStatsD { get; set; } = bool.TryParse(Environment.GetEnvironmentVariable("DD_ENABLED"), out var e) && e;

    // Stress testing configuration
    public string StressProfile { get; set; } = Environment.GetEnvironmentVariable("STRESS_PROFILE") ?? "default";
    public bool EnableBurstMode { get; set; } = bool.TryParse(Environment.GetEnvironmentVariable("BURST_MODE"), out var b) && b;
    public int BurstSize { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("BURST_SIZE"), out var bsz) ? bsz : 1000;
    public int BurstIntervalMs { get; set; } = int.TryParse(Environment.GetEnvironmentVariable("BURST_INTERVAL_MS"), out var bi) ? bi : 100;

    // Durability testing configuration
    public bool EnableExactlyOnce { get; set; } = bool.TryParse(Environment.GetEnvironmentVariable("ENABLE_EXACTLY_ONCE"), out var eo) && eo;
    public bool EnableMessageTracking { get; set; } = bool.TryParse(Environment.GetEnvironmentVariable("ENABLE_MESSAGE_TRACKING"), out var mt) && mt;

    /// <summary>
    /// Validates the configuration and throws if required values are missing.
    /// </summary>
    public void Validate(bool requireSubscription = false)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(ProjectId))
            errors.Add("GCP_PROJECT_ID environment variable is required");

        if (string.IsNullOrWhiteSpace(TopicId))
            errors.Add("PUBSUB_TOPIC environment variable is required");

        if (requireSubscription && string.IsNullOrWhiteSpace(SubscriptionId))
            errors.Add("PUBSUB_SUBSCRIPTION environment variable is required");

        if (MessageCount <= 0)
            errors.Add("MESSAGE_COUNT must be greater than 0");

        if (MessageSizeBytes <= 0)
            errors.Add("MESSAGE_SIZE_BYTES must be greater than 0");

        if (ConcurrencyLevel <= 0)
            errors.Add("CONCURRENCY_LEVEL must be greater than 0");

        if (TestDuration <= TimeSpan.Zero)
            errors.Add("TEST_DURATION_SECONDS must be greater than 0");

        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                $"Configuration validation failed:\n- {string.Join("\n- ", errors)}");
        }
    }
}
