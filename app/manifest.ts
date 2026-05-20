import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QR Server',
    short_name: 'QR Server',
    description: 'A self-hosted QR code management server built with Next.js and Supabase.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-1254x1254.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-1254x1254.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}