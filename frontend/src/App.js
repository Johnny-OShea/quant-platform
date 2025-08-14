import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./screens/Home";
import Register from "./screens/Register";
import SignIn from "./screens/SignIn";
import StrategyWorkspace from "./screens/StrategyWorkspace";

function App() {
    return (
        <Router>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<SignIn></SignIn>} />
                    <Route path="/strategies/dashboard" element={<StrategyWorkspace />} />
                </Route>
            </Routes>
        </Router>
    );
}
export default App;
