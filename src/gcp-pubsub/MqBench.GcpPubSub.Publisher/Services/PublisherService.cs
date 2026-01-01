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
        metrics.Start();

        var tasks = new List<Task>();

        for (int i = 0; i < _config.MessageCount && !ct.IsCancellationRequested; i++)
        {
            var message = BenchmarkMessage.Create(i, _config.MessageSizeBytes);
            var data = message.ToBytes();
            var startTime = DateTime.UtcNow;

            var task = _publisher
                .PublishAsync(ByteString.CopyFrom(data))
                .ContinueWith(
                    t =>
                    {
                        if (t.IsCompletedSuccessfully)
                        {
                            var latency = DateTime.UtcNow - startTime;
                            metrics.RecordLatency(latency);
                            metrics.RecordMessage(data.Length);
                        }
                        else
                        {
                            metrics.RecordError();
                        }
                    },
                    ct
                );

            tasks.Add(task);

            // Control concurrency
            if (tasks.Count >= _config.ConcurrencyLevel)
            {
                await Task.WhenAny(tasks);
                tasks.RemoveAll(t => t.IsCompleted);
            }
        }

        await Task.WhenAll(tasks);
        metrics.Stop();

        return metrics.GetResults();
    }

    public async ValueTask DisposeAsync()
    {
        await _publisher.ShutdownAsync(TimeSpan.FromSeconds(15));
    }
}
