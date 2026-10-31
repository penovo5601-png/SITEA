import type { NextConfig } from "next";

const nextConfig: NextConfig = {outputFileTracingIncludes:{"/*":["./public/data/history/*.json.gz"]}};

export default nextConfig;
