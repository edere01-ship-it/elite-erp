

export const PERMISSIONS = {
    // HR
    HR_VIEW: "hr.view",
    HR_CREATE: "hr.create",
    HR_EDIT: "hr.edit",
    HR_DELETE: "hr.delete",

    // Finance
    FINANCE_VIEW: "finance.view",
    FINANCE_CREATE: "finance.create", // Create transactions/invoices
    FINANCE_EDIT: "finance.edit",
    FINANCE_VALIDATE: "finance.validate", // Approve expenses/payrolls

    // Commercial / Properties
    PROPERTIES_VIEW: "properties.view",
    PROPERTIES_CREATE: "properties.create",
    PROPERTIES_EDIT: "properties.edit",

    VISITS_VIEW: "visits.view",
    VISITS_CREATE: "visits.create",

    COMMERCIAL_VIEW: "commercial.view",
    COMMERCIAL_CREATE: "commercial.create",
    COMMERCIAL_EDIT: "commercial.edit",

    // IT / Admin
    IT_MANAGE: "it.manage", // Full control over assets, users
    IT_CREATE: "it.create",
    IT_EDIT: "it.edit",
    IT_DELETE: "it.delete",

    // Direction
    DIRECTION_VIEW: "direction.view",
    DIRECTION_VALIDATE: "direction.validate",

    // Agency Direction
    AGENCY_VIEW: "agency.view",
    AGENCY_MANAGE: "agency.manage", // General management
    AGENCY_EMPLOYEES_MANAGE: "agency.employees.manage", // Create/Edit employees
    AGENCY_PROPERTIES_MANAGE: "agency.properties.manage", // Create/Edit properties

    // Construction
    CONSTRUCTION_VIEW: "construction.view",
    CONSTRUCTION_MANAGE: "construction.manage",

    // Documents (Archives)
    DOCUMENTS_VIEW: "documents.view",
    DOCUMENTS_MANAGE: "documents.manage",

    // Legal
    LEGAL_VIEW: "legal.view",
    LEGAL_MANAGE: "legal.manage",

    // Global
    ADMIN: "admin.access" // Superuser
};

export const MODULES = [
    {
        id: "direction", // General Direction (Global)
        label: "Direction Générale",
        permissions: [
            { id: PERMISSIONS.DIRECTION_VIEW, label: "Vue Globale & KPIs" },
            { id: PERMISSIONS.DIRECTION_VALIDATE, label: "Validation Finale" },
        ]
    },
    {
        id: "agency",
        label: "Direction Agence",
        permissions: [
            { id: PERMISSIONS.AGENCY_VIEW, label: "Voir Tableau de bord" },
            { id: PERMISSIONS.AGENCY_MANAGE, label: "Gestion Générale" },
            { id: PERMISSIONS.AGENCY_EMPLOYEES_MANAGE, label: "Gérer Personnel" },
            { id: PERMISSIONS.AGENCY_PROPERTIES_MANAGE, label: "Gérer Biens" },
        ]
    },
    {
        id: "hr",
        label: "Ressources Humaines",
        permissions: [
            { id: PERMISSIONS.HR_VIEW, label: "Voir" },
            { id: PERMISSIONS.HR_CREATE, label: "Créer" },
            { id: PERMISSIONS.HR_EDIT, label: "Modifier" },
            { id: PERMISSIONS.HR_DELETE, label: "Supprimer" },
        ]
    },
    {
        id: "finance",
        label: "Comptabilité & Finance",
        permissions: [
            { id: PERMISSIONS.FINANCE_VIEW, label: "Voir" },
            { id: PERMISSIONS.FINANCE_CREATE, label: "Créer Opérations" },
            { id: PERMISSIONS.FINANCE_EDIT, label: "Modifier" },
            { id: PERMISSIONS.FINANCE_VALIDATE, label: "Valider Payements" },
        ]
    },
    {
        id: "properties",
        label: "Biens Immobiliers",
        permissions: [
            { id: PERMISSIONS.PROPERTIES_VIEW, label: "Voir" },
            { id: PERMISSIONS.PROPERTIES_CREATE, label: "Créer" },
            { id: PERMISSIONS.PROPERTIES_EDIT, label: "Modifier" },
        ]
    },
    {
        id: "commercial",
        label: "Commercial (Clients/Visites)",
        permissions: [
            { id: PERMISSIONS.COMMERCIAL_VIEW, label: "Voir Clients" },
            { id: PERMISSIONS.COMMERCIAL_CREATE, label: "Créer Clients" },
            { id: PERMISSIONS.COMMERCIAL_EDIT, label: "Modifier Clients" },
            { id: PERMISSIONS.VISITS_VIEW, label: "Voir Visites" },
            { id: PERMISSIONS.VISITS_CREATE, label: "Créer Visites" },
        ]
    },
    {
        id: "construction",
        label: "Construction & Chantiers",
        permissions: [
            { id: PERMISSIONS.CONSTRUCTION_VIEW, label: "Voir Projets" },
            { id: PERMISSIONS.CONSTRUCTION_MANAGE, label: "Gérer Projets" },
        ]
    },
    {
        id: "documents",
        label: "Documents & Archives",
        permissions: [
            { id: PERMISSIONS.DOCUMENTS_VIEW, label: "Consulter Archives" },
            { id: PERMISSIONS.DOCUMENTS_MANAGE, label: "Gérer/Archiver" },
        ]
    },
    {
        id: "legal",
        label: "Juridique & Contentieux",
        permissions: [
            { id: PERMISSIONS.LEGAL_VIEW, label: "Voir Dossiers" },
            { id: PERMISSIONS.LEGAL_MANAGE, label: "Gérer Contentieux" },
        ]
    },
    {
        id: "it",
        label: "Informatique & Admin",
        permissions: [
            { id: PERMISSIONS.IT_MANAGE, label: "Gestion Complète" },
            { id: PERMISSIONS.IT_CREATE, label: "Créer Utilisateurs" },
            { id: PERMISSIONS.IT_EDIT, label: "Modifier Utilisateurs" },
            { id: PERMISSIONS.IT_DELETE, label: "Supprimer Utilisateurs" },
            { id: PERMISSIONS.ADMIN, label: "Administrateur Global" },
        ]
    }
];


