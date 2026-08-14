'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { MapPin, Users, Zap, Briefcase } from 'lucide-react';

const REGIONS = [
  {
    id: 'panjim',
    label: 'Panjim Core',
    icon: MapPin,
    title: 'The Heart of the Festival',
    description: 'Located in the capital, this is where the main keynotes, investor mixers, and grand opening ceremony take place. Experience the vibrant culture of Goa while networking with top-tier VCs.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'north',
    label: 'North Goa Hub',
    icon: Zap,
    title: 'Innovation & Tech',
    description: 'The beachside tech hub. Join hackathons, deep-tech masterclasses, and product teardowns. A perfect blend of focused building and relaxing ocean views.',
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'south',
    label: 'South Goa Retreat',
    icon: Users,
    title: 'Founders Retreat',
    description: 'An exclusive, serene environment for intimate founder discussions, mental health workshops, and high-level strategy sessions away from the noise.',
    image: 'https://images.unsplash.com/photo-1587922546307-776227941871?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'virtual',
    label: 'Global Access',
    icon: Briefcase,
    title: 'Anywhere, Anytime',
    description: 'Can\'t make it to Goa? Join the festival through our immersive digital twin. Stream keynotes live, join virtual networking tables, and access resources globally.',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop'
  }
];

export function TabsSection() {
  const [activeTab, setActiveTab] = useState(REGIONS[0].id);

  const activeRegion = REGIONS.find((r) => r.id === activeTab)!;

  return (
    <section className="bg-canvas section-padding relative overflow-hidden">
      <div className="site-container relative z-10">
        <header className="max-w-3xl mb-12">
          <p className="mb-2 font-semibold uppercase tracking-widest text-primary">
            Explore the Festival
          </p>
          <h2 className="font-bold text-ink">Festival Regions</h2>
          <div aria-hidden="true" className="brand-rule mt-6 w-20 text-primary/40" />
          <p className="mt-6 text-lg text-ink-muted">
            Goa Startup Festival 2026 is distributed across three distinct physical hubs and one global digital layer.
          </p>
        </header>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-surface-alt/50 p-1.5 rounded-2xl w-fit border border-line">
          {REGIONS.map((region) => {
            const isActive = activeTab === region.id;
            const Icon = region.icon;
            return (
              <button
                key={region.id}
                onClick={() => setActiveTab(region.id)}
                className={cn(
                  'relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2',
                  isActive ? 'text-surface' : 'text-ink-muted hover:text-ink'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-xl"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={16} />
                  {region.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="relative rounded-3xl overflow-hidden bg-surface border border-line shadow-sm min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid lg:grid-cols-2 h-full"
            >
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                  {(() => {
                    const ActiveIcon = activeRegion.icon;
                    return <ActiveIcon size={24} />;
                  })()}
                </div>
                <h3 className="text-3xl font-bold mb-4">{activeRegion.title}</h3>
                <p className="text-lg text-ink-muted leading-relaxed">
                  {activeRegion.description}
                </p>
                <div className="mt-8">
                  <button className="inline-flex items-center justify-center rounded-full bg-primary font-bold text-surface px-6 py-2.5 transition-opacity hover:opacity-90">
                    Learn More
                  </button>
                </div>
              </div>
              <div className="relative h-64 lg:h-auto overflow-hidden">
                <motion.img
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                  src={activeRegion.image}
                  alt={activeRegion.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
