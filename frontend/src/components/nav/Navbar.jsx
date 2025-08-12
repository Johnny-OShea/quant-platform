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
import { Link } from "react-router-dom";
import BrandImage from "../../assets/logo.svg";
import GradientButton from "../ui/GradientButton";
import Dropdown from "../ui/Dropdown";
import styles from "./navbar.module.css";

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
            {/* Landmark for screen readers */}
            <nav className={styles.nav} aria-label="Primary">

                {/* Brand (clicking returns home) */}
                <Link to="/" className={styles.brand}>

                    {/* Brand logo */}
                    <span className={styles.brandIcon} aria-hidden="true">
                        <img src={BrandImage} alt={"Brand logo"}></img>
                    </span>

                    {/* Brand name */}
                    <span className={styles.brandText}>React</span>
                </Link>

                {/* Mobile hamburger toggle */}
                <button
                    className={styles.burger}
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((o) => !o)}
                >
                    <span />
                    <span />
                    <span />
                </button>

                {/* Main links area (becomes a column on mobile) */}
                <div className={`${styles.links} ${mobileOpen ? styles.linksOpen : ""}`}>
                    <Dropdown label="Product" items={product}></Dropdown>
                    <Dropdown label="Pricing" items={product}></Dropdown>
                    <Dropdown label="Learn" items={learn} />
                    <Dropdown label="Company" items={company} />
                    <Dropdown label="Help" items={help} />

                    {/* pushes the sign-up button to the right on wide screens */}
                    <div className={styles.pushRight} />

                    {/* Primary call to action */}
                    <GradientButton to="/register">SIGN UP</GradientButton>
                </div>
            </nav>
        </header>
    );
}
