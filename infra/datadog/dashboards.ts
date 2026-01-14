import * as datadog from "@pulumi/datadog";

export interface DashboardConfig {
  environment: string;
}

export function createBenchmarkDashboards(config: DashboardConfig) {
  const env = config.environment;

  // Template variables for filtering
  const templateVariables = [
    { name: "env", prefix: "env", defaults: [env] },
    { name: "service", prefix: "service", defaults: ["*"] },
    { name: "run_id", prefix: "run_id", defaults: ["*"] },
    { name: "message_size", prefix: "message_size", defaults: ["*"] },
    { name: "concurrency", prefix: "concurrency", defaults: ["*"] },
  ];

  // Main Overview Dashboard
  const overviewDashboard = new datadog.Dashboard("mq-bench-overview", {
    title: "MQ Bench - Overview",
    description:
      "High-level overview of message queue benchmark performance metrics",
    layoutType: "ordered",
    tags: ["team:mq-bench", "env:" + env],
    templateVariables: templateVariables,
    widgets: [
      // Header note
      {
        noteDefinition: {
          content:
            "# MQ Bench Performance Overview\nThis dashboard provides a high-level view of benchmark results across all services.",
          backgroundColor: "blue",
          fontSize: "14",
          textAlign: "left",
          showTick: false,
          tickPos: "50%",
          tickEdge: "left",
        },
      },
      // Key Metrics Group
      {
        groupDefinition: {
          title: "Key Performance Indicators",
          layoutType: "ordered",
          backgroundColor: "vivid_blue",
          widgets: [
            {
              queryValueDefinition: {
                title: "Throughput (msg/s)",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "avg:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Throughput (MB/s)",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                requests: [
                  {
                    q: "avg:mq_bench.throughput.megabytes_per_second{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "P99 Latency (ms)",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                customUnit: "ms",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Total Messages",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "sum:mq_bench.messages.total{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Total Errors",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "sum:mq_bench.messages.errors{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Messages Lost",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "sum:mq_bench.messages.lost{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
          ],
        },
      },
      // Throughput Over Time
      {
        groupDefinition: {
          title: "Throughput Over Time",
          layoutType: "ordered",
          backgroundColor: "green",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Message Throughput by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "auto",
                legendColumns: ["avg", "max", "value"],
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "line",
                    style: {
                      palette: "dog_classic",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: {
                  label: "msg/s",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
            {
              timeseriesDefinition: {
                title: "Data Throughput (MB/s)",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "auto",
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.throughput.megabytes_per_second{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "area",
                    style: {
                      palette: "cool",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: {
                  label: "MB/s",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
          ],
        },
      },
      // Latency Overview
      {
        groupDefinition: {
          title: "Latency Overview",
          layoutType: "ordered",
          backgroundColor: "orange",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Latency Percentiles Over Time",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "auto",
                legendColumns: ["avg", "max", "value"],
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p50_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "green",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.p50_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "P50",
                      },
                    ],
                  },
                  {
                    q: "avg:mq_bench.latency.p95_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "orange",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.p95_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "P95",
                      },
                    ],
                  },
                  {
                    q: "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "red",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "P99",
                      },
                    ],
                  },
                ],
                yaxis: {
                  label: "ms",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
          ],
        },
      },
    ],
  });

  // Latency Dashboard
  const latencyDashboard = new datadog.Dashboard("mq-bench-latency", {
    title: "MQ Bench - Latency Analysis",
    description: "Detailed latency analysis with percentile breakdowns",
    layoutType: "ordered",
    tags: ["team:mq-bench", "env:" + env],
    templateVariables: templateVariables,
    widgets: [
      {
        noteDefinition: {
          content:
            "# Latency Analysis\nDetailed latency metrics including percentile distributions and real-time latency tracking.",
          backgroundColor: "orange",
          fontSize: "14",
          textAlign: "left",
          showTick: false,
          tickPos: "50%",
          tickEdge: "left",
        },
      },
      {
        groupDefinition: {
          title: "Latency Percentiles Summary",
          layoutType: "ordered",
          backgroundColor: "vivid_orange",
          widgets: [
            {
              queryValueDefinition: {
                title: "P50 (Median)",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                customUnit: "ms",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p50_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "P95",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                customUnit: "ms",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p95_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "P99",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                customUnit: "ms",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "P99.9",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                customUnit: "ms",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p999_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Max Latency",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                customUnit: "ms",
                requests: [
                  {
                    q: "max:mq_bench.latency.max_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Latency by Service",
          layoutType: "ordered",
          backgroundColor: "yellow",
          widgets: [
            {
              timeseriesDefinition: {
                title: "P99 Latency by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "horizontal",
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "line",
                    style: {
                      palette: "warm",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: { label: "ms", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "P50 Latency by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "horizontal",
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p50_ms{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "line",
                    style: {
                      palette: "cool",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: { label: "ms", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Percentile Comparison",
          layoutType: "ordered",
          backgroundColor: "purple",
          widgets: [
            {
              timeseriesDefinition: {
                title: "All Latency Percentiles",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "horizontal",
                legendColumns: ["avg", "max", "value"],
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p50_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "green",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.p50_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "P50",
                      },
                    ],
                  },
                  {
                    q: "avg:mq_bench.latency.p95_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "yellow",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.p95_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "P95",
                      },
                    ],
                  },
                  {
                    q: "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "orange",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "P99",
                      },
                    ],
                  },
                  {
                    q: "avg:mq_bench.latency.p999_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "red",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.p999_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "P99.9",
                      },
                    ],
                  },
                  {
                    q: "avg:mq_bench.latency.max_ms{$env,$service,$run_id,$message_size,$concurrency}",
                    displayType: "line",
                    style: {
                      palette: "purple",
                      lineType: "dashed",
                      lineWidth: "thin",
                    },
                    metadatas: [
                      {
                        expression:
                          "avg:mq_bench.latency.max_ms{$env,$service,$run_id,$message_size,$concurrency}",
                        aliasName: "Max",
                      },
                    ],
                  },
                ],
                yaxis: {
                  label: "Latency (ms)",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Real-time Latency Distribution",
          layoutType: "ordered",
          backgroundColor: "pink",
          widgets: [
            {
              heatmapDefinition: {
                title: "Latency Distribution Heatmap",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.latency.realtime_ms{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    style: { palette: "dog_classic" },
                  },
                ],
                yaxis: { includeZero: true },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Latency by Configuration",
          layoutType: "ordered",
          backgroundColor: "gray",
          widgets: [
            {
              timeseriesDefinition: {
                title: "P99 Latency by Message Size",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency} by {message_size}",
                    displayType: "bars",
                    style: { palette: "warm" },
                  },
                ],
                yaxis: { label: "ms", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "P99 Latency by Concurrency",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.latency.p99_ms{$env,$service,$run_id,$message_size,$concurrency} by {concurrency}",
                    displayType: "bars",
                    style: { palette: "cool" },
                  },
                ],
                yaxis: { label: "ms", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
    ],
  });

  // Throughput Dashboard
  const throughputDashboard = new datadog.Dashboard("mq-bench-throughput", {
    title: "MQ Bench - Throughput Analysis",
    description:
      "Detailed throughput analysis including message rates and data volumes",
    layoutType: "ordered",
    tags: ["team:mq-bench", "env:" + env],
    templateVariables: templateVariables,
    widgets: [
      {
        noteDefinition: {
          content:
            "# Throughput Analysis\nDetailed analysis of message throughput and data transfer rates.",
          backgroundColor: "green",
          fontSize: "14",
          textAlign: "left",
          showTick: false,
          tickPos: "50%",
          tickEdge: "left",
        },
      },
      {
        groupDefinition: {
          title: "Throughput Summary",
          layoutType: "ordered",
          backgroundColor: "vivid_green",
          widgets: [
            {
              queryValueDefinition: {
                title: "Peak Messages/Second",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "max:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "max",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Avg Messages/Second",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "avg:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "avg",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Peak MB/Second",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                customUnit: "MB/s",
                requests: [
                  {
                    q: "max:mq_bench.throughput.megabytes_per_second{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "max",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Total Bytes Processed",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 2,
                requests: [
                  {
                    q: "sum:mq_bench.bytes.processed{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "sum",
                  },
                ],
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Message Throughput Over Time",
          layoutType: "ordered",
          backgroundColor: "blue",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Messages per Second by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "horizontal",
                legendColumns: ["avg", "max", "value"],
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "line",
                    style: {
                      palette: "dog_classic",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: { label: "msg/s", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "Messages per Second by Run",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "auto",
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency} by {run_id}",
                    displayType: "bars",
                    style: { palette: "semantic" },
                  },
                ],
                yaxis: { label: "msg/s", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Data Throughput",
          layoutType: "ordered",
          backgroundColor: "purple",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Data Throughput (MB/s) by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "horizontal",
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.throughput.megabytes_per_second{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "area",
                    style: {
                      palette: "cool",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: { label: "MB/s", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "Cumulative Bytes Processed",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "cumsum(sum:mq_bench.bytes.processed{$env,$service,$run_id,$message_size,$concurrency} by {service})",
                    displayType: "line",
                    style: {
                      palette: "warm",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: { label: "bytes", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Throughput by Configuration",
          layoutType: "ordered",
          backgroundColor: "orange",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Throughput by Message Size",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency} by {message_size}",
                    displayType: "bars",
                    style: { palette: "warm" },
                  },
                ],
                yaxis: { label: "msg/s", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "Throughput by Concurrency Level",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.throughput.messages_per_second{$env,$service,$run_id,$message_size,$concurrency} by {concurrency}",
                    displayType: "bars",
                    style: { palette: "cool" },
                  },
                ],
                yaxis: { label: "msg/s", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Top Performing Runs",
          layoutType: "ordered",
          backgroundColor: "vivid_purple",
          widgets: [
            {
              toplistDefinition: {
                title: "Top 10 Runs by Throughput",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                requests: [
                  {
                    q: "top(avg:mq_bench.throughput.messages_per_second{$env,$service,$message_size,$concurrency} by {run_id}, 10, 'max', 'desc')",
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });

  // Reliability Dashboard
  const reliabilityDashboard = new datadog.Dashboard("mq-bench-reliability", {
    title: "MQ Bench - Reliability & Errors",
    description:
      "Message reliability metrics including errors, losses, and tracking",
    layoutType: "ordered",
    tags: ["team:mq-bench", "env:" + env],
    templateVariables: templateVariables,
    widgets: [
      {
        noteDefinition: {
          content:
            "# Reliability & Error Tracking\nMonitor message delivery reliability, errors, and loss rates.",
          backgroundColor: "red",
          fontSize: "14",
          textAlign: "left",
          showTick: false,
          tickPos: "50%",
          tickEdge: "left",
        },
      },
      {
        groupDefinition: {
          title: "Reliability Summary",
          layoutType: "ordered",
          backgroundColor: "vivid_pink",
          widgets: [
            {
              queryValueDefinition: {
                title: "Total Messages Processed",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "sum:mq_bench.messages.total{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "sum",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Total Errors",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "sum:mq_bench.messages.errors{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "sum",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Messages Lost",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 0,
                requests: [
                  {
                    q: "sum:mq_bench.messages.lost{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "sum",
                  },
                ],
              },
            },
            {
              queryValueDefinition: {
                title: "Test Duration (s)",
                titleSize: "16",
                titleAlign: "left",
                liveSpan: "1d",
                autoscale: true,
                precision: 1,
                customUnit: "s",
                requests: [
                  {
                    q: "avg:mq_bench.duration.seconds{$env,$service,$run_id,$message_size,$concurrency}",
                    aggregator: "last",
                  },
                ],
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Error Tracking",
          layoutType: "ordered",
          backgroundColor: "red",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Errors Over Time by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "horizontal",
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.errors{$env,$service,$run_id,$message_size,$concurrency} by {service}.as_count()",
                    displayType: "bars",
                    style: {
                      palette: "warm",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: { label: "errors", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "Error Rate (incremental)",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.error{$env,$service,$run_id,$message_size,$concurrency} by {service}.as_count()",
                    displayType: "line",
                    style: {
                      palette: "orange",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: { label: "errors", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Message Loss Tracking",
          layoutType: "ordered",
          backgroundColor: "vivid_orange",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Messages Lost Over Time",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.lost{$env,$service,$run_id,$message_size,$concurrency} by {service}.as_count()",
                    displayType: "bars",
                    style: { palette: "red" },
                  },
                ],
                yaxis: {
                  label: "messages",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
            {
              timeseriesDefinition: {
                title: "Messages Lost by Run",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.lost{$env,$service,$run_id,$message_size,$concurrency} by {run_id}.as_count()",
                    displayType: "bars",
                    style: { palette: "warm" },
                  },
                ],
                yaxis: {
                  label: "messages",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Message Processing",
          layoutType: "ordered",
          backgroundColor: "green",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Messages Processed Over Time",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                legendLayout: "horizontal",
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.processed{$env,$service,$run_id,$message_size,$concurrency} by {service}.as_count()",
                    displayType: "area",
                    style: {
                      palette: "cool",
                      lineType: "solid",
                      lineWidth: "normal",
                    },
                  },
                ],
                yaxis: {
                  label: "messages",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
            {
              timeseriesDefinition: {
                title: "Total Messages by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.total{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "bars",
                    style: { palette: "dog_classic" },
                  },
                ],
                yaxis: {
                  label: "messages",
                  scale: "linear",
                  includeZero: true,
                },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Reliability by Configuration",
          layoutType: "ordered",
          backgroundColor: "gray",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Errors by Message Size",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.errors{$env,$service,$run_id,$message_size,$concurrency} by {message_size}",
                    displayType: "bars",
                    style: { palette: "warm" },
                  },
                ],
                yaxis: { label: "errors", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "Errors by Concurrency Level",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "sum:mq_bench.messages.errors{$env,$service,$run_id,$message_size,$concurrency} by {concurrency}",
                    displayType: "bars",
                    style: { palette: "cool" },
                  },
                ],
                yaxis: { label: "errors", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
      {
        groupDefinition: {
          title: "Test Duration Analysis",
          layoutType: "ordered",
          backgroundColor: "blue",
          widgets: [
            {
              timeseriesDefinition: {
                title: "Test Duration by Run",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.duration.seconds{$env,$service,$run_id,$message_size,$concurrency} by {run_id}",
                    displayType: "bars",
                    style: { palette: "purple" },
                  },
                ],
                yaxis: { label: "seconds", scale: "linear", includeZero: true },
              },
            },
            {
              timeseriesDefinition: {
                title: "Test Duration by Service",
                titleSize: "16",
                titleAlign: "left",
                showLegend: true,
                liveSpan: "1d",
                requests: [
                  {
                    q: "avg:mq_bench.duration.seconds{$env,$service,$run_id,$message_size,$concurrency} by {service}",
                    displayType: "bars",
                    style: { palette: "cool" },
                  },
                ],
                yaxis: { label: "seconds", scale: "linear", includeZero: true },
              },
            },
          ],
        },
      },
    ],
  });

  // Create a Dashboard List to organize all dashboards
  const dashboardList = new datadog.DashboardList(
    "mq-bench-dashboards",
    {
      name: "MQ Bench Dashboards",
      dashItems: [
        { type: "custom_timeboard", dashId: overviewDashboard.id },
        { type: "custom_timeboard", dashId: latencyDashboard.id },
        { type: "custom_timeboard", dashId: throughputDashboard.id },
        { type: "custom_timeboard", dashId: reliabilityDashboard.id },
      ],
    },
    {
      dependsOn: [
        overviewDashboard,
        latencyDashboard,
        throughputDashboard,
        reliabilityDashboard,
      ],
    },
  );

  return {
    overviewDashboard,
    latencyDashboard,
    throughputDashboard,
    reliabilityDashboard,
    dashboardList,
    overviewDashboardUrl: overviewDashboard.url,
    latencyDashboardUrl: latencyDashboard.url,
    throughputDashboardUrl: throughputDashboard.url,
    reliabilityDashboardUrl: reliabilityDashboard.url,
  };
}
