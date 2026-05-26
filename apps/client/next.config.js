/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    allowedDevOrigins: ["dev.crm.kahier.com"],
    async rewrites() {
        const apiInternal = process.env.API_INTERNAL_URL || "http://gateway:3011";

        return [
            { source: "/api/company", destination: `${apiInternal}/api/company` },
            { source: "/api/company/:path*", destination: `${apiInternal}/api/company/:path*` },
            { source: "/auth", destination: `${apiInternal}/auth` },
            { source: "/auth/:path*", destination: `${apiInternal}/auth/:path*` },
            { source: "/billing", destination: `${apiInternal}/billing` },
            { source: "/billing/:path*", destination: `${apiInternal}/billing/:path*` },
            { source: "/clients", destination: `${apiInternal}/clients` },
            { source: "/clients/:path*", destination: `${apiInternal}/clients/:path*` },
            { source: "/projects", destination: `${apiInternal}/projects` },
            { source: "/projects/:path*", destination: `${apiInternal}/projects/:path*` },
            { source: "/company", destination: `${apiInternal}/company` },
            { source: "/company/:path*", destination: `${apiInternal}/company/:path*` },
            { source: "/users", destination: `${apiInternal}/users` },
            { source: "/users/:path*", destination: `${apiInternal}/users/:path*` },
            { source: "/profile", destination: `${apiInternal}/profile` },
            { source: "/profile/:path*", destination: `${apiInternal}/profile/:path*` },
            { source: "/kahier", destination: `${apiInternal}/kahier` },
            { source: "/kahier/:path*", destination: `${apiInternal}/kahier/:path*` },
        ];
    },
};

export default nextConfig;
