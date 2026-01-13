using MqBench.GcpPubSub.Common.Configuration;
using MqBench.GcpPubSub.PushSubscriber.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<PushMetricsService>();
builder.Services.AddSingleton<PubSubAuthenticationService>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapControllers();
app.MapHealthChecks("/health");

var config = new BenchmarkConfig();
var metricsService = app.Services.GetRequiredService<PushMetricsService>();
var authEnabled = !string.IsNullOrEmpty(builder.Configuration["PubSub:ExpectedAudience"]);

Console.WriteLine("=== Push Subscriber Started ===");
Console.WriteLine($"Run ID: {metricsService.RunId}");
Console.WriteLine($"Listening on: {Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://localhost:5000"}");
Console.WriteLine($"Authentication: {(authEnabled ? "ENABLED" : "DISABLED")}");
Console.WriteLine($"Datadog: {(config.EnableDogStatsD ? $"ENABLED ({config.DogStatsDHost}:{config.DogStatsDPort})" : "DISABLED")}");
Console.WriteLine($"Message Tracking: {(config.EnableMessageTracking ? "ENABLED" : "DISABLED")}");

app.Run();
