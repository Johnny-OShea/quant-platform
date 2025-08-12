import {useEffect} from "react";

/**
 * useOnClickOutside
 * -----------------
 * WHAT: React hook that calls `handler` when a click/touch happens outside `ref`.
 * WHY:  Lets us close a dropdown if the user clicks elsewhere.
 * USE:
 *   const boxRef = useRef(null);
 *   useOnClickOutside(boxRef, () => setOpen(false));
 */
function useOnClickOutside(ref, handler) {
    useEffect(() => {
        function listener(e) {
            // Ignore if click was inside the referenced element
            if (!ref.current || ref.current.contains(e.target)) return;
            handler(e);
        }
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

export default useOnClickOutside;