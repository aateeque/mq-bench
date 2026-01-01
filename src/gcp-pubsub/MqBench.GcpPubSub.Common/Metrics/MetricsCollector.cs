using System.Diagnostics;
using HdrHistogram;

namespace MqBench.GcpPubSub.Common.Metrics;

public class MetricsCollector : IDisposable
{
    private readonly LongHistogram _latencyHistogram;
    private readonly Stopwatch _stopwatch = new();
    private long _messageCount;
    private long _byteCount;
    private long _errorCount;

    public MetricsCollector()
    {
        // Record latencies from 1 microsecond to 60 seconds with 3 significant figures
        _latencyHistogram = new LongHistogram(TimeSpan.FromSeconds(60).Ticks, 3);
    }

    public void RecordLatency(TimeSpan latency)
    {
        try
        {
            _latencyHistogram.RecordValue(latency.Ticks);
        }
        catch (IndexOutOfRangeException)
        {
            // Latency exceeded max trackable value, record as max
            _latencyHistogram.RecordValue(_latencyHistogram.HighestTrackableValue);
        }
    }

    public void RecordMessage(int byteCount)
    {
        Interlocked.Increment(ref _messageCount);
        Interlocked.Add(ref _byteCount, byteCount);
    }

    public void RecordError() => Interlocked.Increment(ref _errorCount);

    public void Start() => _stopwatch.Start();
    public void Stop() => _stopwatch.Stop();

    public BenchmarkResults GetResults()
    {
        var elapsed = _stopwatch.Elapsed;
        return new BenchmarkResults
        {
            TotalMessages = _messageCount,
            TotalBytes = _byteCount,
            ErrorCount = _errorCount,
            Duration = elapsed,
            MessagesPerSecond = elapsed.TotalSeconds > 0 ? _messageCount / elapsed.TotalSeconds : 0,
            MegabytesPerSecond = elapsed.TotalSeconds > 0 ? (_byteCount / 1024.0 / 1024.0) / elapsed.TotalSeconds : 0,
            LatencyP50 = TimeSpan.FromTicks(_latencyHistogram.GetValueAtPercentile(50)),
            LatencyP95 = TimeSpan.FromTicks(_latencyHistogram.GetValueAtPercentile(95)),
            LatencyP99 = TimeSpan.FromTicks(_latencyHistogram.GetValueAtPercentile(99)),
            LatencyP999 = TimeSpan.FromTicks(_latencyHistogram.GetValueAtPercentile(99.9)),
            LatencyMax = TimeSpan.FromTicks(_latencyHistogram.GetMaxValue()),
        };
    }

    public void Dispose()
    {
        // LongHistogram doesn't require disposal, but we implement IDisposable
        // for proper using pattern in consuming code
    }
}

public class BenchmarkResults
{
    public long TotalMessages { get; set; }
    public long TotalBytes { get; set; }
    public long ErrorCount { get; set; }
    public TimeSpan Duration { get; set; }
    public double MessagesPerSecond { get; set; }
    public double MegabytesPerSecond { get; set; }
    public TimeSpan LatencyP50 { get; set; }
    public TimeSpan LatencyP95 { get; set; }
    public TimeSpan LatencyP99 { get; set; }
    public TimeSpan LatencyP999 { get; set; }
    public TimeSpan LatencyMax { get; set; }

    public override string ToString() => $"""
        === Benchmark Results ===
        Total Messages: {TotalMessages:N0}
        Total Bytes: {TotalBytes:N0}
        Errors: {ErrorCount}
        Duration: {Duration}
        Throughput: {MessagesPerSecond:N2} msg/s
        Throughput: {MegabytesPerSecond:N2} MB/s
        Latency P50: {LatencyP50.TotalMilliseconds:N3} ms
        Latency P95: {LatencyP95.TotalMilliseconds:N3} ms
        Latency P99: {LatencyP99.TotalMilliseconds:N3} ms
        Latency P99.9: {LatencyP999.TotalMilliseconds:N3} ms
        Latency Max: {LatencyMax.TotalMilliseconds:N3} ms
        """;
}
