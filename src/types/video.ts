export interface VideoReviewItem {
  id: string;
  conceptTitle: string;
  personaName: string;
  productName: string;
  editor: string;
  reviewer: string;
  status: "Needs Review" | "Changes Requested" | "Approved";
  dueDate: string;
  notes: string;
  duration: string;
}
