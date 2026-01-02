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

The project spings up GKE services written in C# .NET & sends messages around the network and measures the above metrics.

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

### Comments

Do not write verbose comments in code; comments should ONLY be written for esoteric or non-obvious logic. Code should be self-explanatory through clear naming and structure.

## Workflow

You MUST ensure that you maintain the following files:

* `.claude/worklog.md` - This file is your rolling worklog. Everytime you finish a task fully, add an entry here with date, time spend a short description of what you did.
* `.claude/todo.md` - This file is your rolling todo list. Everytime you think of something that needs to be done, add it here with a short description.
* `.claude/tasks.md` - This file is your rolling milestones list. Everytime you break down a large task into smaller tasks, add the smaller tasks here with a short description with the milestone they belong to. Track the status of each task (not started, in progress, completed).
* `.claude/notes.md` - This file is your rolling notes file. Everytime you learn something new, have an idea, or need to remember something, add it here with a short description.

When you start working on a new task, pick one from the `.claude/tasks.md` file, mark it as "in progress", and start working on it. When you finish it, mark it as "completed" and add an entry to the `.claude/worklog.md` file.

When you think of something new that needs to be done, add it to the `.claude/todo.md` file. When you break down a large task into smaller tasks, add the smaller tasks to the `.claude/tasks.md` file.

### Cataloging progress

To determine what are the *items* you should be writing in the above files, you should determine the *units of work* that you are doing. A *unit of work* is a small, self-contained piece of work that can be completed in a short amount of time (e.g., 30 minutes to 2 hours). These units of work are discrete and should be testable on their own. I should be able to follow along with your worklog and see the progress you are making towards completing the overall project using these units of work. I can also dictate new units of work to you as needed.
