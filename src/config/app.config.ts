export type ProviderConnectionStatus = "connected" | "not_connected";

export interface IntegrationProviderConfig {
  name: string;
  mode: "mock" | "live";
  status: ProviderConnectionStatus;
}

export interface AppConfig {
  providers: {
    ai: IntegrationProviderConfig;
    video: IntegrationProviderConfig;
    storage: IntegrationProviderConfig;
    instagram: IntegrationProviderConfig;
  };
}

export const appConfig: AppConfig = {
  providers: {
    ai: {
      name: "Mock AI Provider",
      mode: "mock",
      status: "connected",
    },
    video: {
      name: "Mock Video Engine",
      mode: "mock",
      status: "connected",
    },
    storage: {
      name: "Mock Storage Provider",
      mode: "mock",
      status: "connected",
    },
    instagram: {
      name: "Instagram Publisher",
      mode: "mock",
      status: "not_connected",
    },
  },
};
