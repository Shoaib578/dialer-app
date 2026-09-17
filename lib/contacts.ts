export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164
  displayPhone: string;
  status: "Offline" | "Online";
}

// Static placeholder data — no contacts database exists in this project yet.
export const CONTACTS: Contact[] = [
  {
    id: "megan-kelley",
    name: "Megan Kelley",
    phone: "+13124178969",
    displayPhone: "(312) 417-8969",
    status: "Offline",
  },
  {
    id: "taylor-sargent",
    name: "Taylor Sargent",
    phone: "+17869289975",
    displayPhone: "(786) 928-9975",
    status: "Offline",
  },
];
