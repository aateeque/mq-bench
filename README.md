# mq-bench

A benchmarking tool for message queuing systems in GCP.

## Overview

mq-bench is a test harness designed to benchmark various message queuing middlewares in Google Cloud Platform (GCP). The tool focuses on evaluating the performance of Google Pub/Sub, RabbitMQ, ZeroMQ, and MQTT across Google Kubernetes Engine (GKE) services.

The primary metrics assessed include throughput, latency, volume, reliability, cost, durability, and scalability.

## Features

- Supports multiple message queuing systems: Google Pub/Sub, RabbitMQ, ZeroMQ, and MQTT.
- Benchmarks key performance metrics such as throughput, latency, volume, reliability, cost, durability, and scalability.
- Containerized applications using Docker for consistent deployment.
- Infrastructure as Code (IaC) using Pulumi with TypeScript for managing GCP resources.
- Benchmarking tools developed in C# (.NET 9 & .NET 10) utilizing BenchmarkDotNet where applicable.
