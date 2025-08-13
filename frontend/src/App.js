import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./screens/Home";
import Register from "./screens/Register";
import SignIn from "./screens/SignIn";

function App() {
    return (
        <Router>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/signin" element={<SignIn></SignIn>} />
                </Route>
            </Routes>
        </Router>
    );
}
export default App;
