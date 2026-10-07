import { legalPage } from "@/features/legal/legal-page";

const page = legalPage("legalNotice");

export const generateMetadata = page.generateMetadata;
export default page.LegalPage;
