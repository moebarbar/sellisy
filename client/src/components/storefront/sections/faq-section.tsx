import type { Store, StoreFaq } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSectionProps {
  store: Store;
  faqs: StoreFaq[];
  themeClass: string;
}

export function FaqSection({ store, faqs, themeClass }: FaqSectionProps) {
  if (!store.faqEnabled || !faqs || faqs.length === 0) return null;

  return (
    <section className={`py-16 md:py-24 px-4 ${themeClass}-bg-alt`}>
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about the products.</p>
        </div>

        <Accordion type="single" collapsible className="w-full bg-card rounded-2xl border p-2 shadow-sm">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.id} value={`item-${index}`} className="border-b-0">
              <AccordionTrigger className={`px-4 py-4 hover:no-underline hover:${themeClass}-bg/10 rounded-lg transition-colors font-medium text-left`}>
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
