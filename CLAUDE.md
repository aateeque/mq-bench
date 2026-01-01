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
