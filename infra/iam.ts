import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export function createServiceAccounts(
    project: gcp.organizations.Project,
    apis: gcp.projects.Service[]
) {
    // Service account for GKE nodes
    const gkeNodeSa = new gcp.serviceaccount.Account(
        "gke-node-sa",
        {
            project: project.projectId,
            accountId: "gke-node-sa",
            displayName: "GKE Node Service Account",
        },
        { dependsOn: apis }
    );

    // Service account for benchmark workloads (Workload Identity)
    const benchmarkSa = new gcp.serviceaccount.Account(
        "benchmark-sa",
        {
            project: project.projectId,
            accountId: "mq-bench-workload",
            displayName: "MQ Bench Workload Service Account",
        },
        { dependsOn: apis }
    );

    // IAM bindings for GKE node SA
    const gkeNodeRoles = [
        "roles/logging.logWriter",
        "roles/monitoring.metricWriter",
        "roles/monitoring.viewer",
        "roles/artifactregistry.reader",
    ];

    gkeNodeRoles.forEach((role, index) => {
        new gcp.projects.IAMMember(`gke-node-${index}`, {
            project: project.projectId,
            role: role,
            member: pulumi.interpolate`serviceAccount:${gkeNodeSa.email}`,
        });
    });

    // IAM bindings for benchmark workload SA
    const benchmarkRoles = [
        "roles/pubsub.publisher",
        "roles/pubsub.subscriber",
        "roles/monitoring.metricWriter",
    ];

    benchmarkRoles.forEach((role, index) => {
        new gcp.projects.IAMMember(`benchmark-${index}`, {
            project: project.projectId,
            role: role,
            member: pulumi.interpolate`serviceAccount:${benchmarkSa.email}`,
        });
    });

    // Workload Identity binding
    // Allows K8s SA "mq-bench/benchmark-sa" to impersonate GCP SA
    const workloadIdentityBinding = new gcp.serviceaccount.IAMMember(
        "workload-identity-binding",
        {
            serviceAccountId: benchmarkSa.name,
            role: "roles/iam.workloadIdentityUser",
            member: pulumi.interpolate`serviceAccount:${project.projectId}.svc.id.goog[mq-bench/benchmark-sa]`,
        }
    );

    return { gkeNodeSa, benchmarkSa, workloadIdentityBinding };
}
