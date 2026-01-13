using System.Collections.Concurrent;

namespace MqBench.GcpPubSub.Common.Tracking;

public class MessageTracker
{
    private readonly ConcurrentDictionary<string, MessageTrackingInfo> _sentMessages = new();
    private readonly ConcurrentDictionary<string, bool> _receivedMessages = new();
    private long _sentCount;
    private long _receivedCount;
    private long _duplicateCount;

    public void RecordSent(string messageId, int sequenceNumber)
    {
        var info = new MessageTrackingInfo(sequenceNumber, DateTimeOffset.UtcNow);
        if (_sentMessages.TryAdd(messageId, info))
        {
            Interlocked.Increment(ref _sentCount);
        }
    }

    public void RecordReceived(string messageId)
    {
        if (_receivedMessages.TryAdd(messageId, true))
        {
            Interlocked.Increment(ref _receivedCount);
        }
        else
        {
            Interlocked.Increment(ref _duplicateCount);
        }
    }

    public MessageTrackingResults GetResults()
    {
        var sentIds = new HashSet<string>(_sentMessages.Keys);
        var receivedIds = new HashSet<string>(_receivedMessages.Keys);

        var lostIds = sentIds.Except(receivedIds).ToList();
        var unexpectedIds = receivedIds.Except(sentIds).ToList();

        return new MessageTrackingResults
        {
            TotalSent = Interlocked.Read(ref _sentCount),
            TotalReceived = Interlocked.Read(ref _receivedCount),
            DuplicateCount = Interlocked.Read(ref _duplicateCount),
            LostMessageIds = lostIds,
            UnexpectedMessageIds = unexpectedIds
        };
    }

    public void Clear()
    {
        _sentMessages.Clear();
        _receivedMessages.Clear();
        Interlocked.Exchange(ref _sentCount, 0);
        Interlocked.Exchange(ref _receivedCount, 0);
        Interlocked.Exchange(ref _duplicateCount, 0);
    }
}

public readonly record struct MessageTrackingInfo(int SequenceNumber, DateTimeOffset SentAt);

public class MessageTrackingResults
{
    public long TotalSent { get; init; }
    public long TotalReceived { get; init; }
    public long LostCount => LostMessageIds.Count;
    public long DuplicateCount { get; init; }
    public long UnexpectedCount => UnexpectedMessageIds.Count;
    public double LossRate => TotalSent > 0 ? (double)LostCount / TotalSent * 100 : 0;
    public List<string> LostMessageIds { get; init; } = [];
    public List<string> UnexpectedMessageIds { get; init; } = [];

    public override string ToString() => $"""
        === Message Tracking Results ===
        Total Sent: {TotalSent:N0}
        Total Received: {TotalReceived:N0}
        Lost: {LostCount:N0} ({LossRate:F4}%)
        Duplicates: {DuplicateCount:N0}
        Unexpected: {UnexpectedCount:N0}
        """;
}
