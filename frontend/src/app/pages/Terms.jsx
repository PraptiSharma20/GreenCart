import React, { useCallback } from "react";
import {
  FileText,
  UserCheck,
  ShoppingCart,
  Store,
  CreditCard,
  Ban,
  Scale,
} from "lucide-react";
import { api } from "../../lib/api";
import { LegalDocumentPage } from "../components/LegalDocumentPage";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1920&auto=format&fit=crop";

const SECTION_IMAGES = [
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop",
  "https://thriam.com/img/Image/blog/vendor-development-manager/Key-Responsibilities-of-Vendor-Development-Manager-by-Thriam.webp",
  "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6afnS2YQD91XXhIiRE_0xg-v9FXpyRGVBPQ&s",
  "https://www.tradologie.com/docs/Images/terms-of-use-banner.webp",
];

const SECTION_ICONS = [
  UserCheck,
  ShoppingCart,
  Store,
  CreditCard,
  Ban,
  Scale,
  FileText,
];

export function Terms() {
  const fetchMeta = useCallback(() => api.about.getTermsMeta(), []);

  return (
    <LegalDocumentPage
      prefix="terms"
      heroImage={HERO_IMAGE}
      HeroIcon={FileText}
      heroAriaLabel="Terms of service agreement"
      sectionCount={7}
      sectionImages={SECTION_IMAGES}
      sectionIcons={SECTION_ICONS}
      fetchMeta={fetchMeta}
      crossLink={{
        to: "/privacy",
        titleKey: "terms_privacy_title",
        descKey: "terms_privacy_desc",
        linkKey: "terms_privacy_link",
      }}
      banner={{
        image:
          "https://images.unsplash.com/photo-1464226184884-fa7b0d85d931?q=80&w=1600&auto=format&fit=crop",
        Icon: Scale,
        titleKey: "terms_banner_title",
        descKey: "terms_banner_desc",
      }}
      ctaTo="/contact"
    />
  );
}
