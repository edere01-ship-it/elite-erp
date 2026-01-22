import { useEffect, useRef } from 'react';

// Timeout in milliseconds (e.g., 28 minutes = 28 * 60 * 1000)
const INACTIVITY_TIMEOUT = 28 * 60 * 1000;

export function useInactivityLogout() {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Function to reset the timer
        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                // Trigger logout
                // We use window.location to ensure a full refresh/redirect
                window.location.href = "/logout";
            }, INACTIVITY_TIMEOUT);
        };

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // Attach listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        // Initial start
        resetTimer();

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, []);
}

export default function InactivityHandler() {
    useInactivityLogout();
    return null;
}
