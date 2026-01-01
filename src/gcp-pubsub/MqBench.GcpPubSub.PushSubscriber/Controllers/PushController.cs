using Microsoft.AspNetCore.Mvc;
using MqBench.GcpPubSub.Common.Messages;
using MqBench.GcpPubSub.PushSubscriber.Services;

namespace MqBench.GcpPubSub.PushSubscriber.Controllers;

[ApiController]
[Route("[controller]")]
public class PushController : ControllerBase
{
    private readonly PushMetricsService _metricsService;
    private readonly ILogger<PushController> _logger;

    public PushController(PushMetricsService metricsService, ILogger<PushController> logger)
    {
        _metricsService = metricsService;
        _logger = logger;
    }

    [HttpPost]
    public IActionResult ReceiveMessage([FromBody] PubSubPushMessage pushMessage)
    {
        try
        {
            var data = Convert.FromBase64String(pushMessage.Message.Data);
            var message = BenchmarkMessage.FromBytes(data);
            var publishTime = new DateTime(message.TimestampTicks, DateTimeKind.Utc);
            var latency = DateTime.UtcNow - publishTime;

            _metricsService.RecordMessage(latency, data.Length);

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing push message");
            _metricsService.RecordError();
            return BadRequest();
        }
    }

    [HttpGet("/health")]
    public IActionResult Health() => Ok("Healthy");

    [HttpGet("/metrics")]
    public IActionResult GetMetrics() => Ok(_metricsService.GetResults().ToString());

    [HttpPost("/metrics/reset")]
    public IActionResult ResetMetrics()
    {
        _metricsService.Reset();
        return Ok("Metrics reset");
    }
}

public class PubSubPushMessage
{
    public PubSubMessageData Message { get; set; } = null!;
    public string Subscription { get; set; } = "";
}

public class PubSubMessageData
{
    public string Data { get; set; } = "";
    public string MessageId { get; set; } = "";
    public DateTime PublishTime { get; set; }
    public Dictionary<string, string> Attributes { get; set; } = new();
}
