"use client";

import { instagramService } from "@/api/services/instagram";
import { instagramKeys } from "@/keys/react-query";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import TemplateHeader from "./TemplateHeader";

export default function DMForComments({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  // useInfiniteQuery handles batch-by-batch fetching and anti-spam state automatically
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: instagramKeys.infinitePosts(),
      queryFn: ({ pageParam }) =>
        instagramService.profile.getUserPosts(false, pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.result.paging?.cursors?.after,
    });

  const handleRefresh = async () => {
    if (refreshingRef.current) return;
    try {
      refreshingRef.current = true;
      setIsRefreshing(true);
      // Trigger server-side sync
      await instagramService.profile.getUserPosts(true);
      // Refresh the entire infinite query list
      await queryClient.invalidateQueries({
        queryKey: instagramKeys.infinitePosts(),
      });
    } catch (e) {
      console.error("[DMForComments] Failed to refresh posts:", e);
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
    }
  };

  const posts = data?.pages.flatMap((page) => page.result.data) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <TemplateHeader
        title="Select Post/Reel"
        onBack={onBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || (isFetching && !isFetchingNextPage)}
      />
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 py-2">
        {posts.map((item) => {
          const previewUrl = item.thumbnail_url || item.media_url || "";

          return (
            <div
              key={item.id}
              className="h-[150px] w-[95px] bg-gray-50 rounded-lg border-2 border-transparent hover:border-purple-600 transition-all cursor-pointer flex items-center justify-center group overflow-hidden relative"
            >
              <Link
                href={`/dash/automations/new/comments/${item.id}`}
                className="w-full h-full"
              >
                <Image
                  src={previewUrl}
                  alt={item.caption || "Post preview"}
                  fill
                  className="object-cover"
                  unoptimized={previewUrl?.includes("fbcdn.net")}
                />
              </Link>
            </div>
          );
        })}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 px-6 py-2 text-xs font-semibold text-[#6A06E4] hover:text-[#5a05c4] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isFetchingNextPage ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <span className="capitalize">Show more</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
