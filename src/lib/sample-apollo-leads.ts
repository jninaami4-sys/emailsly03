export interface Lead {
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  status: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  linkedinUrl: string | null;
  website: string | null;
  industry: string | null;
  employees: number | null;
}

import leads from "./sample-apollo-leads.json";
export default leads as Lead[];
