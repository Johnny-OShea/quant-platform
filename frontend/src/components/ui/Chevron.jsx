import styles from "./chevron.module.css";

/**
 * Chevron
 * -------
 * WHAT: Tiny caret icon that flips open/closed.
 * USE:  <Chevron open={boolean} />
 */
function Chevron({ open }) {
    return (
        <svg
            className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            width="12"
            height="12"
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <path
                fill="currentColor"
                d="M5.8 7.4a1 1 0 0 1 1.4 0L10 10.2l2.8-2.8a1 1 0 1 1 1.4 1.4l-3.5 3.5a1 1 0 0 1-1.4 0L5.8 8.8a1 1 0 0 1 0-1.4z"
            />
        </svg>
    );
}

export default Chevron;