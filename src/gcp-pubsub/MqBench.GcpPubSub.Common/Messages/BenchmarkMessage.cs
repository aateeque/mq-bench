using System.Text.Json;

namespace MqBench.GcpPubSub.Common.Messages;

public class BenchmarkMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public long TimestampTicks { get; set; } = DateTime.UtcNow.Ticks;
    public int SequenceNumber { get; set; }
    public byte[] Payload { get; set; } = [];
    public string RunId { get; set; } = "";
    public int RetryCount { get; set; }

    public static BenchmarkMessage Create(int sequenceNumber, int payloadSizeBytes, string? runId = null)
    {
        return new BenchmarkMessage
        {
            SequenceNumber = sequenceNumber,
            Payload = new byte[payloadSizeBytes],
            RunId = runId ?? ""
        };
    }

    public byte[] ToBytes() => JsonSerializer.SerializeToUtf8Bytes(this);

    public static BenchmarkMessage FromBytes(ReadOnlySpan<byte> data) =>
        JsonSerializer.Deserialize<BenchmarkMessage>(data)!;
}
