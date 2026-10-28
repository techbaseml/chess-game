import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'NEXA CHESS — Play Without Limits',description:'A beautiful, free chess experience. Play a friend, challenge Stockfish, or invite someone across the world.',manifest:'/manifest.webmanifest',icons:{icon:'/icon-192.png',apple:'/icon-192.png'},verification:{google:'R2udG1RKVYTpmW1KnfOUm_4ibtw4hNvkyX_JJJYYO0w'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
