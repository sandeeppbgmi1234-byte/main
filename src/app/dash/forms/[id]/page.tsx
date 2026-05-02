"use client";

import { useFormEditor } from "@/providers/FormEditorProvider";
import React, { useEffect, useState } from "react";
import { FormProvider } from "react-hook-form";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useFormCanvasLogic } from "../_hooks/useFormCanvasLogic";
import {
  CoverImageUpload,
  FormTitleSection,
  AddFieldButton,
  SubmitButton,
  FieldCard,
} from "../_components/editor";

/**
 * Edit Form Page — Fetches form data via the layout's provider and renders the editor.
 * Now supports Drag and Drop reordering of fields.
 */
export default function EditFormPage() {
  const { methods, save, isLoading } = useFormEditor();
  const { fields, remove, move, handleAddField, handleCanvasSubmit } =
    useFormCanvasLogic(methods.control, save);

  // Avoid hydration mismatch with dnd-kit/@hello-pangea/dnd
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden rounded-lg">
      {/* Canvas scrollable area */}
      <div className="flex-1 overflow-y-auto rounded-lg">
        <FormProvider {...methods}>
          <form
            onSubmit={handleCanvasSubmit}
            className="max-w-xl mx-auto space-y-4 h-full flex flex-col justify-center items-center py-4"
          >
            {/* Form fixed elements */}
            <CoverImageUpload />
            <FormTitleSection />

            {/* Dynamic field list with Drag and Drop */}
            {enabled ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fields-list">
                  {(droppableProvided) => (
                    <div
                      {...droppableProvided.droppableProps}
                      ref={droppableProvided.innerRef}
                      className="w-full space-y-4 flex-1 min-h-0 overflow-y-auto no-scrollbar"
                    >
                      {fields.map((field, index) => (
                        <Draggable
                          key={field.id}
                          draggableId={field.id}
                          index={index}
                        >
                          {(draggableProvided) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                            >
                              <FieldCard
                                index={index}
                                onRemove={() => remove(index)}
                                dragHandleProps={
                                  draggableProvided.dragHandleProps
                                }
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {droppableProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="w-full space-y-4 flex-1 min-h-0 overflow-y-auto no-scrollbar">
                {fields.map((field, index) => (
                  <FieldCard
                    key={field.id}
                    index={index}
                    onRemove={() => remove(index)}
                  />
                ))}
              </div>
            )}

            {/* Form builder actions */}
            <AddFieldButton onAddField={handleAddField} />
            <SubmitButton disabled={isLoading} />
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
