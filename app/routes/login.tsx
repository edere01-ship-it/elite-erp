import type { Route } from "./+types/login";
import { Form, redirect, useActionData, useNavigation } from "react-router";
import { getSession, commitSession } from "~/sessions.server";
import { prisma } from "~/db.server";
import { getRedirectPath } from "~/utils/permissions.server";
import bcrypt from "bcryptjs";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Connexion - Elite Immobilier ERP" },
        { name: "description", content: "Connectez-vous à votre espace." },
    ];
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Veuillez remplir tous les champs." };
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return { error: "Identifiants incorrects." };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        return { error: "Identifiants incorrects." };
    }

    session.set("userId", user.id);

    // Update lastLogin and lastActivity
    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLogin: new Date(),
            lastActivity: new Date()
        } as any
    });

    // Extract IP and UA
    const ipAddress = request.headers.get("X-Forwarded-For") || request.headers.get("x-real-ip") || "Unknown";
    const userAgent = request.headers.get("User-Agent") || "Unknown";

    // Log login action
    await prisma.auditLog.create({
        data: {
            action: "login",
            details: "Connexion utilisateur",
            userId: user.id,
            module: "auth",
            ipAddress,
            userAgent
        }
    });

    // Determine Redirect Path based on Permissions
    const redirectPath = getRedirectPath(user);

    return redirect(redirectPath, {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (session.has("userId")) {
        return redirect("/");
    }
    return null;
}

export default function Login() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 font-sans">
            {/* Animated Background */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                {/* Vibrant Gradient Mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-300 to-amber-100 opacity-20"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] bg-[size:30px_30px] opacity-10"></div>

                {/* Decorative Shapes */}
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-300 rounded-full blur-[100px] opacity-30 animate-float-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-300 rounded-full blur-[80px] opacity-40 animate-float-delayed"></div>
            </div>

            {/* Main Container */}
            <div className={`relative z-10 w-full max-w-md p-6 transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                {/* Glass Card */}
                <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/60 border border-white/40">

                    {/* Header Section */}
                    <div className="relative pt-12 pb-8 px-8 text-center">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 duration-300 mb-6 group rotate-3 hover:rotate-6">
                            <span className="text-white font-bold text-4xl font-sans tracking-tighter shadow-sm">E</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Elite Immobilier</h2>
                        <p className="text-slate-500 text-sm font-medium tracking-wide uppercase bg-white/50 inline-block px-3 py-1 rounded-full border border-slate-100">Planning & Gestion ERP</p>
                    </div>

                    <div className="px-8 pb-12">
                        <Form method="post" className="space-y-6">
                            {actionData?.error && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 animate-shake shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                        <p className="text-sm text-red-600 font-medium">{actionData.error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="group">
                                    <label htmlFor="email" className="block text-xs font-bold text-slate-600 mb-2 ml-1 uppercase tracking-wider">
                                        Adresse Email
                                    </label>
                                    <div className="relative transition-all duration-200 focus-within:transform focus-within:scale-[1.02]">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-500">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="block w-full pl-11 pr-4 py-3.5 bg-white border-0 ring-1 ring-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-sm transition-all text-sm font-medium"
                                            placeholder="admin@elite.ci"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label htmlFor="password" className="block text-xs font-bold text-slate-600 mb-2 ml-1 uppercase tracking-wider">
                                        Mot de passe
                                    </label>
                                    <div className="relative transition-all duration-200 focus-within:transform focus-within:scale-[1.02]">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-500">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            className="block w-full pl-11 pr-4 py-3.5 bg-white border-0 ring-1 ring-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-sm transition-all text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/30 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Connexion...
                                    </>
                                ) : (
                                    <>
                                        Se connecter
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </Form>

                        <div className="mt-8 text-center space-y-4">
                            <button className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors underline-offset-4 hover:underline">
                                Mot de passe oublié ?
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-slate-500/60 font-medium">
                    © {new Date().getFullYear()} Elite Immobilier ERP. Version Production.
                </p>
            </div>

            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, 40px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-20px, 30px); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-float-slow {
                    animation: float-slow 15s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 18s ease-in-out infinite reverse;
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                /* Custom text shadow for logo */
                .text-shadow-sm {
                   text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
}
