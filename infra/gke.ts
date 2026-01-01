import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const gcpConfig = new pulumi.Config("gcp");
const region = gcpConfig.get("region") || "us-central1";
const useAutopilot = config.get("useAutopilot") === "true";

export function createGkeCluster(
    project: gcp.organizations.Project,
    apis: gcp.projects.Service[],
    networking: {
        vpc: gcp.compute.Network;
        subnet: gcp.compute.Subnetwork;
    },
    serviceAccounts: {
        gkeNodeSa: gcp.serviceaccount.Account;
    }
) {
    if (useAutopilot) {
        // GKE Autopilot cluster
        const cluster = new gcp.container.Cluster(
            "mq-bench-gke",
            {
                project: project.projectId,
                name: "mq-bench-gke",
                location: region,
                enableAutopilot: true,
                network: networking.vpc.name,
                subnetwork: networking.subnet.name,
                ipAllocationPolicy: {
                    clusterSecondaryRangeName: "pods",
                    servicesSecondaryRangeName: "services",
                },
                releaseChannel: {
                    channel: "REGULAR",
                },
                workloadIdentityConfig: {
                    workloadPool: pulumi.interpolate`${project.projectId}.svc.id.goog`,
                },
                privateClusterConfig: {
                    enablePrivateNodes: true,
                    enablePrivateEndpoint: false,
                    masterIpv4CidrBlock: "172.16.0.0/28",
                },
                masterAuthorizedNetworksConfig: {
                    cidrBlocks: [
                        {
                            cidrBlock: "0.0.0.0/0",
                            displayName: "All",
                        },
                    ],
                },
                deletionProtection: false,
            },
            { dependsOn: apis }
        );

        return cluster;
    } else {
        // GKE Standard cluster
        const cluster = new gcp.container.Cluster(
            "mq-bench-gke",
            {
                project: project.projectId,
                name: "mq-bench-gke",
                location: region,
                network: networking.vpc.name,
                subnetwork: networking.subnet.name,
                initialNodeCount: 1,
                removeDefaultNodePool: true,
                ipAllocationPolicy: {
                    clusterSecondaryRangeName: "pods",
                    servicesSecondaryRangeName: "services",
                },
                releaseChannel: {
                    channel: "REGULAR",
                },
                workloadIdentityConfig: {
                    workloadPool: pulumi.interpolate`${project.projectId}.svc.id.goog`,
                },
                privateClusterConfig: {
                    enablePrivateNodes: true,
                    enablePrivateEndpoint: false,
                    masterIpv4CidrBlock: "172.16.0.0/28",
                },
                deletionProtection: false,
            },
            { dependsOn: apis }
        );

        // Node pool for benchmarking
        new gcp.container.NodePool("mq-bench-nodes", {
            project: project.projectId,
            name: "mq-bench-nodes",
            cluster: cluster.name,
            location: region,
            nodeCount: 3,
            nodeConfig: {
                machineType: "e2-standard-4",
                serviceAccount: serviceAccounts.gkeNodeSa.email,
                oauthScopes: ["https://www.googleapis.com/auth/cloud-platform"],
                workloadMetadataConfig: {
                    mode: "GKE_METADATA",
                },
            },
            autoscaling: {
                minNodeCount: 1,
                maxNodeCount: 10,
            },
        });

        return cluster;
    }
}
