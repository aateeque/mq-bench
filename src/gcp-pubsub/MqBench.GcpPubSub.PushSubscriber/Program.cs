using MqBench.GcpPubSub.PushSubscriber.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<PushMetricsService>();
builder.Services.AddSingleton<PubSubAuthenticationService>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapControllers();
app.MapHealthChecks("/health");

var authEnabled = !string.IsNullOrEmpty(builder.Configuration["PubSub:ExpectedAudience"]);
Console.WriteLine("Push Subscriber started");
Console.WriteLine($"Listening on: {Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://localhost:5000"}");
Console.WriteLine($"Authentication: {(authEnabled ? "ENABLED" : "DISABLED (set PubSub:ExpectedAudience to enable)")}");

app.Run();
