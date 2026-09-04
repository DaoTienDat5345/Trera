import React from "react";
import { Card } from "./ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@phosphor-icons/react";

export const AddTasks = () => {
    return (
        <div>
            <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                        type="text"
                        placeholder="Cần phải làm gì?"
                        className="h-12 text-base bg-slate-50 sm:flex-1 border-border/50 focus:border-primary/50 focus:ring-primary/15"
                    />
                    <Button variant="gradient" size="xl" className="h-12">
                        <PlusIcon className="size-6" />
                    </Button>
                </div>
            </Card>
        </div>
    )
}