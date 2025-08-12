import { Outlet } from "react-router-dom";
import Navbar from "../components/nav/Navbar";

export default function AppLayout() {
    return (
        <>
            <Navbar />
            <main>
                <Outlet />
            </main>
        </>
    );
}
