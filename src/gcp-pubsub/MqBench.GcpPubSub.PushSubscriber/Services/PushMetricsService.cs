using MqBench.GcpPubSub.Common.Metrics;

namespace MqBench.GcpPubSub.PushSubscriber.Services;

public class PushMetricsService : IDisposable
{
    private readonly MetricsCollector _metrics = new();
    private bool _started;
    private readonly object _lock = new();

    public void RecordMessage(TimeSpan latency, int byteCount)
    {
        lock (_lock)
        {
            if (!_started)
            {
                _metrics.Start();
                _started = true;
            }
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
        lock (_lock)
        {
            _started = false;
        }
    }

    public void Dispose() => _metrics.Dispose();
}
