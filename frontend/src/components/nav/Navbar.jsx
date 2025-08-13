/**
 * Navbar.jsx
 * ----------
 * A responsive, accessible top navigation bar. It includes:
 * - A brand photo (left most)
 * - A mobile hamburger toggle
 * - Standard links
 * - Reusable dropdown menus (keyboard + click friendly)
 * - A gradient call-to-action button
 *
 * HOW IT'S USED
 * - Import and render <Navbar /> once in AppLayout.jsx
 * - Supply dropdown content by editing the arrays (`product`, `learn`, etc.).
 * - Styles are pulled from `navbar.module.css` and global tokens.
 *
 * ACCESSIBILITY
 * - Uses <nav aria-label="Primary"> as a landmark.
 * - Dropdown buttons expose `aria-haspopup` and `aria-expanded`.
 * - Escape closes menus; ArrowDown focuses first item.
 * - Clicking outside a dropdown closes it.
 */
import { useState } from "react";
import {Link, useNavigate} from "react-router-dom";
import BrandImage from "../../assets/logo.svg";
import GradientButton from "../ui/GradientButton";
import Dropdown from "../ui/Dropdown";
import styles from "./navbar.module.css";
import {useAuth} from "../../context/AuthContext";

/**
 * Navbar
 * ------
 * WHAT: The site-wide top navigation bar component.
 * HOW:
 *   import Navbar from "components/nav/Navbar";
 *
 * CUSTOMIZATION:
 * - Edit the arrays below to change menu items/links.
 * - Add/remove <Dropdown/> or plain <a/> links as needed.
 * - Update styles in `navbar.module.css` and global tokens for theme.
 */
export default function Navbar() {

    const { isAuthed, signOut } = useAuth();
    const navigate = useNavigate();

    // Controls the mobile slide-down panel
    const [mobileOpen, setMobileOpen] = useState(false);

    const product = [
        { label: "Overview", to: "/product" },
        { label: "Backtesting", to: "/product/backtesting", desc: "Prototype strategies safely" },
        { label: "Automation", to: "/product/automation", desc: "Deploy bots & alerts" },
    ];

    const learn = [
        { label: "Academy", to: "/learn/academy" },
        { label: "Guides", to: "/learn/guides" },
        { label: "Blog", to: "/learn/blog" },
    ];

    const company = [{ label: "About", to: "/company/about" }];

    const help = [
        { label: "Docs", to: "/help/docs" },
        { label: "Support", to: "/help/support" },
    ];

    return (
        <header className={styles.header}>
            <nav className={styles.nav} aria-label="Primary">
                <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <img src={BrandImage} alt="Brand logo"/>
          </span>
                    <span className={styles.brandText}>React</span>
                </Link>

                <button
                    className={styles.burger}
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((o) => !o)}
                >
                    <span/>
                    <span/>
                    <span/>
                </button>

                <div className={`${styles.links} ${mobileOpen ? styles.linksOpen : ""}`}>
                    <Dropdown label="Product" items={product}/>
                    <Dropdown label="Pricing" items={product}/>
                    <Dropdown label="Learn" items={learn}/>
                    <Dropdown label="Company" items={company}/>
                    <Dropdown label="Help" items={help}/>

                    <div className={styles.pushRight}/>

                    {!isAuthed ? (
                        <>
                            <GradientButton to="/register">SIGN UP</GradientButton>
                        </>
                    ) : (
                        <>
                            <GradientButton
                                onClick={() => {
                                    signOut();
                                    navigate("/");
                                }}
                                aria-label="Sign out"
                            >
                                Logout
                            </GradientButton>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}
