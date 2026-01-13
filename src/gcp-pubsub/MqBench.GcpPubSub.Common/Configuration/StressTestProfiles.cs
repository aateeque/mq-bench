namespace MqBench.GcpPubSub.Common.Configuration;

public static class StressTestProfiles
{
    public static BenchmarkConfig Small => CreateProfile(10_000, 1024);
    public static BenchmarkConfig Medium => CreateProfile(100_000, 1024);
    public static BenchmarkConfig Large => CreateProfile(1_000_000, 1024);
    public static BenchmarkConfig XLarge => CreateProfile(10_000_000, 1024);
    public static BenchmarkConfig LargePayload => CreateProfile(10_000, 1_048_576);
    public static BenchmarkConfig LargePayloadMedium => CreateProfile(100_000, 102_400);

    public static BenchmarkConfig GetProfile(string name)
    {
        return name.ToLowerInvariant() switch
        {
            "small" => Small,
            "medium" => Medium,
            "large" => Large,
            "xlarge" => XLarge,
            "large-payload" => LargePayload,
            "large-payload-medium" => LargePayloadMedium,
            _ => new BenchmarkConfig()
        };
    }

    public static BenchmarkConfig ApplyProfile(BenchmarkConfig config)
    {
        if (config.StressProfile == "default")
            return config;

        var profile = GetProfile(config.StressProfile);
        config.MessageCount = profile.MessageCount;
        config.MessageSizeBytes = profile.MessageSizeBytes;
        return config;
    }

    private static BenchmarkConfig CreateProfile(int messageCount, int messageSizeBytes)
    {
        return new BenchmarkConfig
        {
            MessageCount = messageCount,
            MessageSizeBytes = messageSizeBytes
        };
    }

    public static string[] AvailableProfiles => ["default", "small", "medium", "large", "xlarge", "large-payload", "large-payload-medium"];
}
