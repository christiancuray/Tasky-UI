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

import {
    Check,
    Layers3,
    Circle,
    Activity,
    CircleCheck,
    UserRound,
    LogOut,
    Plus,
    RefreshCw,
    Pencil,
    Trash2,
} from "lucide-react";

import type { Task, TaskStatus } from "./services/tasksApi";
import StatusBadge from "./components/StatusBadge";

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
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

    const totalTasks = tasks.length;

    const todoTasks = tasks.filter((task) => task.status === "TODO").length;

    const inProgressTasks = tasks.filter(
        (task) => task.status === "IN_PROGRESS",
    ).length;

    const completedTasks = tasks.filter(
        (task) => task.status === "DONE",
    ).length;
    // filtering task based on its status
    const filteredTasks = tasks.filter(
        (task) => statusFilter === "ALL" || task.status === statusFilter,
    );

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
            const message =
                err instanceof Error ? err.message : "Unknown error";

            setError(
                `Task creation may have partially succeeded: ${message}. ` +
                    "Check your task list before trying again.",
            );

            // Do not automatically repeat the POST request.
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

                {error && (
                    <div className="error-message" role="alert">
                        <strong>Something went wrong</strong>
                        <p>{error}</p>
                    </div>
                )}
            </main>
        );
    }

    return (
        <div className="app-shell">
            {/* Global navigation */}
            <header className="app-navbar">
                <div className="navbar-inner">
                    <div className="brand">
                        <span className="brand-icon">
                            <Check size={25} strokeWidth={3} />
                        </span>
                        <span>Task Management</span>
                    </div>

                    <div className="navbar-user">
                        <span className="user-avatar">
                            <UserRound size={23} />
                        </span>

                        <span className="username">{currentUser}</span>

                        <button
                            className="logout-button"
                            onClick={handleLogout}
                            disabled={saving}
                            title="Logout"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard">
                {/* Hero banner */}
                <section className="hero-banner">
                    <div className="hero-content">
                        <h1>My Tasks</h1>
                        <p>Organize, track, and complete your work.</p>
                    </div>

                    <div className="hero-art" aria-hidden="true">
                        <div className="hero-circle hero-circle-one" />
                        <div className="hero-circle hero-circle-two" />

                        <div className="hero-clipboard">
                            <div className="clipboard-clip" />

                            <div className="clipboard-row">
                                <Check size={22} />
                                <span />
                            </div>
                            <div className="clipboard-row">
                                <Check size={22} />
                                <span />
                            </div>
                            <div className="clipboard-row">
                                <Check size={22} />
                                <span />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Statistics */}
                <section className="stats-grid" aria-label="Task statistics">
                    <div className="stat-card">
                        <span className="stat-icon total-icon">
                            <Layers3 size={26} />
                        </span>
                        <div>
                            <span className="stat-label">Total Tasks</span>
                            <strong>{totalTasks}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon todo-icon">
                            <Circle size={26} />
                        </span>
                        <div>
                            <span className="stat-label">To Do</span>
                            <strong>{todoTasks}</strong>
                        </div>
                    </div>

                    <div className="stat-card progress-card">
                        <span className="stat-icon progress-icon">
                            <Activity size={26} />
                        </span>
                        <div>
                            <span className="stat-label">In Progress</span>
                            <strong>{inProgressTasks}</strong>
                        </div>
                    </div>

                    <div className="stat-card completed-card">
                        <span className="stat-icon completed-icon">
                            <CircleCheck size={26} />
                        </span>
                        <div>
                            <span className="stat-label">Completed</span>
                            <strong>{completedTasks}</strong>
                        </div>
                    </div>
                </section>

                {/* Create task */}
                <section className="create-card">
                    <h2>Add a New Task</h2>

                    <form className="create-form" onSubmit={handleCreate}>
                        <input
                            aria-label="New task title"
                            placeholder="Write Essay"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            required
                        />

                        <button type="submit" disabled={saving}>
                            <Plus size={19} />
                            {saving ? "Please wait..." : "Add Task"}
                        </button>
                    </form>
                </section>

                {/* Task list */}
                <section className="tasks-section">
                    <div className="tasks-toolbar">
                        <h2>Your Tasks</h2>

                        <div className="toolbar-actions">
                            <label htmlFor="status-filter">
                                Filter by status
                            </label>

                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as TaskStatus | "ALL",
                                    )
                                }
                            >
                                <option value="ALL">All Tasks</option>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Completed</option>
                            </select>

                            <button
                                className="refresh-button"
                                onClick={() => void loadTasks()}
                                disabled={tasksLoading || saving}
                            >
                                <RefreshCw size={17} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {notice && (
                        <p className="success-message" role="status">
                            {notice}
                        </p>
                    )}

                    {error && (
                        <div className="error-message" role="alert">
                            <strong>Something went wrong</strong>
                            <p>{error}</p>
                        </div>
                    )}

                    {tasksLoading && (
                        <div className="loading-state" role="status">
                            <span className="spinner" aria-hidden="true" />
                            Loading your tasks...
                        </div>
                    )}

                    {!tasksLoading && !error && tasks.length === 0 && (
                        <p>No tasks yet. Create your first task above!</p>
                    )}

                    {!tasksLoading &&
                        !error &&
                        tasks.length > 0 &&
                        filteredTasks.length === 0 && (
                            <p>No tasks match this filter.</p>
                        )}

                    <ul className="task-list" aria-busy={tasksLoading}>
                        {filteredTasks.map((task) => (
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

                                        <label
                                            htmlFor={`status-${task.taskId}`}
                                        >
                                            Status
                                        </label>
                                        <select
                                            id={`status-${task.taskId}`}
                                            value={editStatus}
                                            onChange={(e) =>
                                                setEditStatus(
                                                    e.target
                                                        .value as TaskStatus,
                                                )
                                            }
                                        >
                                            <option value="TODO">To Do</option>
                                            <option value="IN_PROGRESS">
                                                In Progress
                                            </option>
                                            <option value="DONE">
                                                Completed
                                            </option>
                                        </select>

                                        <div className="task-actions">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                            >
                                                <Check size={16} />
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() =>
                                                    setEditingId(null)
                                                }
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
                                        </div>

                                        <StatusBadge status={task.status} />

                                        <div className="task-actions">
                                            <button
                                                onClick={() =>
                                                    startEditing(task)
                                                }
                                                disabled={saving}
                                            >
                                                <Pencil size={16} />
                                                Edit
                                            </button>

                                            <button
                                                className="danger-button"
                                                onClick={() =>
                                                    void handleDelete(
                                                        task.taskId,
                                                    )
                                                }
                                                disabled={saving}
                                            >
                                                <Trash2 size={16} />
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
        </div>
    );
}

export default App;
