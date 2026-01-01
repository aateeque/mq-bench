import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("gcp");
const region = config.get("region") || "us-central1";

export function createNetworking(
    project: gcp.organizations.Project,
    apis: gcp.projects.Service[]
) {
    // Create VPC
    const vpc = new gcp.compute.Network(
        "mq-bench-vpc",
        {
            project: project.projectId,
            name: "mq-bench-vpc",
            autoCreateSubnetworks: false,
            description: "VPC for mq-bench benchmarking",
        },
        { dependsOn: apis }
    );

    // Create subnet for GKE with secondary ranges for pods and services
    const subnet = new gcp.compute.Subnetwork("mq-bench-subnet", {
        project: project.projectId,
        name: "mq-bench-gke-subnet",
        region: region,
        network: vpc.id,
        ipCidrRange: "10.0.0.0/20",
        privateIpGoogleAccess: true,
        secondaryIpRanges: [
            {
                rangeName: "pods",
                ipCidrRange: "10.1.0.0/16",
            },
            {
                rangeName: "services",
                ipCidrRange: "10.2.0.0/20",
            },
        ],
    });

    // Cloud Router for NAT
    const router = new gcp.compute.Router("mq-bench-router", {
        project: project.projectId,
        name: "mq-bench-router",
        region: region,
        network: vpc.id,
    });

    // Cloud NAT for private nodes to access internet
    const nat = new gcp.compute.RouterNat("mq-bench-nat", {
        project: project.projectId,
        name: "mq-bench-nat",
        router: router.name,
        region: region,
        natIpAllocateOption: "AUTO_ONLY",
        sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
    });

    return { vpc, subnet, router, nat, region };
}
