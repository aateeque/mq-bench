using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.PullSubscriber.Services;

var config = new BenchmarkConfig();

Console.WriteLine("Starting Pull Subscriber Benchmark");
Console.WriteLine($"Project: {config.ProjectId}");
Console.WriteLine($"Subscription: {config.SubscriptionId}");
Console.WriteLine($"Duration: {config.TestDuration}");
Console.WriteLine($"Max Messages: {config.MessageCount:N0}");
Console.WriteLine();

await using var subscriber = new PullSubscriberService(config);
var results = await subscriber.RunThroughputBenchmarkAsync();

Console.WriteLine(results);
