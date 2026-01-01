using BenchmarkDotNet.Running;
using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.Publisher.Benchmarks;
using MqBench.GcpPubSub.Publisher.Services;

var config = new BenchmarkConfig();

if (args.Contains("--benchmark"))
{
    // Run formal BenchmarkDotNet benchmarks
    BenchmarkRunner.Run<PublishThroughputBenchmark>();
}
else
{
    // Run custom throughput/latency test
    Console.WriteLine("Starting Publisher Benchmark");
    Console.WriteLine($"Project: {config.ProjectId}");
    Console.WriteLine($"Topic: {config.TopicId}");
    Console.WriteLine($"Messages: {config.MessageCount:N0}");
    Console.WriteLine($"Message Size: {config.MessageSizeBytes} bytes");
    Console.WriteLine($"Concurrency: {config.ConcurrencyLevel}");
    Console.WriteLine();

    await using var publisher = new PublisherService(config);
    var results = await publisher.RunThroughputBenchmarkAsync();

    Console.WriteLine(results);
}
