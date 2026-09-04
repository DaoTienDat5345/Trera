import React from "react";
import { Badge } from "./ui/badge";
import { FilterType } from "@/lib/Data";
import { Filter } from "lucide-react";
import { Button } from "./ui/button";

export const StatsAndFilters = ({ completedTaskCount = 0, activeTaskCount = 0, filter = "All" }) => {
    return (
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* phần thống kê */}
            <div className="flex gap-3">
                <Badge
                    variant="secondary"
                    className="bg-white/50 text-accent-foreground border-info/20"
                >
                    {activeTaskCount} {FilterType.active}
                </Badge>
                <Badge
                    variant="secondary"
                    className="bg-white/50 text-success border-success/20"
                >
                    {completedTaskCount} {FilterType.completed}
                </Badge>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                {Object.keys(FilterType).map((type) => (
                    <Button
                        key={type}
                        variant={filter === type ? "gradient" : "ghost"}
                        size="sm"
                        className="capitalize"
                    >
                        <Filter className="size-4" />
                        {FilterType[type]}
                    </Button>
                ))}
            </div>
        </div>



    )
}