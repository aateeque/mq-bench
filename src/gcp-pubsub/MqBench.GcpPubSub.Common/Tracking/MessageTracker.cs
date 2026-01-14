using System.Collections.Concurrent;

namespace MqBench.GcpPubSub.Common.Tracking;

public class MessageTracker
{
    private readonly ConcurrentDictionary<string, MessageTrackingInfo>? _sentMessages;
    private readonly ConcurrentDictionary<string, bool>? _receivedMessages;
    private readonly int _maxTrackedMessages;
    private readonly bool _trackMessageIds;
    private long _sentCount;
    private long _receivedCount;
    private long _duplicateCount;
    private int _trackingDisabledWarningShown;

    public MessageTracker(int maxTrackedMessages = 1_000_000, bool trackMessageIds = true)
    {
        _maxTrackedMessages = maxTrackedMessages;
        _trackMessageIds = trackMessageIds && maxTrackedMessages > 0;

        if (_trackMessageIds)
        {
            _sentMessages = new();
            _receivedMessages = new();
        }
    }

    public void RecordSent(string messageId, int sequenceNumber)
    {
        Interlocked.Increment(ref _sentCount);

        if (!_trackMessageIds || _sentMessages == null) return;

        if (_sentMessages.Count >= _maxTrackedMessages)
        {
            WarnTrackingDisabled();
            return;
        }

        var info = new MessageTrackingInfo(sequenceNumber, DateTimeOffset.UtcNow);
        _sentMessages.TryAdd(messageId, info);
    }

    public void RecordReceived(string messageId)
    {
        if (!_trackMessageIds || _receivedMessages == null)
        {
            Interlocked.Increment(ref _receivedCount);
            return;
        }

        if (_receivedMessages.Count >= _maxTrackedMessages)
        {
            WarnTrackingDisabled();
            Interlocked.Increment(ref _receivedCount);
            return;
        }

        if (_receivedMessages.TryAdd(messageId, true))
        {
            Interlocked.Increment(ref _receivedCount);
        }
        else
        {
            Interlocked.Increment(ref _duplicateCount);
        }
    }

    private void WarnTrackingDisabled()
    {
        if (Interlocked.CompareExchange(ref _trackingDisabledWarningShown, 1, 0) == 0)
        {
            Console.WriteLine($"[MessageTracker] Warning: Max tracked messages ({_maxTrackedMessages:N0}) reached. " +
                              "Message ID tracking disabled to prevent memory issues. Counts will continue.");
        }
    }

    public MessageTrackingResults GetResults()
    {
        var totalSent = Interlocked.Read(ref _sentCount);
        var totalReceived = Interlocked.Read(ref _receivedCount);
        var duplicates = Interlocked.Read(ref _duplicateCount);

        if (!_trackMessageIds || _sentMessages == null || _receivedMessages == null)
        {
            return new MessageTrackingResults
            {
                TotalSent = totalSent,
                TotalReceived = totalReceived,
                DuplicateCount = duplicates,
                LostMessageIds = [],
                UnexpectedMessageIds = [],
                TrackingLimited = true
            };
        }

        var sentIds = new HashSet<string>(_sentMessages.Keys);
        var receivedIds = new HashSet<string>(_receivedMessages.Keys);

        var lostIds = sentIds.Except(receivedIds).ToList();
        var unexpectedIds = receivedIds.Except(sentIds).ToList();

        return new MessageTrackingResults
        {
            TotalSent = totalSent,
            TotalReceived = totalReceived,
            DuplicateCount = duplicates,
            LostMessageIds = lostIds,
            UnexpectedMessageIds = unexpectedIds,
            TrackingLimited = _sentMessages.Count >= _maxTrackedMessages || _receivedMessages.Count >= _maxTrackedMessages
        };
    }

    public void Clear()
    {
        _sentMessages?.Clear();
        _receivedMessages?.Clear();
        Interlocked.Exchange(ref _sentCount, 0);
        Interlocked.Exchange(ref _receivedCount, 0);
        Interlocked.Exchange(ref _duplicateCount, 0);
        Interlocked.Exchange(ref _trackingDisabledWarningShown, 0);
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
    public bool TrackingLimited { get; init; }

    public override string ToString() => $"""
        === Message Tracking Results ===
        Total Sent: {TotalSent:N0}
        Total Received: {TotalReceived:N0}
        Lost: {LostCount:N0} ({LossRate:F4}%)
        Duplicates: {DuplicateCount:N0}
        Unexpected: {UnexpectedCount:N0}
        {(TrackingLimited ? "⚠️ Tracking was limited due to volume" : "")}
        """;
}
