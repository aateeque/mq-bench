using Google.Cloud.PubSub.V1;
using Google.Protobuf;
using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.Common.Messages;
using MqBench.GcpPubSub.Common.Metrics;

namespace MqBench.GcpPubSub.Publisher.Services;

public class PublisherService : IAsyncDisposable
{
    private readonly PublisherClient _publisher;
    private readonly BenchmarkConfig _config;

    public PublisherService(BenchmarkConfig config)
    {
        _config = config;
        var topicName = TopicName.FromProjectTopic(config.ProjectId, config.TopicId);
        _publisher = PublisherClient.Create(topicName);
    }

    public async Task<BenchmarkResults> RunThroughputBenchmarkAsync(CancellationToken ct = default)
    {
        using var metrics = new MetricsCollector();
        using var semaphore = new SemaphoreSlim(_config.ConcurrencyLevel);
        var pendingTasks = new List<Task>();

        metrics.Start();

        for (int i = 0; i < _config.MessageCount && !ct.IsCancellationRequested; i++)
        {
            await semaphore.WaitAsync(ct);

            var message = BenchmarkMessage.Create(i, _config.MessageSizeBytes);
            var data = message.ToBytes();
            var startTime = DateTime.UtcNow;

            var task = PublishWithMetricsAsync(data, startTime, metrics, semaphore, ct);
            pendingTasks.Add(task);
        }

        await Task.WhenAll(pendingTasks);
        metrics.Stop();

        return metrics.GetResults();
    }

    private async Task PublishWithMetricsAsync(
        byte[] data,
        DateTime startTime,
        MetricsCollector metrics,
        SemaphoreSlim semaphore,
        CancellationToken ct)
    {
        try
        {
            await _publisher.PublishAsync(ByteString.CopyFrom(data));
            var latency = DateTime.UtcNow - startTime;
            metrics.RecordLatency(latency);
            metrics.RecordMessage(data.Length);
        }
        catch
        {
            metrics.RecordError();
        }
        finally
        {
            semaphore.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _publisher.ShutdownAsync(TimeSpan.FromSeconds(15));
    }
}
