"use client";

import { useState, useSyncExternalStore } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatLongDate } from "@/lib/format";
import {
  getPublishingQueueSnapshot,
  resetPublishingQueueSnapshot,
  savePublishingQueueSnapshot,
  subscribeToPublishingQueueStore,
} from "@/lib/publishing-queue-store";
import {
  buildPublishingIntegrationPayload,
  markPublishingItemReady,
  normalizeHashtagList,
  publishingPlatformOptions,
  publishingStatusOptions,
} from "@/lib/publishing-queue-workflow";
import type { PublishingQueueEntry } from "@/types/studio";

interface PublishingQueuePanelProps {
  initialItems: PublishingQueueEntry[];
}

interface PublishingDraft {
  scheduledPublishDate: string;
  platform: PublishingQueueEntry["platform"];
  caption: string;
  hashtags: string;
  postingStatus: PublishingQueueEntry["postingStatus"];
}

interface PublishingDraftState {
  itemId: string | null;
  draft: PublishingDraft;
}

interface FieldShellProps {
  label: string;
  helperText: string;
  children: React.ReactNode;
}

const inputClasses =
  "mt-2 w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function createEmptyDraft(): PublishingDraft {
  return {
    scheduledPublishDate: "",
    platform: "Instagram Reels",
    caption: "",
    hashtags: "",
    postingStatus: "Business Approved",
  };
}

function buildDraftFromItem(item: PublishingQueueEntry): PublishingDraft {
  return {
    scheduledPublishDate: item.scheduledPublishDate,
    platform: item.platform,
    caption: item.caption,
    hashtags: item.hashtags.join(", "),
    postingStatus: item.postingStatus,
  };
}

function applyDraftToItem(
  item: PublishingQueueEntry,
  draft: PublishingDraft,
): PublishingQueueEntry {
  return {
    ...item,
    scheduledPublishDate: draft.scheduledPublishDate,
    platform: draft.platform,
    caption: draft.caption.trim(),
    hashtags: normalizeHashtagList(draft.hashtags),
    postingStatus: draft.postingStatus,
  };
}

function formatScheduledDate(value: string) {
  if (!value) {
    return "No date selected";
  }

  return formatLongDate(`${value}T12:00:00`);
}

function buildDraftState(items: PublishingQueueEntry[]): PublishingDraftState {
  const firstItem = items[0];

  if (!firstItem) {
    return {
      itemId: null,
      draft: createEmptyDraft(),
    };
  }

  return {
    itemId: firstItem.id,
    draft: buildDraftFromItem(firstItem),
  };
}

function FieldShell({ label, helperText, children }: FieldShellProps) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
        {helperText}
      </span>
      {children}
    </label>
  );
}

export function PublishingQueuePanel({ initialItems }: PublishingQueuePanelProps) {
  const items = useSyncExternalStore(
    subscribeToPublishingQueueStore,
    () => getPublishingQueueSnapshot(initialItems),
    () => initialItems,
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [draftState, setDraftState] = useState<PublishingDraftState>(
    buildDraftState(initialItems),
  );
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const activeSelectedId =
    selectedId && items.some((item) => item.id === selectedId)
      ? selectedId
      : items[0]?.id ?? null;

  const selectedItem = activeSelectedId
    ? items.find((item) => item.id === activeSelectedId) ?? null
    : null;
  const draft =
    draftState.itemId === activeSelectedId
      ? draftState.draft
      : selectedItem
        ? buildDraftFromItem(selectedItem)
        : createEmptyDraft();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search.length === 0 ||
      [
        item.contentTitle,
        item.personaName,
        item.productName,
        item.caption,
        item.hashtags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesPlatform =
      platformFilter === "all" || item.platform === platformFilter;
    const matchesStatus =
      statusFilter === "all" || item.postingStatus === statusFilter;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const businessApprovedCount = items.filter(
    (item) => item.postingStatus === "Business Approved",
  ).length;
  const readyToPublishCount = items.filter(
    (item) => item.postingStatus === "Ready to Publish",
  ).length;
  const scheduledCount = items.filter(
    (item) => item.postingStatus === "Scheduled",
  ).length;

  const draftIsValid =
    draft.scheduledPublishDate.trim().length > 0 &&
    draft.caption.trim().length > 0 &&
    normalizeHashtagList(draft.hashtags).length > 0;

  const readyButtonLabel =
    draft.postingStatus === "Scheduled"
      ? "Already Scheduled"
      : draft.postingStatus === "Ready to Publish"
        ? "Already Ready to Publish"
        : "Mark Ready to Publish";

  function updateDraft(field: keyof PublishingDraft, value: string) {
    setDraftState({
      itemId: activeSelectedId,
      draft: {
        ...draft,
        [field]: value,
      },
    });
  }

  function saveSelectedItem(nextItem: PublishingQueueEntry) {
    savePublishingQueueSnapshot(
      items.map((item) => (item.id === nextItem.id ? nextItem : item)),
    );
    setSelectedId(nextItem.id);
    setDraftState({
      itemId: nextItem.id,
      draft: buildDraftFromItem(nextItem),
    });
  }

  function handleSelectItem(item: PublishingQueueEntry) {
    setSelectedId(item.id);
    setDraftState({
      itemId: item.id,
      draft: buildDraftFromItem(item),
    });
  }

  function handleResetQueue() {
    resetPublishingQueueSnapshot(initialItems);
    setSelectedId(initialItems[0]?.id ?? null);
    setDraftState(buildDraftState(initialItems));
  }

  function handleSaveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem || !draftIsValid) {
      return;
    }

    saveSelectedItem(applyDraftToItem(selectedItem, draft));
  }

  function handleMarkReadyToPublish() {
    if (!selectedItem || !draftIsValid) {
      return;
    }

    const nextItem = markPublishingItemReady(applyDraftToItem(selectedItem, draft));
    saveSelectedItem(nextItem);
  }

  const integrationPayload = selectedItem
    ? buildPublishingIntegrationPayload(applyDraftToItem(selectedItem, draft))
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[28px] border border-warning/20 bg-warning/10 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-foreground">
            Business approval is required before posting
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Only move content to <span className="font-semibold text-foreground">Ready to Publish</span> after a business owner has approved the final caption, schedule, and product presentation. This page does not connect to a live Instagram API yet.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Manual workflow: review the approved content card, confirm the posting details, then mark it ready when approval is complete.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/90 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
          onClick={handleResetQueue}
          type="button"
        >
          Reset sample queue
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-border/80 bg-white/80 px-5 py-4 shadow-[0_12px_32px_rgba(68,52,35,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Business Approved
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {businessApprovedCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Waiting for the manual ready step.
          </p>
        </div>
        <div className="rounded-[24px] border border-border/80 bg-white/80 px-5 py-4 shadow-[0_12px_32px_rgba(68,52,35,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Ready To Publish
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {readyToPublishCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Final details are in place and ready for a future publishing handoff.
          </p>
        </div>
        <div className="rounded-[24px] border border-border/80 bg-white/80 px-5 py-4 shadow-[0_12px_32px_rgba(68,52,35,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Scheduled
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {scheduledCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Items that already have a planned posting date in the queue.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Posting details"
          description="Select an approved content item, then fill in the final posting information in plain business language."
        >
          {selectedItem ? (
            <form className="space-y-5" onSubmit={handleSaveChanges}>
              <div className="rounded-[24px] border border-border/80 bg-accent-soft/30 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Selected content
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {selectedItem.contentTitle}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {selectedItem.personaName} presenting {selectedItem.productName}
                </p>
              </div>

              <FieldShell
                label="Scheduled publish date"
                helperText="Choose the calendar date you want this content to go live. This helps the team stay organized even though posting is still manual."
              >
                <input
                  className={inputClasses}
                  type="date"
                  value={draft.scheduledPublishDate}
                  onChange={(event) =>
                    updateDraft("scheduledPublishDate", event.target.value)
                  }
                />
              </FieldShell>

              <FieldShell
                label="Platform"
                helperText="Choose where this content is planned to appear. Instagram Reels is the default, but the structure can support more destinations later."
              >
                <select
                  className={inputClasses}
                  value={draft.platform}
                  onChange={(event) => updateDraft("platform", event.target.value)}
                >
                  {publishingPlatformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <FieldShell
                label="Caption"
                helperText="Write the full caption exactly as you want the business owner to review and approve it."
              >
                <textarea
                  className={inputClasses}
                  rows={6}
                  value={draft.caption}
                  onChange={(event) => updateDraft("caption", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Hashtags"
                helperText="Add hashtags separated by commas. You can type them with or without the # symbol and the system will clean them up."
              >
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={draft.hashtags}
                  onChange={(event) => updateDraft("hashtags", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Posting status"
                helperText="Use this to show whether the content is approved, ready for posting, or already scheduled."
              >
                <select
                  className={inputClasses}
                  value={draft.postingStatus}
                  onChange={(event) =>
                    updateDraft("postingStatus", event.target.value)
                  }
                >
                  {publishingStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted-foreground"
                  disabled={!draftIsValid}
                  type="submit"
                >
                  Save changes
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!draftIsValid || draft.postingStatus !== "Business Approved"}
                  onClick={handleMarkReadyToPublish}
                  type="button"
                >
                  {readyButtonLabel}
                </button>
              </div>

              {!draftIsValid ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Add a publish date, caption, and at least one hashtag before saving or marking this item ready.
                </p>
              ) : null}

              <div className="rounded-[24px] border border-dashed border-border bg-accent-soft/20 px-4 py-4">
                <p className="text-sm font-semibold text-foreground">
                  Future integration note
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This queue is stored locally for now. Later, the same saved fields can be handed to a real scheduling or publishing API without changing this editor.
                </p>
                {integrationPayload ? (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Prepared payload fields: {integrationPayload.platform},{" "}
                    {formatScheduledDate(integrationPayload.scheduledPublishDate)},{" "}
                    {integrationPayload.hashtags.length} hashtags.
                  </p>
                ) : null}
              </div>
            </form>
          ) : (
            <EmptyState
              title="No publishing item selected"
              description="Choose a content card from the queue to review its posting details."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Approved content queue"
          description="These cards represent approved content that is being prepared for posting. Select one to edit the final posting details."
        >
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search titles, personas, products, or hashtags"
            filters={[
              {
                label: "Platform",
                value: platformFilter,
                onChange: setPlatformFilter,
                options: [
                  { label: "All platforms", value: "all" },
                  ...publishingPlatformOptions.map((platform) => ({
                    label: platform,
                    value: platform,
                  })),
                ],
              },
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "All statuses", value: "all" },
                  ...publishingStatusOptions.map((status) => ({
                    label: status,
                    value: status,
                  })),
                ],
              },
            ]}
            summary={`${filteredItems.length} content item${filteredItems.length === 1 ? "" : "s"} in this view`}
          />

          {filteredItems.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredItems.map((item) => (
                <button
                  className={`rounded-[24px] border p-4 text-left transition ${
                    activeSelectedId === item.id
                      ? "border-accent bg-accent-soft/35 shadow-[0_16px_36px_rgba(68,52,35,0.08)]"
                      : "border-border/80 bg-white/75 hover:border-accent/40 hover:bg-white"
                  }`}
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {item.contentTitle}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.personaName} for {item.productName}
                      </p>
                    </div>
                    <StatusBadge value={item.postingStatus} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Publish date
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatScheduledDate(item.scheduledPublishDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Platform
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {item.platform}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {item.caption}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.hashtags.map((tag) => (
                      <span
                        className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-xs leading-5 text-muted-foreground">
                    Warning: only post after business approval is confirmed.
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No publishing items match this view"
              description="Try clearing the search or switching one of the filters to see the approved content queue again."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
