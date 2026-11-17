import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
    signIn,
    signOut,
    getCurrentUser,
    fetchAuthSession,
} from "aws-amplify/auth";

import { getTasks } from "./services/tasksApi";
import type { Task } from "./services/tasksApi";

function App() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [error, setError] = useState("");

    async function loadTasks() {
        setTasksLoading(true);
        setError("");

        try {
            const result = await getTasks();
            setTasks(result);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load tasks",
            );
        } finally {
            setTasksLoading(false);
        }
    }

    useEffect(() => {
        let active = true;

        async function checkSession() {
            try {
                const user = await getCurrentUser();
                const session = await fetchAuthSession();

                if (active && session.tokens?.idToken) {
                    setCurrentUser(user.username);
                }
            } catch {
                if (active) setCurrentUser(null);
            } finally {
                if (active) setLoading(false);
            }
        }

        void checkSession();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        let active = true;

        async function fetchTasks() {
            setTasksLoading(true);
            setError("");

            try {
                const result = await getTasks();
                if (active) setTasks(result);
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load tasks",
                    );
                }
            } finally {
                if (active) setTasksLoading(false);
            }
        }

        void fetchTasks();

        return () => {
            active = false;
        };
    }, [currentUser]);

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn({
                username,
                password,
                options: {
                    authFlowType: "USER_SRP_AUTH",
                },
            });

            if (result.isSignedIn) {
                const user = await getCurrentUser();
                setTasks([]);
                setCurrentUser(user.username);
                setPassword("");
            } else {
                setError(
                    `Additional sign-in step: ${result.nextStep.signInStep}`,
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        setError("");
        setLoading(true);

        try {
            await signOut();
            setTasks([]);
            setCurrentUser(null);
            setPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Logout failed");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <main className="container">
                <p>Loading...</p>
            </main>
        );
    }

    if (!currentUser) {
        return (
            <main className="container">
                <h1>Task Management</h1>
                <p>Sign in with your Cognito account</p>

                <form onSubmit={handleLogin}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit">Login</button>
                </form>

                {error && <p role="alert">{error}</p>}
            </main>
        );
    }

    return (
        <main className="container">
            <h1>Task Management Dashboard</h1>
            <p>Welcome, {currentUser}!</p>

            <button onClick={handleLogout}>Logout</button>

            <h2>My Tasks</h2>

            <button onClick={() => void loadTasks()}>Refresh Tasks</button>

            {tasksLoading && <p>Loading tasks...</p>}

            {error && <p role="alert">{error}</p>}

            {!tasksLoading && !error && tasks.length === 0 && (
                <p>No tasks found.</p>
            )}

            {!tasksLoading && (
                <ul className="task-list">
                    {tasks.map((task) => (
                        <li key={task.taskId} className="task-item">
                            <strong>{task.title}</strong>
                            <span>{task.status.replaceAll("_", " ")}</span>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}

export default App;
