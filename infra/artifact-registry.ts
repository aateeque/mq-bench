import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const gcpConfig = new pulumi.Config("gcp");
const region = gcpConfig.get("region") || "us-central1";

export function createArtifactRegistry(
    project: gcp.organizations.Project,
    apis: gcp.projects.Service[]
) {
    const repository = new gcp.artifactregistry.Repository(
        "mq-bench-repo",
        {
            project: project.projectId,
            location: region,
            repositoryId: "mq-bench",
            format: "DOCKER",
            description: "Docker images for mq-bench benchmarking",
            labels: {
                purpose: "benchmarking",
            },
        },
        { dependsOn: apis }
    );

    // Export the registry URI for Docker push
    const registryUri = pulumi.interpolate`${region}-docker.pkg.dev/${project.projectId}/mq-bench`;

    return { repository, registryUri };
}
