import { NextRequest } from "next/server";
import { duplicateForm } from "@/server/services/forms";
import { runWithErrorHandling } from "@/server/middleware/errors";
import { ApiRouteError } from "@/server/middleware/errors/classes";
import { getFeatureGates } from "@/server/services/billing/feature-gates";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return runWithErrorHandling(
    async ({ clerkId, instaAccountId }) => {
      const { access, state } = await getFeatureGates(clerkId!);

      if (!access.canCreateForms) {
        throw new ApiRouteError(
          "Your current plan does not allow lead generation forms. Please upgrade.",
          "FEATURE_GATED",
          403,
        );
      }

      const { id } = await params;
      return duplicateForm(clerkId!, instaAccountId!, id, state.maxForms);
    },
    { requireWorkspace: true },
  );
}
