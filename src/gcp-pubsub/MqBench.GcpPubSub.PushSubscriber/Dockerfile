FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["MqBench.GcpPubSub.Common/MqBench.GcpPubSub.Common.csproj", "MqBench.GcpPubSub.Common/"]
COPY ["MqBench.GcpPubSub.PushSubscriber/MqBench.GcpPubSub.PushSubscriber.csproj", "MqBench.GcpPubSub.PushSubscriber/"]
COPY ["Directory.Build.props", "."]

RUN dotnet restore "MqBench.GcpPubSub.PushSubscriber/MqBench.GcpPubSub.PushSubscriber.csproj"

COPY . .

RUN dotnet publish "MqBench.GcpPubSub.PushSubscriber/MqBench.GcpPubSub.PushSubscriber.csproj" \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MqBench.GcpPubSub.PushSubscriber.dll"]
