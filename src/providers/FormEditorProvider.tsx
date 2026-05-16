"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormValuesSchema } from "@dm-broo/common-types";
import type { FormValues } from "@dm-broo/common-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import { formService } from "@/api/services/forms";
import { formKeys } from "@/keys/react-query";
import type { FormDetail } from "@/api/services/forms/form";

// Default empty form state
const DEFAULT_FORM_VALUES: FormValues = {
  name: "Untitled Form",
  title: "",
  description: "",
  coverImage: undefined,
  fields: [],
  submitButtonLabel: "Submit",
};

interface FormEditorContextType {
  methods: ReturnType<typeof useForm<FormValues>>;
  save: (status: "DRAFT" | "PUBLISHED") => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  isMediaUploading: boolean;
  setIsMediaUploading: (uploading: boolean) => void;
  currentStatus?: "DRAFT" | "PUBLISHED";
  formId?: string;
  form?: FormDetail;
  isNameDialogOpen: boolean;
  setIsNameDialogOpen: (open: boolean) => void;
}

const FormEditorContext = createContext<FormEditorContextType | null>(null);

/**
 * FormEditorProvider wraps the form editor layout and pages.
 * It manages the shared react-hook-form state and the save/publish mutation.
 */
export const FormEditorProvider = ({
  children,
  formId,
}: {
  children: React.ReactNode;
  formId?: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Initialize form with defaults
  const methods = useForm<FormValues>({
    resolver: zodResolver(FormValuesSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onChange",
  });

  // Fetch form data if in "edit" mode (excluding "new" slug)
  const isExisting = !!formId && formId !== "new";
  const { data: form, isLoading: isFetching } = useQuery({
    queryKey: formKeys.detail(formId!),
    queryFn: () => formService.getById(formId!),
    enabled: isExisting,
  });

  // Pre-fill the form once data is loaded
  useEffect(() => {
    if (form) {
      methods.reset({
        name: form.name || "Untitled Form",
        title: form.title,
        description: form.description || "",
        coverImage: form.coverImage || undefined,
        fields: (form.fields || []) as any,
        submitButtonLabel: form.submitButtonLabel || "Submit",
      });
    }
  }, [form, methods]);

  // Mutation for creating or updating
  const saveForm = useMutation({
    mutationFn: (payload: FormValues & { status: "DRAFT" | "PUBLISHED" }) =>
      isExisting
        ? formService.update(formId!, payload)
        : formService.create(payload),
    onSuccess: (result, variables) => {
      toast.success(
        variables.status === "PUBLISHED"
          ? `Form published successfully`
          : "Form paused. Responses will no longer be accepted.",
      );
      queryClient.invalidateQueries({ queryKey: formKeys.all });
      if (isExisting) {
        queryClient.invalidateQueries({ queryKey: formKeys.detail(formId!) });
      }

      // Reset dirty state
      methods.reset(methods.getValues());

      // If it was a new form, redirect to its editor page
      if (!isExisting && result.id) {
        router.replace(`/dash/forms/${result.id}`);
      } else {
        router.refresh();
      }
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Something went wrong. Try again.";
      toast.error(message);
    },
  });

  const isSaving = saveForm.isPending;

  const [isMediaUploading, setIsMediaUploading] = React.useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = React.useState(false);

  // Combined loading state for header and canvas
  const isLoading = isFetching || isSaving || isMediaUploading;

  // Core save handler
  const save = useCallback(
    async (status: "DRAFT" | "PUBLISHED") => {
      if (isMediaUploading) {
        toast.error("Image being uploaded", {
          description: "Please wait for the banner to finish uploading.",
        });
        return;
      }

      const isValid = await methods.trigger();
      if (!isValid) {
        if (methods.formState.errors.name) {
          setIsNameDialogOpen(true);
        } else if (methods.formState.errors.fields) {
          toast.error("Form cannot be empty", {
            description: "Please provide atleast one fields",
          });
        } else {
          toast.error("Please fix the errors before saving.");
        }
        return;
      }

      const data = methods.getValues();

      // Guard: dropdown and checkbox fields must have at least one non-empty option
      const OPTION_FIELDS = ["dropdown", "checkbox"] as const;
      const emptyOptionField = data.fields.find(
        (f) =>
          OPTION_FIELDS.includes(f.type as (typeof OPTION_FIELDS)[number]) &&
          (f.options ?? []).filter((o) => o.label.trim() !== "").length === 0,
      );

      if (emptyOptionField) {
        toast.error(
          `"${emptyOptionField.label || emptyOptionField.type}" has no options`,
          {
            description: "Add at least one option before saving.",
          },
        );
        return;
      }

      await saveForm.mutateAsync({
        ...data,
        status,
        submitButtonLabel: data.submitButtonLabel || "Submit",
      });
    },
    [methods, saveForm, isMediaUploading],
  );

  return (
    <FormEditorContext.Provider
      value={{
        methods,
        save,
        isLoading,
        isSaving,
        isMediaUploading,
        setIsMediaUploading,
        currentStatus:
          form?.status === "DRAFT" || form?.status === "PUBLISHED"
            ? form.status
            : undefined,
        formId: isExisting ? formId : undefined,
        form, // Expose raw form data
        isNameDialogOpen,
        setIsNameDialogOpen,
      }}
    >
      {children}
    </FormEditorContext.Provider>
  );
};

// Hook for components in the layout or page to access the form state
export const useFormEditor = () => {
  const context = useContext(FormEditorContext);
  if (!context) {
    throw new Error("useFormEditor must be used within a FormEditorProvider");
  }
  return context;
};
