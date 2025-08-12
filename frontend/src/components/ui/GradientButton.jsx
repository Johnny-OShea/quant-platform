import styles from "./gradient-button.module.css";

export default function GradientButton({ href = "#", children }) {
    return (
        <a href={href} className={styles.cta}>
            {children}
        </a>
    );
}
