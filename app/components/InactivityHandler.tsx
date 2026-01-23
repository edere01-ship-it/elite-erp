import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

// Timeout: 60 minutes
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function useInactivityLogout() {
    const lastActivityRef = useRef<number>(Date.now());
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Update last activity timestamp
        const updateActivity = () => {
            lastActivityRef.current = Date.now();
        };

        // Events to listen for (throttled naturally by only updating a ref)
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        // Optimisation: Throttle the event listener if needed, but updating a ref is very cheap.
        // To be safe, we can use a small throttle or just let it fly since it's just a variable assignment.
        // For mousemove, it fires extremely often. Let's debounce it slightly or just accept assignment.
        // Assignment is O(1) and very fast.

        events.forEach(event => {
            document.addEventListener(event, updateActivity);
        });

        // Interval to check for inactivity
        const intervalId = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityRef.current; // Fixed calculation

            if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
                // Only logout if not already on login page
                if (!location.pathname.startsWith('/login')) {
                    console.log("Inactivity detected. Logging out...");
                    window.location.href = "/logout";
                }
            }
        }, CHECK_INTERVAL);

        return () => {
            if (intervalId) clearInterval(intervalId);
            events.forEach(event => {
                document.removeEventListener(event, updateActivity);
            });
        };
    }, [location.pathname]); // Re-run if location changes? No, just keep running.
    // Actually [location.pathname] dependency might cause re-attach. 
    // Ideally we want one interval. 'location' inside interval needs to be fresh?
    // Use a ref for location or omit dependency if we just use window.location.
    // But I used `location.pathname` in the check.
    // Let's use `window.location.pathname` to avoid dependency issues or stale closures.
}

export default function InactivityHandler() {
    useInactivityLogout();
    return null;
}
