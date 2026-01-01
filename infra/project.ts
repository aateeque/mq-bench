import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export function createProject() {
    const projectId = config.require("projectId");
    const billingAccount = config.require("billingAccount");
    const orgId = config.get("orgId");
    const folderId = config.get("folderId");

    const project = new gcp.organizations.Project("mq-bench-pubsub", {
        name: "mq-bench-pubsub",
        projectId: projectId,
        billingAccount: billingAccount,
        orgId: orgId,
        folderId: folderId,
        autoCreateNetwork: false,
        deletionPolicy: "DELETE",
        labels: {
            purpose: "benchmarking",
            "managed-by": "pulumi",
        },
    });

    return project;
}
