import { Header } from "../components/Header";
import { AddTasks } from "../components/AddTasks";
import { StatsAndFilters } from "../components/StatsAndFilters";
import { TaskList } from "../components/TaskList";
import { TaskListPagination } from "../components/TaskListPagination";
import { Footer } from "../components/Footer";
import { DateTimeFilter } from "@/components/DateTimeFilter";
import axios from "axios";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const Homepage = () => {
    const [taskBuffer, setTaskBuffer] = useState([]);
    useEffect(() => {
        fetchTask();
    }, [])
    const fetchTask = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/tasks`);
            setTaskBuffer(res.data);
            console.log(res.data);
        } catch (error) {
            console.error("loi truy xuat task", error);
            toast.error("loi khong the truy xuat task");
        }
    }





    return (
        <div className="min-h-screen w-full bg-[#fefcff] relative">
            {/* Dreamy Sky Pink Glow */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `
        radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
        radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
                }}
            />
            {/* Your Content/Components */}
            <div className="container relative z-10 pt-8 mx-auto">
                <div className="w-full max-w-2xl p-6 mx-auto space-y-6">
                    {/*dau trang*/}
                    <Header />

                    {/*them task moi*/}
                    <AddTasks />

                    {/*thong ke va loc*/}
                    <StatsAndFilters />

                    {/*danh sach task*/}
                    <TaskList filteredTask={taskBuffer} />

                    {/*phan trang va loc ngay*/}
                    <div className="flex flex-col items-center justify-between gap-6 mt-8 sm:flex-row">
                        <TaskListPagination />
                        <DateTimeFilter />
                    </div>

                    {/*cuoi trang*/}
                    <Footer />
                </div>
            </div>
        </div>

    )
}
export default Homepage;