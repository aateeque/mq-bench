import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function createPublisherDeployment(
    provider: k8s.Provider,
    namespace: k8s.core.v1.Namespace,
    k8sSa: k8s.core.v1.ServiceAccount,
    imageUri: pulumi.Output<string>,
    projectId: pulumi.Output<string>,
    topicName: pulumi.Output<string>
) {
    const deployment = new k8s.apps.v1.Deployment(
        "publisher",
        {
            metadata: {
                name: "mq-bench-publisher",
                namespace: namespace.metadata.name,
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: { app: "mq-bench-publisher" },
                },
                template: {
                    metadata: {
                        labels: { app: "mq-bench-publisher" },
                    },
                    spec: {
                        serviceAccountName: k8sSa.metadata.name,
                        containers: [
                            {
                                name: "publisher",
                                image: pulumi.interpolate`${imageUri}/publisher:latest`,
                                env: [
                                    { name: "GCP_PROJECT_ID", value: projectId },
                                    { name: "PUBSUB_TOPIC", value: topicName },
                                    { name: "MESSAGE_COUNT", value: "100000" },
                                    { name: "MESSAGE_SIZE_BYTES", value: "1024" },
                                    { name: "CONCURRENCY_LEVEL", value: "10" },
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
