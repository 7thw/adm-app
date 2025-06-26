import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { IconMusic, IconTrendingUp, IconVideo } from "@tabler/icons-react";
import { useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export function SectionCards() {
  const { isSignedIn } = useUser()

  // Get media data using simplified query (now returns array directly)
  const mediaData = useQuery(api.media.getAllMedia, isSignedIn ? {} : "skip");

  // Calculate counts - mediaData is now a simple array
  const audioCount = mediaData?.filter(media => media.mediaType === 'audio').length || 0;
  const videoCount = mediaData?.filter(media => media.mediaType === 'video').length || 0;
  const totalCount = mediaData?.length || 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconMusic className="w-4 h-4" />
            Audio Files
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {audioCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {audioCount > 0 ? `${Math.round((audioCount / totalCount) * 100)}%` : '0%'}
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconVideo className="w-4 h-4" />
            Video Files
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {videoCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {videoCount > 0 ? `${Math.round((videoCount / totalCount) * 100)}%` : '0%'}
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Media</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}
