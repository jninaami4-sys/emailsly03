Add a dedicated, scrollable full-sample-leads showcase page and link it from the homepage "View Sample Data" button.

Technical details:
- Convert the uploaded `SAMPLE_APOLLO_LEADS.xlsx` to a static JSON file (`src/lib/sample-apollo-leads.json`) containing all 365 rows with the fields the table needs: Name, Title, Company, Email, Email Status, City, State, Country, LinkedIn URL, Website, Industry, Employees.
- Create a new route `src/routes/sample-data.tsx` (path `/sample-data`) that renders a full-page scrollable data table with the site shell (Header/Footer).
- Build a responsive table component (`src/components/site/SampleDataTable.tsx`) with:
  - Sticky header row
  - Vertical scroll inside a bounded container (e.g., max-h-[70vh])
  - Horizontal scroll on mobile
  - Compact typography, alternating row backgrounds, and the existing emerald "Verified" badge
  - Search/filter by name or company
  - Optional: column visibility for desktop (Name, Title, Company, Email, Status, Industry, Employees, City, Country)
- Update the homepage "View Sample Data" button in `src/routes/index.tsx` to navigate to `/sample-data`.
- Set route metadata (title, description) in the new route file.
- Build and verify the table renders all 365 rows without performance issues.