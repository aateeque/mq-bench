# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mq-bench is a test harness for:

* google pub/sub
* rabbitMQ in gcp
* zero MQ in GCP
* mqtt in gcp

We are looking to benchmark these middlewares across GKE services for:

* throughput
* latency
* volume
* reliability
* cost

Bonus metrics:

* durability
* scalability

## Repository Structure

* `src/`: Contains the source code for the benchmarking tools.
* each technology has a subfolder with relevant code and configuration files.
* `infra/`: IaC in Pulumi for deploying the necessary GCP infrastructure

## Tech choices

### IaC

We use Pulumi with Typescript for infrastructure as code. This allows us to programmatically define and manage GCP resources.

### Programming Language

We code our benchmarking tools in C# (.NET 9 & .NET 10) as mainly a dotnet team. Use BenchmarkDotNet where applicable.

### Containerization

We use Docker to containerize our applications for consistent deployment across GKE clusters.

## Build Commands

### C# Benchmarking Applications

```bash
# Build all projects
cd src/gcp-pubsub && dotnet build

# Run publisher locally (requires GCP credentials)
dotnet run --project src/gcp-pubsub/MqBench.GcpPubSub.Publisher

# Run with BenchmarkDotNet formal benchmarks
dotnet run --project src/gcp-pubsub/MqBench.GcpPubSub.Publisher -- --benchmark

# Build Docker images (from src/gcp-pubsub directory)
docker build -t mq-bench-publisher -f MqBench.GcpPubSub.Publisher/Dockerfile .
docker build -t mq-bench-pull-subscriber -f MqBench.GcpPubSub.PullSubscriber/Dockerfile .
docker build -t mq-bench-push-subscriber -f MqBench.GcpPubSub.PushSubscriber/Dockerfile .
```

### Infrastructure (Pulumi)

```bash
# Install dependencies
cd infra && npm install

# Configure (edit Pulumi.dev.yaml with your GCP project ID and billing account)

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

## Environment Variables

The benchmarking applications use these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `GCP_PROJECT_ID` | GCP project ID | (required) |
| `PUBSUB_TOPIC` | Pub/Sub topic name | `mq-bench-topic` |
| `PUBSUB_SUBSCRIPTION` | Pub/Sub subscription name | (required for subscribers) |
| `MESSAGE_COUNT` | Number of messages to send/receive | `100000` |
| `MESSAGE_SIZE_BYTES` | Size of message payload | `1024` |
| `CONCURRENCY_LEVEL` | Number of concurrent operations | `10` |
| `TEST_DURATION_SECONDS` | Maximum test duration in seconds | `300` (5 minutes) |

## Coding Conventions

### Concurrency

- **Use lock-free code**: Prefer `Interlocked` operations and concurrent collections over locks
- Use `Interlocked.CompareExchange`, `Interlocked.Increment`, etc. for atomic operations
- Use `ConcurrentDictionary`, `ConcurrentQueue`, etc. when thread-safe collections are needed
- Avoid `lock` statements and `Monitor` class
- Use `SemaphoreSlim` for limiting concurrency (not for mutual exclusion)
