FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy build configuration from repo root
COPY ["Directory.Build.props", "."]
COPY ["Directory.Packages.props", "."]

# Copy project files
COPY ["src/gcp-pubsub/MqBench.GcpPubSub.Common/MqBench.GcpPubSub.Common.csproj", "src/gcp-pubsub/MqBench.GcpPubSub.Common/"]
COPY ["src/gcp-pubsub/MqBench.GcpPubSub.PullSubscriber/MqBench.GcpPubSub.PullSubscriber.csproj", "src/gcp-pubsub/MqBench.GcpPubSub.PullSubscriber/"]

# Restore
RUN dotnet restore "src/gcp-pubsub/MqBench.GcpPubSub.PullSubscriber/MqBench.GcpPubSub.PullSubscriber.csproj"

# Copy source
COPY ["src/gcp-pubsub/", "src/gcp-pubsub/"]

# Build
RUN dotnet publish "src/gcp-pubsub/MqBench.GcpPubSub.PullSubscriber/MqBench.GcpPubSub.PullSubscriber.csproj" \
    -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/runtime:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MqBench.GcpPubSub.PullSubscriber.dll"]
