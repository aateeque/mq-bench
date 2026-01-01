using MqBench.GcpPubSub.PushSubscriber.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<PushMetricsService>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapControllers();
app.MapHealthChecks("/health");

Console.WriteLine("Push Subscriber started");
Console.WriteLine($"Listening on: {Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://localhost:5000"}");

app.Run();
