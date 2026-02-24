import { useState, useMemo } from "react";

type SortOption = "newest" | "price-asc" | "price-desc" | "name-az";

interface FilterableProduct {
  id: string;
  title: string;
  category: string;
  priceCents: number;
  tags?: string[] | null;
  createdAt: string | Date;
  description?: string | null;
}

export function useStorefrontFilters<T extends FilterableProduct>(products: T[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "price-desc":
        result.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "name-az":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    categories,
    filtered,
  };
}
