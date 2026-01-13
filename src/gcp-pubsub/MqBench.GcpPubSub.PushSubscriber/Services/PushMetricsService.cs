using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.Common.Metrics;
using MqBench.GcpPubSub.Common.Tracking;

namespace MqBench.GcpPubSub.PushSubscriber.Services;

public class PushMetricsService : IDisposable
{
    private readonly MetricsCollector _metrics = new();
    private readonly DogStatsDExporter? _dogStatsD;
    private readonly MessageTracker? _messageTracker;
    private readonly BenchmarkRunContext _runContext;
    private int _started;

    public PushMetricsService()
    {
        var config = new BenchmarkConfig();
        _runContext = BenchmarkRunContext.FromConfig(config, "mq-bench-push-subscriber");

        if (config.EnableDogStatsD)
        {
            _dogStatsD = new DogStatsDExporter(
                config.DogStatsDHost,
                config.DogStatsDPort,
                _runContext.ServiceName,
                _runContext.RunId,
                config.MessageSizeBytes,
                config.ConcurrencyLevel,
                _runContext.Environment
            );
        }

        if (config.EnableMessageTracking)
        {
            _messageTracker = new MessageTracker();
        }
    }

    public string RunId => _runContext.RunId;

    public void RecordMessage(TimeSpan latency, int byteCount, string? messageId = null)
    {
        if (Interlocked.CompareExchange(ref _started, 1, 0) == 0)
        {
            _metrics.Start();
        }

        _metrics.RecordLatency(latency);
        _metrics.RecordMessage(byteCount);

        _dogStatsD?.RecordLatency(latency);
        _dogStatsD?.IncrementMessageCount(byteCount);

        if (messageId != null)
        {
            _messageTracker?.RecordReceived(messageId);
        }
    }

    public void RecordError()
    {
        _metrics.RecordError();
        _dogStatsD?.IncrementErrorCount();
    }

    public BenchmarkResults GetResults()
    {
        _metrics.Stop();
        var results = _metrics.GetResults();

        if (_dogStatsD != null)
        {
            var trackingResults = _messageTracker?.GetResults();
            var lostMessages = trackingResults?.LostCount ?? 0;
            _dogStatsD.SendBenchmarkResults(results, lostMessages);
        }

        return results;
    }

    public MessageTrackingResults? GetTrackingResults() => _messageTracker?.GetResults();

    public void Reset()
    {
        Interlocked.Exchange(ref _started, 0);
        _messageTracker?.Clear();
    }

    public void Dispose()
    {
        _metrics.Dispose();
        _dogStatsD?.Dispose();
    }
}
