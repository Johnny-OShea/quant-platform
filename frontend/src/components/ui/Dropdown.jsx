import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./dropdown.module.css";
import useOnClickOutside from "../../hooks/DropdownHook.jsx";
import Chevron from "./Chevron.jsx";

/**
 * items: Array<{
 *   label: string,
 *   to: string,
 *   desc?: string
 * }>
 */
function Dropdown({ label, items, onItemSelect }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useOnClickOutside(ref, () => setOpen(false));

    function onKeyDown(e) {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "ArrowDown" && ref.current) {
            const first = ref.current.querySelector("a,button,[tabindex='0']");
            first && first.focus();
        }
    }

    const handleSelect = () => {
        setOpen(false);
        onItemSelect?.();
    };

    return (
        <div className={styles.dropdown} ref={ref}>
            <button
                className={styles.navBtn}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
                onKeyDown={onKeyDown}
            >
                {label}
                <Chevron open={open} />
            </button>

            {open && (
                <div className={styles.menu} role="menu" aria-label={label}>
                    {items.map((it) => (
                        <Link
                            key={it.label}
                            to={it.to}
                            role="menuitem"
                            className={styles.menuItem}
                            onClick={handleSelect}
                        >
                            <div className={styles.menuTitle}>{it.label}</div>
                            {it.desc && <div className={styles.menuDesc}>{it.desc}</div>}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dropdown;
