import {useAuth} from "../context/AuthContext";

export default function Home() {
    // Get the user of the system.
    const { user } = useAuth();
    return (
        <section style={{ padding: 24 }}>
            <h1>Hey {user?.username || "there"}</h1>
        </section>
    );
}
