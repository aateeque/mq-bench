import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export function createPubSubResources(
    project: gcp.organizations.Project,
    apis: gcp.projects.Service[]
) {
    const enableExactlyOnce = config.getBoolean("enableExactlyOnce") ?? false;

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

    // Dead letter topic for failed messages
    const deadLetterTopic = new gcp.pubsub.Topic(
        "mq-bench-dlq",
        {
            project: project.projectId,
            name: "mq-bench-dead-letter",
            messageRetentionDuration: "604800s", // 7 days
            labels: {
                purpose: "dead-letter",
            },
        },
        { dependsOn: apis }
    );

    // Pull subscription for pull-based benchmarking with DLQ policy
    const pullSubscription = new gcp.pubsub.Subscription("mq-bench-pull-sub", {
        project: project.projectId,
        name: "mq-bench-pull-subscription",
        topic: topic.name,
        ackDeadlineSeconds: 60,
        messageRetentionDuration: "1200s", // 20 minutes
        retainAckedMessages: false,
        enableExactlyOnceDelivery: enableExactlyOnce,
        expirationPolicy: {
            ttl: "", // Never expires
        },
        deadLetterPolicy: {
            deadLetterTopic: deadLetterTopic.id,
            maxDeliveryAttempts: 5,
        },
        labels: {
            type: "pull",
        },
    });

    // DLQ subscription for consuming failed messages
    const dlqSubscription = new gcp.pubsub.Subscription("mq-bench-dlq-sub", {
        project: project.projectId,
        name: "mq-bench-dlq-subscription",
        topic: deadLetterTopic.name,
        ackDeadlineSeconds: 60,
        messageRetentionDuration: "604800s", // 7 days
        retainAckedMessages: false,
        expirationPolicy: {
            ttl: "", // Never expires
        },
        labels: {
            type: "dlq",
        },
    });

    return {
        topic,
        pullSubscription,
        deadLetterTopic,
        dlqSubscription,
        projectId: project.projectId,
    };
}

// Create push subscription after K8s LoadBalancer is ready
export function createPushSubscription(
    project: gcp.organizations.Project,
    topic: gcp.pubsub.Topic,
    deadLetterTopic: gcp.pubsub.Topic,
    pushEndpoint: pulumi.Output<string>,
    benchmarkSaEmail: pulumi.Output<string>
) {
    const enableExactlyOnce = config.getBoolean("enableExactlyOnce") ?? false;

    const pushSubscription = new gcp.pubsub.Subscription("mq-bench-push-sub", {
        project: project.projectId,
        name: "mq-bench-push-subscription",
        topic: topic.name,
        ackDeadlineSeconds: 60,
        messageRetentionDuration: "1200s",
        retainAckedMessages: false,
        enableExactlyOnceDelivery: enableExactlyOnce,
        pushConfig: {
            pushEndpoint: pushEndpoint,
            oidcToken: {
                serviceAccountEmail: benchmarkSaEmail,
            },
        },
        deadLetterPolicy: {
            deadLetterTopic: deadLetterTopic.id,
            maxDeliveryAttempts: 5,
        },
        labels: {
            type: "push",
        },
    });

    return pushSubscription;
}
