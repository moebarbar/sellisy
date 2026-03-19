import type { Store, StoreTestimonial } from "@shared/schema";

interface TestimonialsSectionProps {
  store: Store;
  testimonials: StoreTestimonial[];
  themeClass: string;
}

export function TestimonialsSection({ store, testimonials, themeClass }: TestimonialsSectionProps) {
  if (!store.testimonialsEnabled || !testimonials || testimonials.length === 0) return null;

  return (
    <section className={`py-16 md:py-24 px-4`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">What Customers Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Trusted by creators and entrepreneurs around the world.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div 
              key={t.id} 
              className={`p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center`}
            >
              <div className="mb-6 mt-2 relative">
                {t.avatarUrl ? (
                  <img src={t.avatarUrl} alt={t.name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${themeClass}-bg text-primary-foreground shadow-sm`}>
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Optional quote icon decoration */}
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full ${themeClass}-bg flex items-center justify-center text-primary-foreground shadow-sm border-2 border-background`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                </div>
              </div>
              
              <p className="italic text-muted-foreground flex-grow mb-6 whitespace-pre-wrap">"{t.quote}"</p>
              
              <div>
                <p className="font-bold">{t.name}</p>
                {t.role && <p className="text-sm text-primary font-medium">{t.role}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
