import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
    signIn,
    signOut,
    getCurrentUser,
    fetchAuthSession,
} from "aws-amplify/auth";

import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
} from "./services/tasksApi";

import type { Task, TaskStatus } from "./services/tasksApi";

function App() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editStatus, setEditStatus] = useState<TaskStatus>("TODO");

    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

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
                options: { authFlowType: "USER_SRP_AUTH" },
            });

            if (result.isSignedIn) {
                const user = await getCurrentUser();
                setTasks([]);
                setCurrentUser(user.username);
                setPassword("");
            } else {
                setError(
                    `Additional sign-in step required: ${result.nextStep.signInStep}`,
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
            setEditingId(null);
            setNotice("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Logout failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!newTitle.trim() || saving) return;

        setSaving(true);
        setError("");
        setNotice("");

        try {
            await createTask(newTitle.trim());
            setNewTitle("");
            setNotice("Task created successfully!");
            await loadTasks();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create task",
            );
        } finally {
            setSaving(false);
        }
    }

    function startEditing(task: Task) {
        setEditingId(task.taskId);
        setEditTitle(task.title);
        setEditStatus(task.status);
        setError("");
        setNotice("");
    }

    async function handleUpdate(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!editingId || !editTitle.trim() || saving) return;

        setSaving(true);
        setError("");
        setNotice("");

        try {
            await updateTask(editingId, editTitle.trim(), editStatus);
            setEditingId(null);
            setNotice("Task updated successfully!");
            await loadTasks();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update task",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(taskId: string) {
        if (saving) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this task?",
        );

        if (!confirmed) return;

        setSaving(true);
        setError("");
        setNotice("");

        try {
            await deleteTask(taskId);
            if (editingId === taskId) setEditingId(null);
            setNotice("Task deleted successfully!");
            await loadTasks();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to delete task",
            );
        } finally {
            setSaving(false);
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
        <main className="container dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Task Management</h1>
                    <p>Welcome, {currentUser}!</p>
                </div>
                <button onClick={handleLogout} disabled={saving}>
                    Logout
                </button>
            </header>

            <section>
                <h2>Create a Task</h2>
                <form onSubmit={handleCreate}>
                    <label htmlFor="new-title">Task title</label>
                    <input
                        id="new-title"
                        placeholder="What do you need to do?"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={saving}>
                        {saving ? "Please wait..." : "Add Task"}
                    </button>
                </form>
            </section>

            <section>
                <div className="tasks-heading">
                    <h2>My Tasks ({tasks.length})</h2>
                    <button
                        onClick={() => void loadTasks()}
                        disabled={tasksLoading || saving}
                    >
                        Refresh
                    </button>
                </div>

                {notice && <p className="success-message">{notice}</p>}
                {error && <p role="alert">{error}</p>}
                {tasksLoading && <p>Loading tasks...</p>}

                {!tasksLoading && !error && tasks.length === 0 && (
                    <p>No tasks yet. Create your first task above!</p>
                )}

                <ul className="task-list">
                    {tasks.map((task) => (
                        <li key={task.taskId} className="task-item">
                            {editingId === task.taskId ? (
                                <form
                                    className="edit-form"
                                    onSubmit={handleUpdate}
                                >
                                    <label htmlFor={`title-${task.taskId}`}>
                                        Title
                                    </label>
                                    <input
                                        id={`title-${task.taskId}`}
                                        value={editTitle}
                                        onChange={(e) =>
                                            setEditTitle(e.target.value)
                                        }
                                        required
                                    />

                                    <label htmlFor={`status-${task.taskId}`}>
                                        Status
                                    </label>
                                    <select
                                        id={`status-${task.taskId}`}
                                        value={editStatus}
                                        onChange={(e) =>
                                            setEditStatus(
                                                e.target.value as TaskStatus,
                                            )
                                        }
                                    >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">
                                            IN PROGRESS
                                        </option>
                                        <option value="DONE">DONE</option>
                                    </select>

                                    <div className="task-actions">
                                        <button type="submit" disabled={saving}>
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => setEditingId(null)}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="task-details">
                                        <strong>{task.title}</strong>
                                        <span className="task-status">
                                            {task.status.replaceAll("_", " ")}
                                        </span>
                                    </div>

                                    <div className="task-actions">
                                        <button
                                            onClick={() => startEditing(task)}
                                            disabled={saving}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="danger-button"
                                            onClick={() =>
                                                void handleDelete(task.taskId)
                                            }
                                            disabled={saving}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}

export default App;
