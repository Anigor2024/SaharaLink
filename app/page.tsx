import React from 'react';
import { CorridorProvider } from '@/context/corridor-context';
import { SaharaLinkApp } from '@/components/SaharaLinkApp';

export default function HomePage() {
  return (
    <CorridorProvider>
      <SaharaLinkApp />
    </CorridorProvider>
  );
}
