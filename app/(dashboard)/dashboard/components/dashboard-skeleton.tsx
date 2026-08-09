import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/VStack";

export function DashboardSkeleton() {
  return (
    <VStack gap={8}>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} padding={5}>
            <VStack gap={3}>
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </VStack>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card padding={5}>
            <VStack gap={5}>
              <Skeleton className="h-6 w-32 rounded" />
              <VStack gap={3}>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
              </VStack>
            </VStack>
          </Card>
          <Card padding={5}>
            <VStack gap={5}>
              <Skeleton className="h-6 w-32 rounded" />
              <VStack gap={4}>
                <Skeleton className="h-12 w-full rounded" />
                <Skeleton className="h-12 w-full rounded" />
              </VStack>
            </VStack>
          </Card>
        </div>
        <VStack gap={6}>
          <Card padding={5}>
            <VStack gap={5}>
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-24 w-full rounded" />
            </VStack>
          </Card>
          <Card padding={5}>
            <VStack gap={5}>
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-24 w-full rounded" />
            </VStack>
          </Card>
        </VStack>
      </div>
    </VStack>
  );
}
