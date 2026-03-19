import type { Store } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface AboutSectionProps {
  store: Store;
  themeClass: string;
}

export function AboutSection({ store, themeClass }: AboutSectionProps) {
  if (!store.aboutEnabled) return null;

  const headline = store.aboutHeadline || `About ${store.name}`;
  const text = store.aboutText;
  const imageUrl = store.aboutImageUrl;
  const ctaText = store.aboutCtaText;
  const ctaUrl = store.aboutCtaUrl;

  if (!text && !imageUrl) return null;

  return (
    <section className={`py-16 md:py-24 px-4 ${themeClass}-bg-alt`}>
      <div className="container mx-auto max-w-5xl">
        <div className={`flex flex-col ${imageUrl ? 'md:flex-row' : ''} items-center gap-10 md:gap-16`}>
          {imageUrl && (
            <div className="w-48 md:w-1/3 flex-shrink-0">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-background transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                <img 
                  src={imageUrl} 
                  alt={headline} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{headline}</h2>
            {text && (
              <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {text}
              </div>
            )}
            {ctaText && ctaUrl && (
              <div className="pt-4">
                <Button size="lg" className="rounded-full px-8 shadow-md" asChild>
                  <a href={ctaUrl} target="_blank" rel="noopener noreferrer">{ctaText}</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
