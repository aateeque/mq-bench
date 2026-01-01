import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";

import { createProject } from "./project";
import { enableApis } from "./apis";
import { createNetworking } from "./networking";
import { createServiceAccounts } from "./iam";
import { createGkeCluster } from "./gke";
import { createPubSubResources, createPushSubscription } from "./pubsub";
import { createArtifactRegistry } from "./artifact-registry";
import { createNamespace } from "./k8s/namespace";
import { createPublisherDeployment } from "./k8s/publisher";
import { createPullSubscriberDeployment } from "./k8s/pull-subscriber";
import { createPushSubscriberDeployment } from "./k8s/push-subscriber";

// Create GCP project
const project = createProject();

// Enable required APIs
const apis = enableApis(project);

// Create networking (VPC, subnets)
const networking = createNetworking(project, apis);

// Create service accounts and IAM bindings
const serviceAccounts = createServiceAccounts(project, apis);

// Create Artifact Registry for Docker images
const artifactRegistry = createArtifactRegistry(project, apis);

// Create GKE cluster
const gkeCluster = createGkeCluster(project, apis, networking, serviceAccounts);

// Create Pub/Sub topic and pull subscription
const pubsub = createPubSubResources(project, apis);

// Create Kubernetes provider using GKE cluster credentials
const k8sProvider = new k8s.Provider("gke-k8s", {
    kubeconfig: pulumi
        .all([gkeCluster.name, gkeCluster.endpoint, gkeCluster.masterAuth])
        .apply(([name, endpoint, masterAuth]) => {
            const context = `gke_${project.projectId}_${networking.region}_${name}`;
            return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${masterAuth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin for use with kubectl by following https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke
      provideClusterInfo: true
`;
        }),
});

// Create Kubernetes namespace and service account
const { namespace, k8sSa } = createNamespace(
    k8sProvider,
    serviceAccounts.benchmarkSa
);

// Create Kubernetes deployments
const publisherDeployment = createPublisherDeployment(
    k8sProvider,
    namespace,
    k8sSa,
    artifactRegistry.registryUri,
    project.projectId,
    pubsub.topic.name
);

const pullSubscriberDeployment = createPullSubscriberDeployment(
    k8sProvider,
    namespace,
    k8sSa,
    artifactRegistry.registryUri,
    project.projectId,
    pubsub.pullSubscription.name
);

const pushSubscriber = createPushSubscriberDeployment(
    k8sProvider,
    namespace,
    k8sSa,
    artifactRegistry.registryUri,
    project.projectId
);

// Create push subscription after LoadBalancer is ready
const pushEndpoint = pushSubscriber.service.status.apply((status) => {
    const ingress = status?.loadBalancer?.ingress?.[0];
    if (ingress?.ip) {
        return `http://${ingress.ip}/push`;
    }
    return "http://placeholder.example.com/push";
});

const pushSubscription = createPushSubscription(
    project,
    pubsub.topic,
    pushEndpoint,
    serviceAccounts.benchmarkSa.email
);

// Exports
export const projectId = project.projectId;
export const gkeClusterName = gkeCluster.name;
export const gkeEndpoint = gkeCluster.endpoint;
export const topicName = pubsub.topic.name;
export const pullSubscriptionName = pubsub.pullSubscription.name;
export const pushSubscriptionName = pushSubscription.name;
export const artifactRegistryUrl = artifactRegistry.registryUri;
export const pushSubscriberIp = pushSubscriber.service.status.apply(
    (status) => status?.loadBalancer?.ingress?.[0]?.ip ?? "pending"
);
