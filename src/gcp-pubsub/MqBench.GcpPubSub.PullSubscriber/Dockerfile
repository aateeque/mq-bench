FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["MqBench.GcpPubSub.Common/MqBench.GcpPubSub.Common.csproj", "MqBench.GcpPubSub.Common/"]
COPY ["MqBench.GcpPubSub.PullSubscriber/MqBench.GcpPubSub.PullSubscriber.csproj", "MqBench.GcpPubSub.PullSubscriber/"]
COPY ["Directory.Build.props", "."]

RUN dotnet restore "MqBench.GcpPubSub.PullSubscriber/MqBench.GcpPubSub.PullSubscriber.csproj"

COPY . .

RUN dotnet publish "MqBench.GcpPubSub.PullSubscriber/MqBench.GcpPubSub.PullSubscriber.csproj" \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/runtime:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MqBench.GcpPubSub.PullSubscriber.dll"]
