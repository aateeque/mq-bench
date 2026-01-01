import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export function createPubSubResources(
    project: gcp.organizations.Project,
    apis: gcp.projects.Service[]
) {
    // Main benchmarking topic
    const topic = new gcp.pubsub.Topic(
        "mq-bench-topic",
        {
            project: project.projectId,
            name: "mq-bench-topic",
            messageRetentionDuration: "86400s", // 24 hours
            labels: {
                purpose: "benchmarking",
            },
        },
        { dependsOn: apis }
    );

    // Pull subscription for pull-based benchmarking
    const pullSubscription = new gcp.pubsub.Subscription("mq-bench-pull-sub", {
        project: project.projectId,
        name: "mq-bench-pull-subscription",
        topic: topic.name,
        ackDeadlineSeconds: 60,
        messageRetentionDuration: "1200s", // 20 minutes
        retainAckedMessages: false,
        enableExactlyOnceDelivery: false, // For performance benchmarking
        expirationPolicy: {
            ttl: "", // Never expires
        },
        labels: {
            type: "pull",
        },
    });

    // Dead letter topic for failed messages
    const deadLetterTopic = new gcp.pubsub.Topic(
        "mq-bench-dlq",
        {
            project: project.projectId,
            name: "mq-bench-dead-letter",
        },
        { dependsOn: apis }
    );

    return {
        topic,
        pullSubscription,
        deadLetterTopic,
        projectId: project.projectId,
    };
}

// Create push subscription after K8s LoadBalancer is ready
export function createPushSubscription(
    project: gcp.organizations.Project,
    topic: gcp.pubsub.Topic,
    pushEndpoint: pulumi.Output<string>,
    benchmarkSaEmail: pulumi.Output<string>
) {
    const pushSubscription = new gcp.pubsub.Subscription("mq-bench-push-sub", {
        project: project.projectId,
        name: "mq-bench-push-subscription",
        topic: topic.name,
        ackDeadlineSeconds: 60,
        messageRetentionDuration: "1200s",
        retainAckedMessages: false,
        pushConfig: {
            pushEndpoint: pushEndpoint,
            oidcToken: {
                serviceAccountEmail: benchmarkSaEmail,
            },
        },
        labels: {
            type: "push",
        },
    });

    return pushSubscription;
}
