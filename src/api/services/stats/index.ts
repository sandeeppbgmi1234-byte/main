import { api, request } from "@/api/client";
import { ApiResponse } from "@/api/types";
import {
  OutreachImpactResponse,
  FollowerGrowthResponse,
} from "@/api/services/stats/types";

export const statsService = {
  /**
   * Fetches total outreach executions and daily breakdown
   */
  getOutreachImpact: async (range: string): Promise<OutreachImpactResponse> => {
    const res = await request(
      api.get<ApiResponse<OutreachImpactResponse>>(
        `/stats/outreach-impact?range=${encodeURIComponent(range)}`,
      ),
    );
    return res.result;
  },

  /**
   * Fetches attributed followers gained via automations and daily net growth trend
   */
  getFollowerGrowth: async (range: string): Promise<FollowerGrowthResponse> => {
    const res = await request(
      api.get<ApiResponse<FollowerGrowthResponse>>(
        `/stats/followers-growth?range=${encodeURIComponent(range)}`,
      ),
    );
    return res.result;
  },

  /**
   * Fetches the best performing posts and optimal posting times
   */
  getBestPerformerStats: async (range: string): Promise<any> => {
    const res = await request(
      api.get<ApiResponse<any>>(
        `/stats/best-performer?range=${encodeURIComponent(range)}`,
      ),
    );
    return res.result;
  },
};
