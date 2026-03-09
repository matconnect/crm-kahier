/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    async rewrites() {
        const apiInternal = process.env.API_INTERNAL_URL || "http://gateway:3011";

        return [
            { source: "/auth/:path*", destination: `${apiInternal}/auth/:path*` },
            { source: "/clients/:path*", destination: `${apiInternal}/clients/:path*` },
            { source: "/company/:path*", destination: `${apiInternal}/company/:path*` },
            { source: "/users/:path*", destination: `${apiInternal}/users/:path*` },
            { source: "/profile/:path*", destination: `${apiInternal}/profile/:path*` },
            { source: "/kahier/:path*", destination: `${apiInternal}/kahier/:path*` },
        ];
    },
};

export default nextConfig;
