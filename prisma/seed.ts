import { PrismaClient } from "@prisma/client";
import {
  brandProfile,
  contentIdeas,
  personaProfiles,
  productLibraryItems,
  publishingQueueEntries,
  videoReviewQueue,
} from "../src/data/mock-studio";

const prisma = new PrismaClient();

async function seed() {
  await prisma.$transaction([
    prisma.brand.deleteMany(),
    prisma.persona.deleteMany(),
    prisma.product.deleteMany(),
    prisma.videoAsset.deleteMany(),
    prisma.contentIdea.deleteMany(),
    prisma.reviewItem.deleteMany(),
    prisma.publishingQueue.deleteMany(),
  ]);

  await prisma.brand.create({
    data: {
      brandName: brandProfile.brandName,
      brandVoice: brandProfile.brandVoice,
      targetCustomer: brandProfile.targetCustomer,
      styleKeywords: brandProfile.styleKeywords,
      doNotUseList: brandProfile.doNotUseList,
      preferredColors: brandProfile.preferredColors,
      productCategories: brandProfile.productCategories,
      instagramHandle: brandProfile.instagramHandle,
    },
  });

  await prisma.persona.createMany({
    data: personaProfiles.map((persona) => ({
      id: persona.id,
      name: persona.name,
      label: persona.label,
      ageRange: persona.ageRange,
      styleVibe: persona.styleVibe,
      audienceFit: persona.audienceFit,
      bestUseCases: persona.bestUseCases,
      contentTone: persona.contentTone,
      recommendedScenes: persona.recommendedScenes,
      preferredColors: persona.preferredColors,
      jewelryFit: persona.jewelryFit,
      avoidList: persona.avoidList,
      promptStarter: persona.promptStarter,
      bestContentTypes: persona.recommendedFor.bestContentTypes,
      bestMoods: persona.recommendedFor.bestMoods,
      bestProductCategories: persona.recommendedFor.bestProductCategories,
      status: persona.status,
    })),
  });

  await prisma.product.createMany({
    data: productLibraryItems.map((product) => ({
      id: product.id,
      productName: product.productName,
      category: product.category,
      material: product.material,
      color: product.color,
      styleTags: product.styleTags,
      productNotes: product.productNotes,
      imageDataUrl: product.imageDataUrl,
      imageName: product.imageName,
    })),
  });

  await prisma.contentIdea.createMany({
    data: contentIdeas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      personaId: idea.personaId,
      personaName: idea.personaName,
      productId: null,
      productName: idea.products[0] ?? null,
      platform: "Instagram Reels",
      mood: null,
      contentType: null,
      status: idea.status,
      products: idea.products,
      theme: idea.theme,
      concept: idea.concept,
      visualDirection: idea.visualDirection ?? null,
      visualPlan: idea.visualPlan ? JSON.stringify(idea.visualPlan) : null,
      hook: idea.hook,
      captionAngle: idea.captionAngle,
      cta: idea.cta ?? null,
      priority: idea.priority,
      autoSaved: idea.autoSaved ?? true,
      targetLaunch: idea.targetLaunch,
    })),
  });

  await prisma.videoAsset.createMany({
    data: contentIdeas.map((idea) => ({
      id: `video-asset-${idea.id}`,
      contentIdeaId: idea.id,
      status: "draft",
      videoUrl: null,
      thumbnailUrl: null,
      generationNotes:
        "Video not generated yet. Create a visual plan first, then connect a video provider in a future phase.",
      provider: "mock-video-pipeline",
    })),
  });

  await prisma.reviewItem.createMany({
    data: videoReviewQueue.map((item) => ({
      id: item.id,
      conceptTitle: item.conceptTitle,
      personaName: item.personaName,
      productName: item.productName,
      editor: item.editor,
      reviewer: item.reviewer,
      status: item.status,
      dueDate: item.dueDate,
      notes: item.notes,
      duration: item.duration,
    })),
  });

  await prisma.publishingQueue.createMany({
    data: publishingQueueEntries.map((item) => ({
      id: item.id,
      contentTitle: item.contentTitle,
      personaName: item.personaName,
      productName: item.productName,
      scheduledPublishDate: item.scheduledPublishDate,
      platform: item.platform,
      caption: item.caption,
      hashtags: item.hashtags,
      postingStatus: item.postingStatus,
    })),
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Failed to seed database:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
