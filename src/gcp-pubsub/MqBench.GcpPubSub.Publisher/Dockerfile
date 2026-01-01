FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["MqBench.GcpPubSub.Common/MqBench.GcpPubSub.Common.csproj", "MqBench.GcpPubSub.Common/"]
COPY ["MqBench.GcpPubSub.Publisher/MqBench.GcpPubSub.Publisher.csproj", "MqBench.GcpPubSub.Publisher/"]
COPY ["Directory.Build.props", "."]

# Restore
RUN dotnet restore "MqBench.GcpPubSub.Publisher/MqBench.GcpPubSub.Publisher.csproj"

# Copy source
COPY . .

# Build
RUN dotnet publish "MqBench.GcpPubSub.Publisher/MqBench.GcpPubSub.Publisher.csproj" \
    -c Release -o /app/publish --no-restore

# Runtime image
FROM mcr.microsoft.com/dotnet/runtime:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MqBench.GcpPubSub.Publisher.dll"]
