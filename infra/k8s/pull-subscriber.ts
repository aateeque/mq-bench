import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function createPullSubscriberDeployment(
    provider: k8s.Provider,
    namespace: k8s.core.v1.Namespace,
    k8sSa: k8s.core.v1.ServiceAccount,
    imageUri: pulumi.Output<string>,
    projectId: pulumi.Output<string>,
    subscriptionName: pulumi.Output<string>
) {
    const deployment = new k8s.apps.v1.Deployment(
        "pull-subscriber",
        {
            metadata: {
                name: "mq-bench-pull-subscriber",
                namespace: namespace.metadata.name,
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: { app: "mq-bench-pull-subscriber" },
                },
                template: {
                    metadata: {
                        labels: { app: "mq-bench-pull-subscriber" },
                    },
                    spec: {
                        serviceAccountName: k8sSa.metadata.name,
                        containers: [
                            {
                                name: "pull-subscriber",
                                image: pulumi.interpolate`${imageUri}/pull-subscriber:latest`,
                                env: [
                                    { name: "GCP_PROJECT_ID", value: projectId },
                                    { name: "PUBSUB_SUBSCRIPTION", value: subscriptionName },
                                    { name: "MESSAGE_COUNT", value: "100000" },
                                    { name: "DD_AGENT_HOST", value: "datadog-agent.mq-bench.svc.cluster.local" },
                                    { name: "DD_DOGSTATSD_PORT", value: "8125" },
                                    { name: "DD_ENABLED", value: "true" },
                                    { name: "ENABLE_MESSAGE_TRACKING", value: "true" },
                                ],
                                resources: {
                                    requests: { cpu: "500m", memory: "512Mi" },
                                    limits: { cpu: "2000m", memory: "2Gi" },
                                },
                            },
                        ],
                    },
                },
            },
        },
        { provider }
    );

    return deployment;
}
