import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function createPushSubscriberDeployment(
    provider: k8s.Provider,
    namespace: k8s.core.v1.Namespace,
    k8sSa: k8s.core.v1.ServiceAccount,
    imageUri: pulumi.Output<string>,
    projectId: pulumi.Output<string>
) {
    const deployment = new k8s.apps.v1.Deployment(
        "push-subscriber",
        {
            metadata: {
                name: "mq-bench-push-subscriber",
                namespace: namespace.metadata.name,
            },
            spec: {
                replicas: 2,
                selector: {
                    matchLabels: { app: "mq-bench-push-subscriber" },
                },
                template: {
                    metadata: {
                        labels: { app: "mq-bench-push-subscriber" },
                    },
                    spec: {
                        serviceAccountName: k8sSa.metadata.name,
                        containers: [
                            {
                                name: "push-subscriber",
                                image: pulumi.interpolate`${imageUri}/push-subscriber:latest`,
                                ports: [{ containerPort: 8080, name: "http" }],
                                env: [
                                    { name: "GCP_PROJECT_ID", value: projectId },
                                    { name: "ASPNETCORE_URLS", value: "http://+:8080" },
                                ],
                                resources: {
                                    requests: { cpu: "500m", memory: "512Mi" },
                                    limits: { cpu: "2000m", memory: "2Gi" },
                                },
                                readinessProbe: {
                                    httpGet: { path: "/health", port: 8080 },
                                    initialDelaySeconds: 5,
                                    periodSeconds: 10,
                                },
                                livenessProbe: {
                                    httpGet: { path: "/health", port: 8080 },
                                    initialDelaySeconds: 15,
                                    periodSeconds: 20,
                                },
                            },
                        ],
                    },
                },
            },
        },
        { provider }
    );

    // LoadBalancer service for push endpoint
    const service = new k8s.core.v1.Service(
        "push-subscriber-svc",
        {
            metadata: {
                name: "mq-bench-push-subscriber",
                namespace: namespace.metadata.name,
            },
            spec: {
                type: "LoadBalancer",
                selector: { app: "mq-bench-push-subscriber" },
                ports: [
                    {
                        port: 80,
                        targetPort: 8080,
                        protocol: "TCP",
                    },
                ],
            },
        },
        { provider }
    );

    return { deployment, service };
}
