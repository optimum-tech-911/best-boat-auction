import { notFound } from "next/navigation";

/** Any address without a page inside a language shows the localized not-found page, within the site layout. */
export default function UnknownPage() {
  notFound();
}
