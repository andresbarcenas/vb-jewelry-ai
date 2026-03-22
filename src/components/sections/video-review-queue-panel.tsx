"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatShortDate } from "@/lib/format";
import type { VideoReviewItem } from "@/types/studio";

interface VideoReviewQueuePanelProps {
  items: VideoReviewItem[];
}

export function VideoReviewQueuePanel({ items }: VideoReviewQueuePanelProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reviewer, setReviewer] = useState("all");

  const reviewerOptions = Array.from(new Set(items.map((item) => item.reviewer)));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search.length === 0 ||
      [
        item.conceptTitle,
        item.personaName,
        item.productName,
        item.editor,
        item.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus = status === "all" || item.status === status;
    const matchesReviewer = reviewer === "all" || item.reviewer === reviewer;

    return matchesSearch && matchesStatus && matchesReviewer;
  });

  return (
    <div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search concepts, personas, or notes"
        filters={[
          {
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Needs Review", value: "Needs Review" },
              { label: "Changes Requested", value: "Changes Requested" },
              { label: "Approved", value: "Approved" },
            ],
          },
          {
            label: "Reviewer",
            value: reviewer,
            onChange: setReviewer,
            options: [
              { label: "All reviewers", value: "all" },
              ...reviewerOptions.map((item) => ({ label: item, value: item })),
            ],
          },
        ]}
        summary={`${filteredItems.length} video${filteredItems.length === 1 ? "" : "s"} in queue`}
      />

      <DataTable
        caption="Video review queue"
        columns={[
          {
            key: "concept",
            header: "Concept",
            render: (item) => (
              <div>
                <p className="font-semibold text-foreground">{item.conceptTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.personaName} · {item.productName}
                </p>
              </div>
            ),
          },
          {
            key: "owners",
            header: "Editor / Reviewer",
            render: (item) => (
              <div>
                <p className="font-semibold text-foreground">{item.editor}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.reviewer}</p>
              </div>
            ),
          },
          {
            key: "due",
            header: "Due",
            render: (item) => (
              <div>
                <p className="font-semibold text-foreground">{formatShortDate(item.dueDate)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.duration}</p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item) => <StatusBadge value={item.status} />,
          },
          {
            key: "notes",
            header: "Notes",
            render: (item) => (
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {item.notes}
              </p>
            ),
          },
        ]}
        rows={filteredItems}
        rowKey={(item) => item.id}
        emptyTitle="Nothing matches this queue view"
        emptyDescription="Try changing the reviewer or status filter to reopen the full placeholder queue."
      />
    </div>
  );
}
