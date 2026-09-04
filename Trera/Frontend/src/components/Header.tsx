import React from "react";

export const Header = () => {
    return (
        <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold text-transparent bg-primary bg-clip-text">
                todoX
            </h1>
            <p className="text-muted-foreground">
                Hôm nay bạn sẽ làm gì? Hãy lên kế hoạch cho ngày hôm nay nhé!
            </p>
        </div>
    )
}