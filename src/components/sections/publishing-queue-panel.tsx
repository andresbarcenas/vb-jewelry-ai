"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import type { PublishingItem } from "@/types/studio";

interface PublishingQueuePanelProps {
  items: PublishingItem[];
}

export function PublishingQueuePanel({ items }: PublishingQueuePanelProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search.length === 0 ||
      [
        item.title,
        item.personaName,
        item.productName,
        item.campaign,
        item.owner,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus = status === "all" || item.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search scheduled titles, owners, or campaigns"
        filters={[
          {
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Scheduled", value: "Scheduled" },
              { label: "Ready to Schedule", value: "Ready to Schedule" },
              { label: "Draft", value: "Draft" },
            ],
          },
        ]}
        summary={`${filteredItems.length} publishing item${filteredItems.length === 1 ? "" : "s"} planned`}
      />

      <DataTable
        caption="Publishing queue"
        columns={[
          {
            key: "title",
            header: "Title",
            render: (item) => (
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.campaign}</p>
              </div>
            ),
          },
          {
            key: "publish",
            header: "Publish time",
            render: (item) => (
              <div>
                <p className="font-semibold text-foreground">
                  {formatDateTime(item.scheduledFor)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.channel}</p>
              </div>
            ),
          },
          {
            key: "persona",
            header: "Persona / Product",
            render: (item) => (
              <div>
                <p className="font-semibold text-foreground">{item.personaName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.productName}</p>
              </div>
            ),
          },
          {
            key: "owner",
            header: "Owner",
            render: (item) => <span className="font-semibold text-foreground">{item.owner}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (item) => <StatusBadge value={item.status} />,
          },
        ]}
        rows={filteredItems}
        rowKey={(item) => item.id}
        emptyTitle="No publishing items match this view"
        emptyDescription="Try clearing the search or switching the status filter."
      />
    </div>
  );
}
