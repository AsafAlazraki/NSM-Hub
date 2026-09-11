
const { config } = require('dotenv');

config();

/** @type {import('next').NextConfig} */
const nextConfig = async () => {
  return {
    experimental: {
      serverActions: {
        // Uploaded parts documents are sent to the AI flows as Base64 data
        // URIs, which inflate an 8MB file to ~11MB of request body.
        bodySizeLimit: '12mb',
      },
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },
        {
          protocol: 'https',
          hostname: 'firebasestorage.googleapis.com',
        }
      ],
      // Allow data URLs for base64 encoded images from Firestore
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
      unoptimized: true,
    },
  };
};

module.exports = nextConfig;
