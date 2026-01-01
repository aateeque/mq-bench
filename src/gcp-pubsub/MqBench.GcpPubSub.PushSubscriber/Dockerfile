FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy build configuration from repo root
COPY ["Directory.Build.props", "."]
COPY ["Directory.Packages.props", "."]

# Copy project files
COPY ["src/gcp-pubsub/MqBench.GcpPubSub.Common/MqBench.GcpPubSub.Common.csproj", "src/gcp-pubsub/MqBench.GcpPubSub.Common/"]
COPY ["src/gcp-pubsub/MqBench.GcpPubSub.PushSubscriber/MqBench.GcpPubSub.PushSubscriber.csproj", "src/gcp-pubsub/MqBench.GcpPubSub.PushSubscriber/"]

# Restore
RUN dotnet restore "src/gcp-pubsub/MqBench.GcpPubSub.PushSubscriber/MqBench.GcpPubSub.PushSubscriber.csproj"

# Copy source
COPY ["src/gcp-pubsub/", "src/gcp-pubsub/"]

# Build
RUN dotnet publish "src/gcp-pubsub/MqBench.GcpPubSub.PushSubscriber/MqBench.GcpPubSub.PushSubscriber.csproj" \
    -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MqBench.GcpPubSub.PushSubscriber.dll"]
