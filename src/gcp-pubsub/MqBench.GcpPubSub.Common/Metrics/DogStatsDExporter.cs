using StatsdClient;

namespace MqBench.GcpPubSub.Common.Metrics;

public class DogStatsDExporter : IDisposable
{
    private readonly DogStatsdService _dogStats;
    private readonly string[] _baseTags;
    private bool _disposed;

    public DogStatsDExporter(string host, int port, string serviceName, string runId, int messageSize, int concurrency, string environment = "prod")
    {
        var config = new StatsdConfig
        {
            StatsdServerName = host,
            StatsdPort = port,
            Prefix = "mq_bench",
            ConstantTags = [
                $"service:{serviceName}",
                $"run_id:{runId}",
                $"message_size:{messageSize}",
                $"concurrency:{concurrency}",
                $"env:{environment}"
            ]
        };

        _dogStats = new DogStatsdService();
        _dogStats.Configure(config);

        _baseTags = config.ConstantTags;
    }

    public void SendGauge(string metric, double value, params string[] additionalTags)
    {
        var tags = CombineTags(additionalTags);
        _dogStats.Gauge(metric, value, tags: tags);
    }

    public void SendHistogram(string metric, double value, params string[] additionalTags)
    {
        var tags = CombineTags(additionalTags);
        _dogStats.Histogram(metric, value, tags: tags);
    }

    public void SendCount(string metric, long value, params string[] additionalTags)
    {
        var tags = CombineTags(additionalTags);
        _dogStats.Counter(metric, value, tags: tags);
    }

    public void SendBenchmarkResults(BenchmarkResults results, long lostMessages = 0)
    {
        _dogStats.Gauge("throughput.messages_per_second", results.MessagesPerSecond);
        _dogStats.Gauge("throughput.megabytes_per_second", results.MegabytesPerSecond);

        _dogStats.Gauge("latency.p50_ms", results.LatencyP50.TotalMilliseconds);
        _dogStats.Gauge("latency.p95_ms", results.LatencyP95.TotalMilliseconds);
        _dogStats.Gauge("latency.p99_ms", results.LatencyP99.TotalMilliseconds);
        _dogStats.Gauge("latency.p999_ms", results.LatencyP999.TotalMilliseconds);
        _dogStats.Gauge("latency.max_ms", results.LatencyMax.TotalMilliseconds);

        _dogStats.Counter("messages.total", results.TotalMessages);
        _dogStats.Counter("messages.errors", results.ErrorCount);
        _dogStats.Counter("messages.lost", lostMessages);

        _dogStats.Gauge("duration.seconds", results.Duration.TotalSeconds);
    }

    public void RecordLatency(TimeSpan latency)
    {
        _dogStats.Histogram("latency.realtime_ms", latency.TotalMilliseconds);
    }

    public void IncrementMessageCount(int bytes)
    {
        _dogStats.Increment("messages.processed");
        _dogStats.Counter("bytes.processed", bytes);
    }

    public void IncrementErrorCount()
    {
        _dogStats.Increment("messages.error");
    }

    private string[] CombineTags(string[] additionalTags)
    {
        if (additionalTags.Length == 0)
            return _baseTags;

        var combined = new string[_baseTags.Length + additionalTags.Length];
        _baseTags.CopyTo(combined, 0);
        additionalTags.CopyTo(combined, _baseTags.Length);
        return combined;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _dogStats.Dispose();
    }
}
