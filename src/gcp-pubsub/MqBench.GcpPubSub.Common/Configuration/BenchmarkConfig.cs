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
    public TimeSpan TestDuration { get; set; } = TimeSpan.FromMinutes(5);
}
