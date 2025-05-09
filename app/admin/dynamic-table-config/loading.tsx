import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="h-10 w-[300px] mb-6" />
      <Skeleton className="h-4 w-full max-w-[600px] mb-8" />

      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-5 w-[150px] mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
            <div>
              <Skeleton className="h-5 w-[150px] mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
          </div>

          <div>
            <Skeleton className="h-5 w-[200px] mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="h-5 w-[150px] mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-full max-w-[300px]" />
              <Skeleton className="h-6 w-full max-w-[300px]" />
              <Skeleton className="h-6 w-full max-w-[300px]" />
            </div>
          </div>

          <div className="flex justify-end">
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
