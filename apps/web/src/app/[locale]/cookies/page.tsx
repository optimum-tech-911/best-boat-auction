import { legalPage } from "@/features/legal/legal-page";

const page = legalPage("cookies");

export const generateMetadata = page.generateMetadata;
export default page.LegalPage;
