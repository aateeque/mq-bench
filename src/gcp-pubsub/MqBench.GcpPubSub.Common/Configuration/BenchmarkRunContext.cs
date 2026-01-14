namespace MqBench.GcpPubSub.Common.Configuration;

public class BenchmarkRunContext
{
    public string RunId { get; } = Guid.NewGuid().ToString("N")[..8];
    public required string ServiceName { get; init; }
    public required int MessageSize { get; init; }
    public required int ConcurrencyLevel { get; init; }
    public string Environment { get; init; } = "prod";
    public DateTimeOffset StartTime { get; } = DateTimeOffset.UtcNow;

    public static BenchmarkRunContext FromConfig(BenchmarkConfig config, string serviceName)
    {
        return new BenchmarkRunContext
        {
            ServiceName = serviceName,
            MessageSize = config.MessageSizeBytes,
            ConcurrencyLevel = config.ConcurrencyLevel,
            Environment = System.Environment.GetEnvironmentVariable("DD_ENV") ?? "prod"
        };
    }

    public string[] ToDataDogTags()
    {
        return [
            $"service:{ServiceName}",
            $"run_id:{RunId}",
            $"message_size:{MessageSize}",
            $"concurrency:{ConcurrencyLevel}",
            $"env:{Environment}"
        ];
    }
}
