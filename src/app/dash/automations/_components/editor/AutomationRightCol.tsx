"use client";

import {
  Control,
  useWatch,
  useFormContext,
  FieldValues,
} from "react-hook-form";
import {
  AskToFollow,
  OpeningMessage,
  PublicReplyToComments,
  SendDm,
} from "../widgets";
import {
  CommentsFormValues,
  StoryFormValues,
  RespondToAllDMsFormValues,
} from "@/configs/automations.config";

// Union of all form shapes that use the right column
type SupportedFormValues =
  | CommentsFormValues
  | StoryFormValues
  | RespondToAllDMsFormValues;

interface AutomationRightColProps<T extends FieldValues> {
  control: Control<T>;
  includePublicReply?: boolean;
  onIsUploadingChange?: (isUploading: boolean) => void;
}

/**
 * Standard right column widgets for all automation editors.
 * Using useWatch instead of nested Controller chains for cleaner JSX.
 */
export function AutomationRightCol<T extends SupportedFormValues>({
  control,
  includePublicReply = false,
  onIsUploadingChange,
}: AutomationRightColProps<T>) {
  // Flatten all field values via useWatch — avoids the nested Controller pyramid
  const [
    publicReplyEnabled,
    publicReplies,
    openingMessageEnabled,
    openingMessage,
    openingButtonText,
    dmMessage,
    dmImage,
    dmLinks,
    askToFollowEnabled,
    askToFollowMessage,
  ] = useWatch({
    control,
    name: [
      "publicReplyEnabled" as any,
      "publicReplies" as any,
      "openingMessageEnabled" as any,
      "openingMessage" as any,
      "openingButtonText" as any,
      "dmMessage" as any,
      "dmImage" as any,
      "dmLinks" as any,
      "askToFollowEnabled" as any,
      "askToFollowMessage" as any,
    ],
  });

  const { setValue } = useFormContext<T>();

  return (
    <div className="space-y-4 w-full flex flex-col items-center">
      <SendDm
        message={(dmMessage as any) ?? ""}
        onMessageChange={(v) =>
          setValue("dmMessage" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        imageUrl={dmImage as any}
        onImageChange={(v) =>
          setValue("dmImage" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        links={(dmLinks as any) ?? []}
        onLinksChange={(v) =>
          setValue("dmLinks" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        onIsUploadingChange={onIsUploadingChange}
      />

      <OpeningMessage
        enabled={!!openingMessageEnabled}
        onEnabledChange={(v) =>
          setValue("openingMessageEnabled" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        message={(openingMessage as any) ?? ""}
        onMessageChange={(v) =>
          setValue("openingMessage" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        buttonText={(openingButtonText as any) ?? ""}
        onButtonTextChange={(v) =>
          setValue("openingButtonText" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
      />

      <AskToFollow
        enabled={!!askToFollowEnabled}
        onEnabledChange={(v) =>
          setValue("askToFollowEnabled" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        message={(askToFollowMessage as any) ?? ""}
        onMessageChange={(v) =>
          setValue("askToFollowMessage" as any, v as any, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
      />

      {includePublicReply && (
        <PublicReplyToComments
          enabled={!!publicReplyEnabled}
          onEnabledChange={(v) =>
            setValue("publicReplyEnabled" as any, v as any, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
          replies={(publicReplies as any) ?? []}
          onRepliesChange={(v) =>
            setValue("publicReplies" as any, v as any, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
        />
      )}
    </div>
  );
}
