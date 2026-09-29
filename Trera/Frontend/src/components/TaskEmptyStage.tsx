import React from "react";
import { Card } from "./ui/card";
import { Circle } from "lucide-react";
export const TaskEmptyStage = ({ filter }) => {
    return (
        <div>
            <Card className="p-8 border-0 bg-gradient-card shadow-custom-md">
                <div className="space-y-3">
                    <Circle className="mx-auto size-12 text-muted-foreground" />
                    <div>
                        <h3 className="font-medium text-foreground">
                            {
                                filter === 'active' ?
                                    "khong co nhiem vu nao dang lam ne" :
                                    filter === 'completed' ?
                                        "khong co nhiem vu nao da hoan thanh" :
                                        "khong co nhiem vu"
                            }
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {
                                filter === 'All' ?
                                    "Hay them nhiem vu de bat dau lam thoi" :
                                    `chuyen sang "tat ca" de thay nhiem vu ${filter === "active" ? "da hoan thanh" : "dang lam"}`
                            }
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}