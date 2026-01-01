import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export function createNamespace(
    provider: k8s.Provider,
    benchmarkSa: gcp.serviceaccount.Account
) {
    const namespace = new k8s.core.v1.Namespace(
        "mq-bench",
        {
            metadata: {
                name: "mq-bench",
            },
        },
        { provider }
    );

    // Kubernetes service account with Workload Identity annotation
    const k8sSa = new k8s.core.v1.ServiceAccount(
        "benchmark-sa",
        {
            metadata: {
                name: "benchmark-sa",
                namespace: namespace.metadata.name,
                annotations: {
                    "iam.gke.io/gcp-service-account": benchmarkSa.email,
                },
            },
        },
        { provider }
    );

    return { namespace, k8sSa };
}
