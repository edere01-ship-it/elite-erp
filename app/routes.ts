import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    layout("routes/_protected.tsx", [
        index("routes/home.tsx"),
        route("agency", "routes/agency.tsx", [
            route("agents", "routes/agency.agents.tsx"),
            route("employees", "routes/agency.employees.tsx"),
            route("properties", "routes/agency.properties.tsx"),
            route("finance", "routes/agency.finance.tsx"),
            route("projects", "routes/agency.projects.tsx"),
            route("commercial", "routes/agency.commercial.tsx"),
            route("validations", "routes/agency.validations.tsx"),
        ]),
        route("direction", "routes/direction.tsx"),
        route("hr", "routes/hr.tsx"),
        route("commercial", "routes/commercial.tsx"),
        route("properties", "routes/properties.tsx"),
        route("visits", "routes/visits.tsx"),
        route("construction", "routes/construction.tsx"),
        route("finance", "routes/finance.tsx"),
        route("legal", "routes/legal.tsx"),
        route("documents", "routes/documents.tsx"),
        route("it", "routes/it.tsx"),
    ]),
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),
    route("api/tickets", "routes/api.tickets.tsx"),
    route("api/messages", "routes/api.messages.ts"),

] satisfies RouteConfig;
