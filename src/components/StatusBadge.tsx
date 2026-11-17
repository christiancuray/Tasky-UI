import { Circle, CircleCheck, Activity } from "lucide-react";
import type { TaskStatus } from "../services/tasksApi";

interface StatusBadgeProps {
    status: TaskStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = {
        TODO: {
            label: "To Do",
            Icon: Circle,
        },
        IN_PROGRESS: {
            label: "In Progress",
            Icon: Activity,
        },
        DONE: {
            label: "Completed",
            Icon: CircleCheck,
        },
    };

    const { label, Icon } = config[status];

    return (
        <span className={`status-badge status-${status.toLowerCase()}`}>
            <Icon size={16} strokeWidth={2.3} aria-hidden="true" />
            {label}
        </span>
    );
}
