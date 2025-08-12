import {useRef, useState} from "react";
import styles from "./dropdown.module.css";
import useOnClickOutside from "../../hooks/DropdownHook.jsx";
import Chevron from "./Chevron.jsx";


/**
 * Dropdown
 * --------
 * WHAT: A button that reveals a small menu with links.
 *
 * HOW:
 *  <Dropdown
 *    label="Product"
 *    items={[{ label: "Overview", href: "/product" }, { label: "Docs", href: "/docs", desc: "API & Guides" }]}
 *  />
 *
 * UX NOTES:
 * - Click the label to toggle.
 * - Escape closes.
 * - ArrowDown focuses the first actionable item.
 * - Clicking outside closes (via useOnClickOutside).
 */
function Dropdown({ label, items }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useOnClickOutside(ref, () => setOpen(false));

    function onKeyDown(e) {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "ArrowDown" && ref.current) {
            // Move focus to first menu item for keyboard users
            const first = ref.current.querySelector("a,button,[tabindex='0']");
            first && first.focus();
        }
    }

    return (
        <div className={styles.dropdown} ref={ref}>
            <button
                className={styles.navBtn}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={onKeyDown}
            >
                {label}
                <Chevron open={open} />
            </button>

            {open && (
                <div className={styles.menu} role="menu" aria-label={label}>
                    {items.map((it) => (
                        <a
                            key={it.label}
                            href={it.href}
                            role="menuitem"
                            className={styles.menuItem}
                            onClick={() => setOpen(false)}
                        >
                            <div className={styles.menuTitle}>{it.label}</div>
                            {it.desc && <div className={styles.menuDesc}>{it.desc}</div>}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dropdown;