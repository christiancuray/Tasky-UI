import { fetchAuthSession } from "aws-amplify/auth";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
    userId: string;
    taskId: string;
    title: string;
    status: TaskStatus;
}

const API_URL = import.meta.env.VITE_API_URL;

async function apiRequest<T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: object,
): Promise<T> {
    if (!API_URL) {
        throw new Error("VITE_API_URL is missing");
    }

    // Get the Cognito ID token from the signed-in session.
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
        throw new Error("Not authenticated. Please log in.");
    }

    // Call the protected API Gateway endpoint.
    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            Authorization: token,
            Accept: "application/json",
            ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
        let message = `Request Failed: HTTP ${response.status}`;

        try {
            const errBody = await response.json();
            if (typeof errBody?.message == "string") {
                message = errBody.message;
            }
        } catch {
            // keep the http status error
        }
        throw new Error(message);
    }
    // DELETE normally returns HTTP 204 with no body.
    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

// Get req
export function getTasks(): Promise<Task[]> {
    return apiRequest<Task[]>("", "GET");
}

// Post req
export function createTask(title: string): Promise<Task> {
    return apiRequest<Task>("", "POST", { title });
}

// Put req
export function updateTask(
    taskId: string,
    title: string,
    status: TaskStatus,
): Promise<Task> {
    return apiRequest<Task>(`/${encodeURIComponent(taskId)}`, "PUT", {
        title,
        status,
    });
}

// Delete req
export function deleteTask(taskId: string): Promise<void> {
    return apiRequest<void>(`/${encodeURIComponent(taskId)}`, "DELETE");
}
