import * as gcp from "@pulumi/gcp";

const requiredApis = [
    "pubsub.googleapis.com",
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
];

export function enableApis(project: gcp.organizations.Project) {
    const enabledApis = requiredApis.map((api) => {
        const serviceName = api.split(".")[0];
        return new gcp.projects.Service(
            `enable-${serviceName}`,
            {
                project: project.projectId,
                service: api,
                disableOnDestroy: false,
                disableDependentServices: false,
            },
            { dependsOn: [project] }
        );
    });

    return enabledApis;
}
