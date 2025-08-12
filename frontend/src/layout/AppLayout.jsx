import Navbar from "../components/nav/Navbar";

/**
 *
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
export default function AppLayout({ children }) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
}
