using Google.Cloud.PubSub.V1;
using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.Common.Messages;
using MqBench.GcpPubSub.Common.Metrics;

namespace MqBench.GcpPubSub.PullSubscriber.Services;

public class PullSubscriberService : IAsyncDisposable
{
    private readonly SubscriberClient _subscriber;
    private readonly BenchmarkConfig _config;

    public PullSubscriberService(BenchmarkConfig config)
    {
        _config = config;
        var subscriptionName = SubscriptionName.FromProjectSubscription(
            config.ProjectId,
            config.SubscriptionId
        );
        _subscriber = SubscriberClient.Create(subscriptionName);
    }

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

                    if (Interlocked.Increment(ref messageCount) >= _config.MessageCount)
                    {
                        await cts.CancelAsync();
                    }

                    return SubscriberClient.Reply.Ack;
                }
                catch
                {
                    metrics.RecordError();
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

        return metrics.GetResults();
    }

    public async ValueTask DisposeAsync()
    {
        await _subscriber.StopAsync(CancellationToken.None);
    }
}
