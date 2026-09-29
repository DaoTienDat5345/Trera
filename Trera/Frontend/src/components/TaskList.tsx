import React from "react";
import { TaskEmptyStage } from "./TaskEmptyStage";
import { TaskCard } from "./TaskCard";

export const TaskList = ({ filteredTask }) => {
    let filter = "All";

    if (!filteredTask || filteredTask.length === 0) {
        return (
            <TaskEmptyStage filter={filter} />
        )
    }
    return (
        <div className="spase-y-3">
            {filteredTask.map((task, index) => (
                <TaskCard
                    key={task._id ?? index}
                    task={task}
                    index={index} />
            ))}
        </div>
    )
}