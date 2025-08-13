import styles from "./gradient-button.module.css";
import { Link } from "react-router-dom";

export default function GradientButton({ to, children, ...rest }) {
    return (
        <Link className={styles.cta} to={to} {...rest}>
            {children}
        </Link>
    );
}
