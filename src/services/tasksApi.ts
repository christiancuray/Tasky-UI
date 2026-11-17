import { fetchAuthSession } from "aws-amplify/auth";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
    userId: string;
    taskId: string;
    title: string;
    status: TaskStatus;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function getTasks(): Promise<Task[]> {
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
    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            Authorization: token,
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to load tasks: HTTP ${response.status}`);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("Unexpected API response format");
    }

    return data as Task[];
}
