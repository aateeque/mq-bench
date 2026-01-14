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

    return { gkeNodeSa, benchmarkSa };
}

// Separate function to create Workload Identity binding after GKE cluster exists
export function createWorkloadIdentityBinding(
    project: gcp.organizations.Project,
    benchmarkSa: gcp.serviceaccount.Account,
    gkeCluster: gcp.container.Cluster
) {
    // Workload Identity binding
    // Allows K8s SA "mq-bench/benchmark-sa" to impersonate GCP SA
    // Must depend on GKE cluster since the identity pool is created by GKE
    return new gcp.serviceaccount.IAMMember(
        "workload-identity-binding",
        {
            serviceAccountId: benchmarkSa.name,
            role: "roles/iam.workloadIdentityUser",
            member: pulumi.interpolate`serviceAccount:${project.projectId}.svc.id.goog[mq-bench/benchmark-sa]`,
        },
        { dependsOn: [gkeCluster] }
    );
}

// Grant Pub/Sub service account permission to publish to DLQ
// This is the GCP-managed service account used for dead letter delivery
export function createDlqPublisherBinding(
    project: gcp.organizations.Project,
    deadLetterTopic: gcp.pubsub.Topic
) {
    return new gcp.pubsub.TopicIAMMember("dlq-publisher", {
        project: project.projectId,
        topic: deadLetterTopic.name,
        role: "roles/pubsub.publisher",
        member: pulumi.interpolate`serviceAccount:service-${project.number}@gcp-sa-pubsub.iam.gserviceaccount.com`,
    });
}

// GitHub Actions Workload Identity Federation
export function createGitHubActionsIdentity(
    project: gcp.organizations.Project,
    apis: gcp.projects.Service[],
    githubRepo: string // format: "owner/repo"
) {
    // Workload Identity Pool for GitHub Actions
    const pool = new gcp.iam.WorkloadIdentityPool(
        "github-actions-pool",
        {
            project: project.projectId,
            workloadIdentityPoolId: "github-actions",
            displayName: "GitHub Actions",
            description: "Workload Identity Pool for GitHub Actions CI/CD",
        },
        { dependsOn: apis }
    );

    // Workload Identity Provider for GitHub
    const provider = new gcp.iam.WorkloadIdentityPoolProvider(
        "github-actions-provider",
        {
            project: project.projectId,
            workloadIdentityPoolId: pool.workloadIdentityPoolId,
            workloadIdentityPoolProviderId: "github",
            displayName: "GitHub",
            attributeMapping: {
                "google.subject": "assertion.sub",
                "attribute.actor": "assertion.actor",
                "attribute.repository": "assertion.repository",
                "attribute.repository_owner": "assertion.repository_owner",
            },
            attributeCondition: `assertion.repository == "${githubRepo}"`,
            oidc: {
                issuerUri: "https://token.actions.githubusercontent.com",
            },
        }
    );

    // Service account for GitHub Actions
    const githubSa = new gcp.serviceaccount.Account(
        "github-actions-sa",
        {
            project: project.projectId,
            accountId: "github-actions",
            displayName: "GitHub Actions Service Account",
        },
        { dependsOn: apis }
    );

    // IAM roles for GitHub Actions SA
    const githubRoles = [
        "roles/artifactregistry.writer",
        "roles/container.developer",
    ];

    githubRoles.forEach((role, index) => {
        new gcp.projects.IAMMember(`github-actions-${index}`, {
            project: project.projectId,
            role: role,
            member: pulumi.interpolate`serviceAccount:${githubSa.email}`,
        });
    });

    // Allow GitHub Actions to impersonate the service account
    new gcp.serviceaccount.IAMMember("github-actions-wif-binding", {
        serviceAccountId: githubSa.name,
        role: "roles/iam.workloadIdentityUser",
        member: pulumi.interpolate`principalSet://iam.googleapis.com/${pool.name}/attribute.repository/${githubRepo}`,
    });

    return {
        pool,
        provider,
        githubSa,
        // Output for GitHub secrets
        workloadIdentityProvider: pulumi.interpolate`projects/${project.number}/locations/global/workloadIdentityPools/${pool.workloadIdentityPoolId}/providers/${provider.workloadIdentityPoolProviderId}`,
        serviceAccountEmail: githubSa.email,
    };
}
