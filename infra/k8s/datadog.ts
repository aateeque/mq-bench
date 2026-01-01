import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function createDatadogAgent(
    provider: k8s.Provider,
    namespace: k8s.core.v1.Namespace,
    datadogApiKey: pulumi.Output<string>
) {
    // Datadog Agent DaemonSet for metrics collection
    const agent = new k8s.apps.v1.DaemonSet(
        "datadog-agent",
        {
            metadata: {
                name: "datadog-agent",
                namespace: namespace.metadata.name,
                labels: {
                    app: "datadog-agent",
                },
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: "datadog-agent",
                    },
                },
                template: {
                    metadata: {
                        labels: {
                            app: "datadog-agent",
                        },
                    },
                    spec: {
                        serviceAccountName: "datadog-agent",
                        containers: [
                            {
                                name: "datadog-agent",
                                image: "gcr.io/datadoghq/agent:latest",
                                env: [
                                    {
                                        name: "DD_API_KEY",
                                        valueFrom: {
                                            secretKeyRef: {
                                                name: "datadog-secret",
                                                key: "api-key",
                                            },
                                        },
                                    },
                                    {
                                        name: "DD_SITE",
                                        value: "datadoghq.com",
                                    },
                                    {
                                        name: "DD_KUBERNETES_KUBELET_NODENAME",
                                        valueFrom: {
                                            fieldRef: {
                                                fieldPath: "spec.nodeName",
                                            },
                                        },
                                    },
                                    {
                                        name: "DD_DOGSTATSD_NON_LOCAL_TRAFFIC",
                                        value: "true",
                                    },
                                    {
                                        name: "DD_APM_ENABLED",
                                        value: "true",
                                    },
                                    {
                                        name: "DD_LOGS_ENABLED",
                                        value: "true",
                                    },
                                    {
                                        name: "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL",
                                        value: "true",
                                    },
                                ],
                                ports: [
                                    { containerPort: 8125, name: "dogstatsd", protocol: "UDP" },
                                    { containerPort: 8126, name: "apm", protocol: "TCP" },
                                ],
                                resources: {
                                    requests: {
                                        memory: "256Mi",
                                        cpu: "200m",
                                    },
                                    limits: {
                                        memory: "512Mi",
                                        cpu: "500m",
                                    },
                                },
                                volumeMounts: [
                                    {
                                        name: "dockersocket",
                                        mountPath: "/var/run/docker.sock",
                                    },
                                    {
                                        name: "procdir",
                                        mountPath: "/host/proc",
                                        readOnly: true,
                                    },
                                    {
                                        name: "cgroups",
                                        mountPath: "/host/sys/fs/cgroup",
                                        readOnly: true,
                                    },
                                ],
                            },
                        ],
                        volumes: [
                            {
                                name: "dockersocket",
                                hostPath: { path: "/var/run/docker.sock" },
                            },
                            {
                                name: "procdir",
                                hostPath: { path: "/proc" },
                            },
                            {
                                name: "cgroups",
                                hostPath: { path: "/sys/fs/cgroup" },
                            },
                        ],
                    },
                },
            },
        },
        { provider }
    );

    // Service account for Datadog
    const serviceAccount = new k8s.core.v1.ServiceAccount(
        "datadog-agent-sa",
        {
            metadata: {
                name: "datadog-agent",
                namespace: namespace.metadata.name,
            },
        },
        { provider }
    );

    // ClusterRole for Datadog
    const clusterRole = new k8s.rbac.v1.ClusterRole(
        "datadog-agent-role",
        {
            metadata: {
                name: "datadog-agent",
            },
            rules: [
                {
                    apiGroups: [""],
                    resources: ["nodes", "pods", "services", "endpoints", "events"],
                    verbs: ["get", "list", "watch"],
                },
                {
                    apiGroups: [""],
                    resources: ["nodes/metrics", "nodes/spec", "nodes/stats"],
                    verbs: ["get"],
                },
            ],
        },
        { provider }
    );

    // ClusterRoleBinding
    new k8s.rbac.v1.ClusterRoleBinding(
        "datadog-agent-binding",
        {
            metadata: {
                name: "datadog-agent",
            },
            roleRef: {
                apiGroup: "rbac.authorization.k8s.io",
                kind: "ClusterRole",
                name: clusterRole.metadata.name,
            },
            subjects: [
                {
                    kind: "ServiceAccount",
                    name: serviceAccount.metadata.name,
                    namespace: namespace.metadata.name,
                },
            ],
        },
        { provider }
    );

    // Secret for Datadog API key
    const secret = new k8s.core.v1.Secret(
        "datadog-secret",
        {
            metadata: {
                name: "datadog-secret",
                namespace: namespace.metadata.name,
            },
            stringData: {
                "api-key": datadogApiKey,
            },
        },
        { provider }
    );

    // Service for DogStatsD (so pods can send metrics)
    const service = new k8s.core.v1.Service(
        "datadog-agent-svc",
        {
            metadata: {
                name: "datadog-agent",
                namespace: namespace.metadata.name,
            },
            spec: {
                selector: {
                    app: "datadog-agent",
                },
                ports: [
                    { port: 8125, targetPort: 8125, protocol: "UDP", name: "dogstatsd" },
                    { port: 8126, targetPort: 8126, protocol: "TCP", name: "apm" },
                ],
                clusterIP: "None", // Headless service
            },
        },
        { provider }
    );

    return { agent, service, secret };
}
