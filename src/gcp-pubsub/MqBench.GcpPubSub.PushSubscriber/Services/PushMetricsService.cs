using MqBench.GcpPubSub.Common.Metrics;

namespace MqBench.GcpPubSub.PushSubscriber.Services;

public class PushMetricsService : IDisposable
{
    private readonly MetricsCollector _metrics = new();
    private int _started;

    public void RecordMessage(TimeSpan latency, int byteCount)
    {
        // Lock-free start using Interlocked.CompareExchange
        if (Interlocked.CompareExchange(ref _started, 1, 0) == 0)
        {
            _metrics.Start();
        }

        _metrics.RecordLatency(latency);
        _metrics.RecordMessage(byteCount);
    }

    public void RecordError() => _metrics.RecordError();

    public BenchmarkResults GetResults()
    {
        _metrics.Stop();
        return _metrics.GetResults();
    }

    public void Reset()
    {
        Interlocked.Exchange(ref _started, 0);
    }

    public void Dispose() => _metrics.Dispose();
}
