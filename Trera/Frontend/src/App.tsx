import { BrowserRouter, Routes, Route } from "react-router"
import Homepage from "./pages/Homepage"
import Notfound from "./pages/Notfound"
import { Toaster } from "sonner"

function App() {


  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Homepage />}
          />
          <Route
            path="*"
            element={<Notfound />}
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
