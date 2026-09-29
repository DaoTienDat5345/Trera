import React from "react";

const Notfound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center bg-slate-50">
            <img
                src="/404NotFound.png"
                alt="Not Found"     
                className="w-full max-w-md"
            />
            <p className="text-xl font-semibold">
                Trang không tồn tại
            </p>
            <a href="/" className="inline-block px-6 py-3 mt-6 font-medium text-white transition shadow-md bg-primary rounded-2xl hover:bg-primary-dark">
                Back to home
            </a>
        </div>
    )
}
export default Notfound;