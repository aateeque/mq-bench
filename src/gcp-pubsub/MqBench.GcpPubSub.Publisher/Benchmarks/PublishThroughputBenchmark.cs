using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Engines;
using Google.Cloud.PubSub.V1;
using Google.Protobuf;
using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.Common.Messages;

namespace MqBench.GcpPubSub.Publisher.Benchmarks;

[SimpleJob(RunStrategy.Monitoring, iterationCount: 10, warmupCount: 2)]
[MemoryDiagnoser]
public class PublishThroughputBenchmark
{
    private PublisherClient _publisher = null!;
    private byte[] _messageData = null!;

    [Params(256, 1024, 4096)]
    public int MessageSize { get; set; }

    [Params(1, 10, 100)]
    public int BatchSize { get; set; }

    [GlobalSetup]
    public void Setup()
    {
        var config = new BenchmarkConfig();
        var topicName = TopicName.FromProjectTopic(config.ProjectId, config.TopicId);
        _publisher = PublisherClient.Create(topicName);
        _messageData = BenchmarkMessage.Create(0, MessageSize).ToBytes();
    }

    [Benchmark]
    public async Task PublishBatch()
    {
        var tasks = new Task<string>[BatchSize];
        for (int i = 0; i < BatchSize; i++)
        {
            tasks[i] = _publisher.PublishAsync(ByteString.CopyFrom(_messageData));
        }
        await Task.WhenAll(tasks);
    }

    [GlobalCleanup]
    public async Task Cleanup()
    {
        await _publisher.ShutdownAsync(TimeSpan.FromSeconds(15));
    }
}
