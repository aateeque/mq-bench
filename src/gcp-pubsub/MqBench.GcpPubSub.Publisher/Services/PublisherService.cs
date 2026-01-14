using Google.Cloud.PubSub.V1;
using Google.Protobuf;
using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.Common.Messages;
using MqBench.GcpPubSub.Common.Metrics;
using MqBench.GcpPubSub.Common.Tracking;

namespace MqBench.GcpPubSub.Publisher.Services;

public class PublisherService : IAsyncDisposable
{
    private readonly PublisherClient _publisher;
    private readonly BenchmarkConfig _config;
    private readonly BenchmarkRunContext _runContext;
    private readonly DogStatsDExporter? _dogStatsD;
    private readonly MessageTracker? _messageTracker;

    public PublisherService(BenchmarkConfig config)
    {
        _config = StressTestProfiles.ApplyProfile(config);
        _runContext = BenchmarkRunContext.FromConfig(_config, "mq-bench-publisher");

        var topicName = TopicName.FromProjectTopic(config.ProjectId, config.TopicId);
        _publisher = PublisherClient.Create(topicName);

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
        if (_config.EnableBurstMode)
        {
            return await RunBurstBenchmarkAsync(ct);
        }

        using var metrics = new MetricsCollector();
        using var semaphore = new SemaphoreSlim(_config.ConcurrencyLevel);
        var pendingTasks = new List<Task>();

        metrics.Start();

        for (int i = 0; i < _config.MessageCount && !ct.IsCancellationRequested; i++)
        {
            await semaphore.WaitAsync(ct);

            var message = BenchmarkMessage.Create(i, _config.MessageSizeBytes, _runContext.RunId);
            _messageTracker?.RecordSent(message.Id, message.SequenceNumber);

            var data = message.ToBytes();
            var startTime = DateTime.UtcNow;

            var task = PublishWithMetricsAsync(data, startTime, metrics, semaphore, ct);
            pendingTasks.Add(task);
        }

        await Task.WhenAll(pendingTasks);
        metrics.Stop();

        var results = metrics.GetResults();
        SendResultsToDataDog(results);

        return results;
    }

    public async Task<BenchmarkResults> RunBurstBenchmarkAsync(CancellationToken ct = default)
    {
        using var metrics = new MetricsCollector();
        var messagesSent = 0;

        metrics.Start();

        while (messagesSent < _config.MessageCount && !ct.IsCancellationRequested)
        {
            var burstCount = Math.Min(_config.BurstSize, _config.MessageCount - messagesSent);
            var burstTasks = new List<Task>(burstCount);

            for (int i = 0; i < burstCount; i++)
            {
                var seqNum = messagesSent + i;
                var message = BenchmarkMessage.Create(seqNum, _config.MessageSizeBytes, _runContext.RunId);
                _messageTracker?.RecordSent(message.Id, message.SequenceNumber);

                var data = message.ToBytes();
                var startTime = DateTime.UtcNow;

                burstTasks.Add(PublishBurstMessageAsync(data, startTime, metrics, ct));
            }

            await Task.WhenAll(burstTasks);
            messagesSent += burstCount;

            if (messagesSent < _config.MessageCount && !ct.IsCancellationRequested)
            {
                await Task.Delay(_config.BurstIntervalMs, ct);
            }
        }

        metrics.Stop();

        var results = metrics.GetResults();
        SendResultsToDataDog(results);

        return results;
    }

    private async Task PublishBurstMessageAsync(
        byte[] data,
        DateTime startTime,
        MetricsCollector metrics,
        CancellationToken ct)
    {
        try
        {
            await _publisher.PublishAsync(ByteString.CopyFrom(data));
            var latency = DateTime.UtcNow - startTime;
            metrics.RecordLatency(latency);
            metrics.RecordMessage(data.Length);
            _dogStatsD?.RecordLatency(latency);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Expected during shutdown, don't count as error
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Publisher] Error publishing message: {ex.Message}");
            metrics.RecordError();
            _dogStatsD?.IncrementErrorCount();
        }
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
            _dogStatsD?.RecordLatency(latency);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Expected during shutdown, don't count as error
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Publisher] Error publishing message: {ex.Message}");
            metrics.RecordError();
            _dogStatsD?.IncrementErrorCount();
        }
        finally
        {
            semaphore.Release();
        }
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
        await _publisher.ShutdownAsync(TimeSpan.FromSeconds(15));
        _dogStatsD?.Dispose();
    }
}
