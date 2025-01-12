import { LessonPlan } from "@/components/LessonPlan";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          System Administration and Maintenance: Website Portfolio Project
        </h1>
        <LessonPlan />
      </div>
    </div>
  )
}

