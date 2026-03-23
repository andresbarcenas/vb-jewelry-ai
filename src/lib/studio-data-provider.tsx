"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAnalyticsSnapshot,
  getDashboardSummary,
  getSystemStatus,
  type DashboardSummary,
  type SystemStatusItem,
} from "@/lib/services/analytics.service";
import {
  archiveContentIdea,
  approveReview,
  generateIdeas,
  generateVisualPlanForIdea,
  getGenerationOptions,
  listContentIdeas,
  listVideoReviewQueue,
  markContentIdeaReadyForReview,
  regenerateContentIdea,
  rejectReview,
  requestVideoGeneration,
  saveContentIdea,
  type ContentIdeaGenerationResult,
  type ContentGenerationOptions,
} from "@/lib/services/content.service";
import {
  createPersona,
  deletePersona,
  listPersonas,
  resetPersonas,
  updatePersona,
} from "@/lib/services/persona.service";
import {
  createProduct,
  deleteProduct,
  listProducts,
  resetProducts,
  updateProduct,
} from "@/lib/services/product.service";
import {
  attemptPublish,
  getPublishingOptions,
  listPublishingQueue,
  markReadyToPublish,
  resetPublishingQueue,
  savePublishingItem,
  type PublishingOptions,
} from "@/lib/services/publishing.service";
import {
  getBrandProfile,
  resetBrandProfile,
  saveBrandProfile,
} from "@/lib/services/brand.service";
import type {
  AiPersonaProfile,
  AnalyticsSnapshot,
  BrandProfile,
  ContentIdea,
  ContentIdeaGeneratorInput,
  ProductLibraryItem,
  PublishingQueueEntry,
  VideoReviewItem,
} from "@/types/studio";

interface StudioDataProviderProps {
  children: React.ReactNode;
}

interface StudioDataContextValue {
  loading: boolean;
  brandProfile: BrandProfile;
  personas: AiPersonaProfile[];
  products: ProductLibraryItem[];
  contentIdeas: ContentIdea[];
  videoReviewQueue: VideoReviewItem[];
  publishingQueue: PublishingQueueEntry[];
  analyticsSnapshot: AnalyticsSnapshot;
  dashboardSummary: DashboardSummary;
  systemStatus: SystemStatusItem[];
  generationOptions: ContentGenerationOptions;
  publishingOptions: PublishingOptions;
  saveBrandProfile: (nextProfile: BrandProfile) => Promise<void>;
  resetBrandProfile: () => Promise<void>;
  createPersona: (persona: AiPersonaProfile) => Promise<void>;
  updatePersona: (persona: AiPersonaProfile) => Promise<void>;
  deletePersona: (personaId: string) => Promise<void>;
  resetPersonas: () => Promise<void>;
  createProduct: (product: ProductLibraryItem) => Promise<void>;
  updateProduct: (product: ProductLibraryItem) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  resetProducts: () => Promise<void>;
  generateIdeas: (
    input: ContentIdeaGeneratorInput,
  ) => Promise<ContentIdeaGenerationResult>;
  saveContentIdea: (ideaId: string) => Promise<void>;
  generateVisualPlanForIdea: (ideaId: string) => Promise<ContentIdea | null>;
  markContentIdeaReadyForReview: (ideaId: string) => Promise<void>;
  sendContentIdeaToReview: (ideaId: string) => Promise<void>;
  archiveContentIdea: (ideaId: string) => Promise<void>;
  regenerateContentIdea: (ideaId: string) => Promise<ContentIdeaGenerationResult | null>;
  approveReview: (reviewId: string, reviewer: string, notes: string) => Promise<void>;
  rejectReview: (reviewId: string, reviewer: string, notes: string) => Promise<void>;
  requestVideoGeneration: (reviewId: string) => Promise<unknown>;
  savePublishingItem: (item: PublishingQueueEntry) => Promise<void>;
  markReadyToPublish: (itemId: string) => Promise<void>;
  attemptPublish: (itemId: string) => Promise<void>;
  resetPublishingQueue: () => Promise<void>;
  refreshStudioData: () => Promise<void>;
}

const emptyBrandProfile: BrandProfile = {
  brandName: "",
  brandVoice: "",
  targetCustomer: "",
  styleKeywords: [],
  doNotUseList: [],
  preferredColors: [],
  productCategories: [],
  instagramHandle: "",
};

const emptyAnalyticsSnapshot: AnalyticsSnapshot = {
  timeframe: "",
  totalPosts: 0,
  approvedPosts: 0,
  engagementRate: 0,
  bestPersona: "",
  bestContentType: "",
  weeklyPostVolume: [],
  personaPerformance: [],
  contentTypePerformance: [],
  insights: [],
};

const emptyDashboardSummary: DashboardSummary = {
  stats: [],
  upcomingPublishes: [],
  urgentReviews: [],
  freshIdeas: [],
  brandProfile: emptyBrandProfile,
};

const emptyGenerationOptions: ContentGenerationOptions = {
  platforms: ["Instagram Reels"],
  moods: ["Elevated"],
  contentTypes: ["lifestyle"],
};

const emptyPublishingOptions: PublishingOptions = {
  platforms: ["Instagram Reels", "Instagram Feed"],
  statuses: ["Business Approved", "Ready to Publish", "Scheduled"],
};

const StudioDataContext = createContext<StudioDataContextValue | null>(null);

function useStudioDataContext() {
  const context = useContext(StudioDataContext);

  if (!context) {
    throw new Error("Studio data hooks must be used inside StudioDataProvider.");
  }

  return context;
}

export function StudioDataProvider({ children }: StudioDataProviderProps) {
  const [loading, setLoading] = useState(true);
  const [brandProfileState, setBrandProfileState] = useState<BrandProfile>(
    emptyBrandProfile,
  );
  const [personasState, setPersonasState] = useState<AiPersonaProfile[]>([]);
  const [productsState, setProductsState] = useState<ProductLibraryItem[]>([]);
  const [contentIdeasState, setContentIdeasState] = useState<ContentIdea[]>([]);
  const [videoReviewQueueState, setVideoReviewQueueState] = useState<VideoReviewItem[]>([]);
  const [publishingQueueState, setPublishingQueueState] = useState<PublishingQueueEntry[]>([]);
  const [analyticsSnapshotState, setAnalyticsSnapshotState] =
    useState<AnalyticsSnapshot>(emptyAnalyticsSnapshot);
  const [dashboardSummaryState, setDashboardSummaryState] =
    useState<DashboardSummary>(emptyDashboardSummary);
  const [systemStatusState, setSystemStatusState] = useState<SystemStatusItem[]>([]);
  const [generationOptionsState, setGenerationOptionsState] =
    useState<ContentGenerationOptions>(emptyGenerationOptions);
  const [publishingOptionsState, setPublishingOptionsState] =
    useState<PublishingOptions>(emptyPublishingOptions);

  const refreshAnalyticsViews = useCallback(async () => {
    const [snapshot, summary, systemStatus] = await Promise.all([
      getAnalyticsSnapshot(),
      getDashboardSummary(),
      getSystemStatus(),
    ]);

    setAnalyticsSnapshotState(snapshot);
    setDashboardSummaryState(summary);
    setSystemStatusState(systemStatus);
  }, []);

  const refreshStudioData = useCallback(async () => {
    setLoading(true);

    const [
      brandProfile,
      personas,
      products,
      contentIdeas,
      videoReviewQueue,
      publishingQueue,
      generationOptions,
      publishingOptions,
    ] = await Promise.all([
      getBrandProfile(),
      listPersonas(),
      listProducts(),
      listContentIdeas(),
      listVideoReviewQueue(),
      listPublishingQueue(),
      getGenerationOptions(),
      getPublishingOptions(),
    ]);

    setBrandProfileState(brandProfile);
    setPersonasState(personas);
    setProductsState(products);
    setContentIdeasState(contentIdeas);
    setVideoReviewQueueState(videoReviewQueue);
    setPublishingQueueState(publishingQueue);
    setGenerationOptionsState(generationOptions);
    setPublishingOptionsState(publishingOptions);

    await refreshAnalyticsViews();
    setLoading(false);
  }, [refreshAnalyticsViews]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshStudioData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshStudioData]);

  const saveBrandProfileAction = useCallback(async (nextProfile: BrandProfile) => {
    const updatedProfile = await saveBrandProfile(nextProfile);
    setBrandProfileState(updatedProfile);
    await refreshAnalyticsViews();
  }, [refreshAnalyticsViews]);

  const resetBrandProfileAction = useCallback(async () => {
    const resetProfile = await resetBrandProfile();
    setBrandProfileState(resetProfile);
    await refreshAnalyticsViews();
  }, [refreshAnalyticsViews]);

  const createPersonaAction = useCallback(async (persona: AiPersonaProfile) => {
    const updated = await createPersona(persona);
    setPersonasState(updated);
  }, []);

  const updatePersonaAction = useCallback(async (persona: AiPersonaProfile) => {
    const updated = await updatePersona(persona);
    setPersonasState(updated);
  }, []);

  const deletePersonaAction = useCallback(async (personaId: string) => {
    const updated = await deletePersona(personaId);
    setPersonasState(updated);
  }, []);

  const resetPersonasAction = useCallback(async () => {
    const updated = await resetPersonas();
    setPersonasState(updated);
  }, []);

  const createProductAction = useCallback(async (product: ProductLibraryItem) => {
    const updated = await createProduct(product);
    setProductsState(updated);
  }, []);

  const updateProductAction = useCallback(async (product: ProductLibraryItem) => {
    const updated = await updateProduct(product);
    setProductsState(updated);
  }, []);

  const deleteProductAction = useCallback(async (productId: string) => {
    const updated = await deleteProduct(productId);
    setProductsState(updated);
  }, []);

  const resetProductsAction = useCallback(async () => {
    const updated = await resetProducts();
    setProductsState(updated);
  }, []);

  const generateIdeasAction = useCallback(
    async (input: ContentIdeaGeneratorInput) => {
      const result = await generateIdeas(input);
      const refreshedIdeas = await listContentIdeas();
      setContentIdeasState(refreshedIdeas);
      await refreshAnalyticsViews();
      return result;
    },
    [refreshAnalyticsViews],
  );

  const saveContentIdeaAction = useCallback(
    async (ideaId: string) => {
      const updated = await saveContentIdea(ideaId);

      if (updated?.idea) {
        setContentIdeasState((current) =>
          current.map((item) => (item.id === updated.idea.id ? updated.idea : item)),
        );
      }

      await refreshAnalyticsViews();
    },
    [refreshAnalyticsViews],
  );

  const generateVisualPlanForIdeaAction = useCallback(
    async (ideaId: string) => {
      const updated = await generateVisualPlanForIdea(ideaId);

      if (updated?.idea) {
        setContentIdeasState((current) =>
          current.map((item) => (item.id === updated.idea.id ? updated.idea : item)),
        );
        await refreshAnalyticsViews();
        return updated.idea;
      }

      return null;
    },
    [refreshAnalyticsViews],
  );

  const sendContentIdeaToReviewAction = useCallback(
    async (ideaId: string) => {
      const updated = await markContentIdeaReadyForReview(ideaId);

      if (updated?.idea) {
        setContentIdeasState((current) =>
          current.map((item) => (item.id === updated.idea.id ? updated.idea : item)),
        );
      }

      await refreshAnalyticsViews();
    },
    [refreshAnalyticsViews],
  );

  const markContentIdeaReadyForReviewAction = sendContentIdeaToReviewAction;

  const archiveContentIdeaAction = useCallback(
    async (ideaId: string) => {
      const updated = await archiveContentIdea(ideaId);

      if (updated?.idea) {
        setContentIdeasState((current) =>
          current.map((item) => (item.id === updated.idea.id ? updated.idea : item)),
        );
      }

      await refreshAnalyticsViews();
    },
    [refreshAnalyticsViews],
  );

  const regenerateContentIdeaAction = useCallback(
    async (ideaId: string) => {
      const updated = await regenerateContentIdea(ideaId);

      if (updated?.idea) {
        setContentIdeasState((current) =>
          current.map((item) => (item.id === updated.idea.id ? updated.idea : item)),
        );
      }

      await refreshAnalyticsViews();
      return updated
        ? {
            ideas: [updated.idea],
            source: updated.source ?? "openai",
            message: updated.message ?? "Idea regenerated.",
          }
        : null;
    },
    [refreshAnalyticsViews],
  );

  const approveReviewAction = useCallback(
    async (reviewId: string, reviewer: string, notes: string) => {
      const updated = await approveReview(reviewId, reviewer, notes);
      setVideoReviewQueueState(updated);
      await refreshAnalyticsViews();
    },
    [refreshAnalyticsViews],
  );

  const rejectReviewAction = useCallback(
    async (reviewId: string, reviewer: string, notes: string) => {
      const updated = await rejectReview(reviewId, reviewer, notes);
      setVideoReviewQueueState(updated);
      await refreshAnalyticsViews();
    },
    [refreshAnalyticsViews],
  );

  const requestVideoGenerationAction = useCallback(
    async (reviewId: string) => requestVideoGeneration(reviewId),
    [],
  );

  const savePublishingItemAction = useCallback(async (item: PublishingQueueEntry) => {
    const updated = await savePublishingItem(item);
    setPublishingQueueState(updated);
  }, []);

  const markReadyToPublishAction = useCallback(async (itemId: string) => {
    const updatedQueue = await markReadyToPublish(itemId);
    setPublishingQueueState(updatedQueue);

    const publishResult = await attemptPublish(itemId);
    if (publishResult.result) {
      setPublishingQueueState(publishResult.queue);
    }
  }, []);

  const attemptPublishAction = useCallback(async (itemId: string) => {
    const publishResult = await attemptPublish(itemId);
    if (publishResult.result) {
      setPublishingQueueState(publishResult.queue);
    }
  }, []);

  const resetPublishingQueueAction = useCallback(async () => {
    const updated = await resetPublishingQueue();
    setPublishingQueueState(updated);
  }, []);

  const value = useMemo<StudioDataContextValue>(
    () => ({
      loading,
      brandProfile: brandProfileState,
      personas: personasState,
      products: productsState,
      contentIdeas: contentIdeasState,
      videoReviewQueue: videoReviewQueueState,
      publishingQueue: publishingQueueState,
      analyticsSnapshot: analyticsSnapshotState,
      dashboardSummary: dashboardSummaryState,
      systemStatus: systemStatusState,
      generationOptions: generationOptionsState,
      publishingOptions: publishingOptionsState,
      saveBrandProfile: saveBrandProfileAction,
      resetBrandProfile: resetBrandProfileAction,
      createPersona: createPersonaAction,
      updatePersona: updatePersonaAction,
      deletePersona: deletePersonaAction,
      resetPersonas: resetPersonasAction,
      createProduct: createProductAction,
      updateProduct: updateProductAction,
      deleteProduct: deleteProductAction,
      resetProducts: resetProductsAction,
      generateIdeas: generateIdeasAction,
      saveContentIdea: saveContentIdeaAction,
      generateVisualPlanForIdea: generateVisualPlanForIdeaAction,
      markContentIdeaReadyForReview: markContentIdeaReadyForReviewAction,
      sendContentIdeaToReview: sendContentIdeaToReviewAction,
      archiveContentIdea: archiveContentIdeaAction,
      regenerateContentIdea: regenerateContentIdeaAction,
      approveReview: approveReviewAction,
      rejectReview: rejectReviewAction,
      requestVideoGeneration: requestVideoGenerationAction,
      savePublishingItem: savePublishingItemAction,
      markReadyToPublish: markReadyToPublishAction,
      attemptPublish: attemptPublishAction,
      resetPublishingQueue: resetPublishingQueueAction,
      refreshStudioData,
    }),
    [
      loading,
      brandProfileState,
      personasState,
      productsState,
      contentIdeasState,
      videoReviewQueueState,
      publishingQueueState,
      analyticsSnapshotState,
      dashboardSummaryState,
      systemStatusState,
      generationOptionsState,
      publishingOptionsState,
      saveBrandProfileAction,
      resetBrandProfileAction,
      createPersonaAction,
      updatePersonaAction,
      deletePersonaAction,
      resetPersonasAction,
      createProductAction,
      updateProductAction,
      deleteProductAction,
      resetProductsAction,
      generateIdeasAction,
      saveContentIdeaAction,
      generateVisualPlanForIdeaAction,
      markContentIdeaReadyForReviewAction,
      sendContentIdeaToReviewAction,
      archiveContentIdeaAction,
      regenerateContentIdeaAction,
      approveReviewAction,
      rejectReviewAction,
      requestVideoGenerationAction,
      savePublishingItemAction,
      markReadyToPublishAction,
      attemptPublishAction,
      resetPublishingQueueAction,
      refreshStudioData,
    ],
  );

  return (
    <StudioDataContext.Provider value={value}>{children}</StudioDataContext.Provider>
  );
}

export function useStudioBrand() {
  const context = useStudioDataContext();

  return {
    loading: context.loading,
    brandProfile: context.brandProfile,
    saveBrandProfile: context.saveBrandProfile,
    resetBrandProfile: context.resetBrandProfile,
  };
}

export function useStudioPersonas() {
  const context = useStudioDataContext();

  return {
    loading: context.loading,
    personas: context.personas,
    createPersona: context.createPersona,
    updatePersona: context.updatePersona,
    deletePersona: context.deletePersona,
    resetPersonas: context.resetPersonas,
  };
}

export function useStudioProducts() {
  const context = useStudioDataContext();

  return {
    loading: context.loading,
    products: context.products,
    createProduct: context.createProduct,
    updateProduct: context.updateProduct,
    deleteProduct: context.deleteProduct,
    resetProducts: context.resetProducts,
  };
}

export function useStudioContent() {
  const context = useStudioDataContext();

  return {
    loading: context.loading,
    contentIdeas: context.contentIdeas,
    videoReviewQueue: context.videoReviewQueue,
    generationOptions: context.generationOptions,
    generateIdeas: context.generateIdeas,
    saveContentIdea: context.saveContentIdea,
    generateVisualPlanForIdea: context.generateVisualPlanForIdea,
    markContentIdeaReadyForReview: context.markContentIdeaReadyForReview,
    sendContentIdeaToReview: context.sendContentIdeaToReview,
    archiveContentIdea: context.archiveContentIdea,
    regenerateContentIdea: context.regenerateContentIdea,
    approveReview: context.approveReview,
    rejectReview: context.rejectReview,
    requestVideoGeneration: context.requestVideoGeneration,
  };
}

export function useStudioPublishing() {
  const context = useStudioDataContext();

  return {
    loading: context.loading,
    publishingQueue: context.publishingQueue,
    publishingOptions: context.publishingOptions,
    savePublishingItem: context.savePublishingItem,
    markReadyToPublish: context.markReadyToPublish,
    attemptPublish: context.attemptPublish,
    resetPublishingQueue: context.resetPublishingQueue,
  };
}

export function useStudioAnalytics() {
  const context = useStudioDataContext();

  return {
    loading: context.loading,
    analyticsSnapshot: context.analyticsSnapshot,
    dashboardSummary: context.dashboardSummary,
    systemStatus: context.systemStatus,
    refreshStudioData: context.refreshStudioData,
  };
}
