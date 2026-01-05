export interface Agency {
    id: string;
    name: string;
    address: string;
    city: string;
    manager: string;
    phone: string;
    email: string;
    status: string;
    employees?: { position: string }[];
}
