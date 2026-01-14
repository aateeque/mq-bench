using Google.Cloud.PubSub.V1;
using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.Common.Messages;
using MqBench.GcpPubSub.Common.Metrics;
using MqBench.GcpPubSub.Common.Tracking;

namespace MqBench.GcpPubSub.PullSubscriber.Services;

public class PullSubscriberService : IAsyncDisposable
{
    private readonly SubscriberClient _subscriber;
    private readonly BenchmarkConfig _config;
    private readonly BenchmarkRunContext _runContext;
    private readonly DogStatsDExporter? _dogStatsD;
    private readonly MessageTracker? _messageTracker;
    private readonly Action<string> _log;

    public PullSubscriberService(BenchmarkConfig config, Action<string>? log = null)
    {
        _config = StressTestProfiles.ApplyProfile(config);
        _runContext = BenchmarkRunContext.FromConfig(_config, "mq-bench-pull-subscriber");
        _log = log ?? Console.WriteLine;

        var subscriptionName = SubscriptionName.FromProjectSubscription(
            config.ProjectId,
            config.SubscriptionId
        );
        _subscriber = SubscriberClient.Create(subscriptionName);

        if (_config.EnableDogStatsD)
        {
            _dogStatsD = new DogStatsDExporter(
                _config.DogStatsDHost,
                _config.DogStatsDPort,
                _runContext.ServiceName,
                _runContext.RunId,
                _config.MessageSizeBytes,
                _config.ConcurrencyLevel,
                _runContext.Environment
            );
        }

        if (_config.EnableMessageTracking)
        {
            _messageTracker = new MessageTracker();
        }
    }

    public string RunId => _runContext.RunId;

    public async Task<BenchmarkResults> RunThroughputBenchmarkAsync(CancellationToken ct = default)
    {
        using var metrics = new MetricsCollector();
        var messageCount = 0;
        var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);

        metrics.Start();

        var task = _subscriber.StartAsync(
            async (msg, token) =>
            {
                try
                {
                    var message = BenchmarkMessage.FromBytes(msg.Data.Span);
                    var publishTime = new DateTime(message.TimestampTicks, DateTimeKind.Utc);
                    var latency = DateTime.UtcNow - publishTime;

                    metrics.RecordLatency(latency);
                    metrics.RecordMessage(msg.Data.Length);

                    _dogStatsD?.RecordLatency(latency);
                    _messageTracker?.RecordReceived(message.Id);

                    if (Interlocked.Increment(ref messageCount) >= _config.MessageCount)
                    {
                        await cts.CancelAsync();
                    }

                    return SubscriberClient.Reply.Ack;
                }
                catch (Exception ex)
                {
                    _log($"Error processing message {msg.MessageId}: {ex.Message}");
                    metrics.RecordError();
                    _dogStatsD?.IncrementErrorCount();
                    return SubscriberClient.Reply.Nack;
                }
            }
        );

        try
        {
            await Task.Delay(_config.TestDuration, cts.Token);
        }
        catch (OperationCanceledException)
        {
            // Expected when target count reached or timeout
        }

        await _subscriber.StopAsync(CancellationToken.None);
        metrics.Stop();

        var results = metrics.GetResults();
        SendResultsToDataDog(results);

        return results;
    }

    private void SendResultsToDataDog(BenchmarkResults results)
    {
        if (_dogStatsD == null) return;

        var trackingResults = _messageTracker?.GetResults();
        var lostMessages = trackingResults?.LostCount ?? 0;

        _dogStatsD.SendBenchmarkResults(results, lostMessages);
    }

    public MessageTrackingResults? GetTrackingResults() => _messageTracker?.GetResults();

    public async ValueTask DisposeAsync()
    {
        await _subscriber.StopAsync(CancellationToken.None);
        _dogStatsD?.Dispose();
    }
}
